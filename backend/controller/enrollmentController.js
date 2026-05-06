import Enrollment from "../model/enrollmentModel.js";
import Course from "../model/courseModel.js";

export const enrollCourse = async (req, res) => {
  const { courseId } = req.params;

  const exist = await Enrollment.findOne({
    userId: req.userId,
    courseId,
  });

  if (exist) return res.json({ message: "Already enrolled" });

  const enrollment = await Enrollment.create({
    userId: req.userId,
    courseId,
  });

  await Course.findByIdAndUpdate(courseId, {
    $push: { enrolledStudents: req.userId },
  });

  res.json(enrollment);
};

export const getMyCourses = async (req, res) => {
  const data = await Enrollment.find({ userId: req.userId }).populate(
    "courseId",
  );
  res.json(data);
};
