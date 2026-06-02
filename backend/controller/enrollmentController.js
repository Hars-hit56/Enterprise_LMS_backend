import Enrollment from "../model/enrollmentModel.js";
import Course from "../model/courseModel.js";
import mongoose from "mongoose";

const getCourseLectureIds = (course) => {
  if (!course?.modules) return [];

  return course.modules.flatMap((module) =>
    (module.lectures || []).map((lectureId) => lectureId.toString()),
  );
};

const calculateProgress = (completedLectures, totalLectures) => {
  if (!totalLectures) return 0;
  return Math.round((completedLectures.length / totalLectures) * 100);
};

const updateEnrollmentProgress = async ({
  userId,
  courseId,
  lectureId,
  markComplete,
}) => {
  if (
    !mongoose.Types.ObjectId.isValid(courseId) ||
    !mongoose.Types.ObjectId.isValid(lectureId)
  ) {
    return { status: 400, body: { message: "Invalid course or lecture id" } };
  }

  const course = await Course.findById(courseId).select("modules");
  if (!course) {
    return { status: 404, body: { message: "Course not found" } };
  }

  const courseLectureIds = getCourseLectureIds(course);
  if (!courseLectureIds.includes(lectureId)) {
    return {
      status: 400,
      body: { message: "Lecture does not belong to this course" },
    };
  }

  const enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) {
    return { status: 404, body: { message: "Enrollment not found" } };
  }

  const completedLectureIds = new Set(
    (enrollment.completedLectures || [])
      .map((id) => id.toString())
      .filter((id) => courseLectureIds.includes(id)),
  );

  if (markComplete) {
    completedLectureIds.add(lectureId);
  } else {
    completedLectureIds.delete(lectureId);
  }

  enrollment.completedLectures = Array.from(completedLectureIds);
  enrollment.progress = calculateProgress(
    enrollment.completedLectures,
    courseLectureIds.length,
  );

  await enrollment.save();

  return {
    status: 200,
    body: {
      message: markComplete
        ? "Lecture marked as complete"
        : "Lecture marked as incomplete",
      enrollment,
    },
  };
};

export const enrollCourse = async (req, res) => {
  const { courseId } = req.params;

  const exist = await Enrollment.findOne({
    userId: req.userId,
    courseId,
  });

  if (exist) return res.json({ message: "Course already purchased" });

  const enrollment = await Enrollment.create({
    userId: req.userId,
    courseId,
  });

  await Course.findByIdAndUpdate(courseId, {
    $push: { enrolledStudents: req.userId },
  });

  res.json({
    message: "Course purchased successfully",
    enrollment
  });
};

export const getMyCourses = async (req, res) => {
  const data = await Enrollment.find({ userId: req.userId })
    .populate("courseId")
    .lean();

  const courses = data.map((enrollment) => {
    const courseLectureIds = getCourseLectureIds(enrollment.courseId);
    const totalLectures = courseLectureIds.length;
    const completedLectures = (enrollment.completedLectures || []).filter(
      (lectureId) => courseLectureIds.includes(lectureId.toString()),
    );
    const progress = calculateProgress(completedLectures, totalLectures);

    return {
      ...enrollment,
      completedLectures,
      progress,
      totalLectures,
      completedLecturesCount: completedLectures.length,
    };
  });

  res.json(courses);
};

export const markLectureComplete = async (req, res) => {
  try {
    const result = await updateEnrollmentProgress({
      userId: req.userId,
      courseId: req.params.courseId,
      lectureId: req.params.lectureId,
      markComplete: true,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({
      message: `Failed to mark lecture complete ${error.message}`,
    });
  }
};

export const markLectureIncomplete = async (req, res) => {
  try {
    const result = await updateEnrollmentProgress({
      userId: req.userId,
      courseId: req.params.courseId,
      lectureId: req.params.lectureId,
      markComplete: false,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({
      message: `Failed to mark lecture incomplete ${error.message}`,
    });
  }
};
