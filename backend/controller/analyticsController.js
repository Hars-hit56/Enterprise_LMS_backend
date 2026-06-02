import User from "../model/userModel.js";
import Course from "../model/courseModel.js";
import Enrollment from "../model/enrollmentModel.js";
import AssessmentResult from "../model/assessmentResultModel.js";
import Assessment from "../model/assessmentModel.js";

const normalizeProgress = (progress) => {
  const value = Number(progress || 0);
  return Math.min(Math.max(value, 0), 100);
};

const getCourseLectureIds = (course) => {
  if (!course?.modules) return [];

  return course.modules.flatMap((module) =>
    (module.lectures || []).map((lectureId) => lectureId.toString()),
  );
};

const calculateEnrollmentProgress = (enrollment, course) => {
  const courseLectureIds = getCourseLectureIds(course);
  if (!courseLectureIds.length) return normalizeProgress(enrollment.progress);

  const courseLectureIdSet = new Set(courseLectureIds);
  const completedLectureIds = new Set(
    (enrollment.completedLectures || [])
      .map((lectureId) => lectureId.toString())
      .filter((lectureId) => courseLectureIdSet.has(lectureId)),
  );

  return Math.round((completedLectureIds.size / courseLectureIds.length) * 100);
};

const buildCourseProgressData = (courses, enrollments) => {
  const enrollmentsByCourse = new Map();

  enrollments.forEach((enrollment) => {
    const courseId = enrollment.courseId?.toString();
    if (!courseId) return;

    const courseEnrollments = enrollmentsByCourse.get(courseId) || [];
    courseEnrollments.push(enrollment);
    enrollmentsByCourse.set(courseId, courseEnrollments);
  });

  return courses.map((course) => {
    const courseEnrollments = enrollmentsByCourse.get(course._id.toString()) || [];
    const totalProgress = courseEnrollments.reduce(
      (sum, enrollment) => sum + calculateEnrollmentProgress(enrollment, course),
      0,
    );
    const progress = courseEnrollments.length
      ? Math.round(totalProgress / courseEnrollments.length)
      : 0;

    return {
      name: course.title,
      progress,
      enrollments: courseEnrollments.length,
      completed: courseEnrollments.filter(
        (enrollment) => calculateEnrollmentProgress(enrollment, course) >= 100,
      ).length,
    };
  });
};

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ isPublished: true });
    const totalAdmin = await User.countDocuments({ role: "admin" });
    const totalInstructor = await User.countDocuments({ role: "instructor" });
    const totalStudents = await User.countDocuments({ role: "student" });
    const enrolledStudentIds = await Enrollment.distinct("userId");

    const totalEnrolledStudent = enrolledStudentIds.length;

    // Revenue and Lessons Calculation
    const allCourses = await Course.find();
    const allEnrollments = await Enrollment.find();
    let totalRevenue = 0;
    let totalLessons = 0;

    allCourses.forEach(course => {
      const price = course.price || 0;
      const enrollments = course.enrolledStudents ? course.enrolledStudents.length : 0;
      totalRevenue += price * enrollments;

      if (course.modules) {
        course.modules.forEach(mod => {
          if (mod.lectures) totalLessons += mod.lectures.length;
        });
      }
    });

    // --- GRAPHS DATA ---

    // 1. User Engagement (Last 7 Days)
    const engagementData = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[(date.getDay() + 6) % 7]; // Adjust to start Mon

      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      // Active Users: Users who enrolled or interacted today
      const activeCount = await Enrollment.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });

      // Total Users: Cumulative users up to this day
      const cumulativeUsers = await User.countDocuments({
        createdAt: { $lte: dayEnd }
      });

      engagementData.push({
        name: dayName,
        activeUsers: activeCount,
        totalUsers: cumulativeUsers
      });
    }

    // 2. Course Progress Tracking
    const progressData = buildCourseProgressData(allCourses, allEnrollments);
    const coursesById = new Map(
      allCourses.map((course) => [course._id.toString(), course]),
    );
    const completedEnrollments = allEnrollments.filter((enrollment) => {
      const course = coursesById.get(enrollment.courseId?.toString());
      if (!course) return false;

      return calculateEnrollmentProgress(enrollment, course) >= 100;
    }).length;
    const completionRate = allEnrollments.length
      ? Math.round((completedEnrollments / allEnrollments.length) * 100)
      : 0;

    res.json({
      totalUsers,
      totalCourses,
      totalAdmin,
      totalInstructor,
      totalStudents,
      totalEnrolledStudent,
      totalRevenue,
      totalLessons,
      activeCourses,
      completionRate,
      engagementData,
      progressData
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};

export const getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.userId;
    const courses = await Course.find({ creator: instructorId });
    const courseIds = courses.map(c => c._id);

    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.isPublished).length;

    const uniqueStudents = new Set();
    let totalRevenue = 0;
    let totalLessons = 0;

    courses.forEach((course) => {
      if (course.modules) {
        course.modules.forEach(mod => {
          if (mod.lectures) totalLessons += mod.lectures.length;
        });
      }

      if (course.enrolledStudents) {
        course.enrolledStudents.forEach((studentId) => {
          uniqueStudents.add(studentId.toString());
        });

        const coursePrice = course.price || 0;
        totalRevenue += coursePrice * course.enrolledStudents.length;
      }
    });

    // --- ENHANCED ANALYTICS FOR GRAPHS ---

    // 1. User Engagement (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEnrollments = await Enrollment.find({
      courseId: { $in: courseIds },
      createdAt: { $gte: sevenDaysAgo }
    });

    const assessments = await Assessment.find({ courseId: { $in: courseIds } });
    const assessmentIds = assessments.map(a => a._id);

    const recentSubmissions = await AssessmentResult.find({
      assessmentId: { $in: assessmentIds },
      createdAt: { $gte: sevenDaysAgo }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const engagementData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];

      const enrollCount = recentEnrollments.filter(e =>
        new Date(e.createdAt).toDateString() === date.toDateString()
      ).length;

      const submissionCount = recentSubmissions.filter(s =>
        new Date(s.createdAt).toDateString() === date.toDateString()
      ).length;

      engagementData.push({
        name: dayName,
        enrollments: enrollCount,
        submissions: submissionCount
      });
    }

    // 2. Course Progress Tracking
    const allEnrollments = await Enrollment.find({ courseId: { $in: courseIds } });
    const progressData = buildCourseProgressData(courses, allEnrollments);

    res.json({
      totalCourses,
      activeCourses,
      totalStudents: uniqueStudents.size,
      totalRevenue,
      totalLessons,
      engagementData,
      progressData
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Failed to fetch instructor stats" });
  }
};

export const getInstructorStudents = async (req, res) => {
  try {
    const instructorId = req.userId;
    const courses = await Course.find({ creator: instructorId }).populate({
      path: "enrolledStudents",
      select: "name email role status createdAt",
    });

    const studentMap = new Map();

    courses.forEach((course) => {
      course.enrolledStudents.forEach((student) => {
        if (!studentMap.has(student._id.toString())) {
          studentMap.set(student._id.toString(), {
            id: student._id,
            name: student.name,
            email: student.email,
            role: student.role,
            status: student.status,
            joined: student.createdAt,
          });
        }
      });
    });

    const students = Array.from(studentMap.values());

    res.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("GetInstructorStudents Error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const getStudentStats = async (req, res) => {
  res.json({
    enrolledCourses: 3,
    completedCourses: 1,
    avgScore: 80,
  });
};
