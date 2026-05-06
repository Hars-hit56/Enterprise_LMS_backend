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
  const courses = await Course.find({ creator: req.userId });

  res.json({
    totalCourses: courses.length,
    totalStudents: courses.reduce(
      (acc, c) => acc + c.enrolledStudents.length,
      0
    ),
  });
};

export const getStudentStats = async (req, res) => {
  res.json({
    enrolledCourses: 3,
    completedCourses: 1,
    avgScore: 80,
  });
};