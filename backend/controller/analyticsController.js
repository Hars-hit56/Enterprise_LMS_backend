import User from "../model/userModel.js";
import Course from "../model/courseModel.js";

export const getAdminStats = async (req, res) => {
  const users = await User.countDocuments();
  const courses = await Course.countDocuments();

  res.json({
    totalUsers: users,
    activeCourses: courses,
    completionRate: 70,
  });
};

export const getInstructorStats = async (req, res) => {
  try {
    const courses = await Course.find({ creator: req.userId });

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

    res.json({
      totalCourses,
      activeCourses,
      totalStudents: uniqueStudents.size,
      totalRevenue,
      totalLessons,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch instructor stats" });
  }
};

export const getStudentStats = async (req, res) => {
  res.json({
    enrolledCourses: 3,
    completedCourses: 1,
    avgScore: 80,
  });
};