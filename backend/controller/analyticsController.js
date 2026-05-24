import User from "../model/userModel.js";
import Course from "../model/courseModel.js";
import Enrollment from "../model/enrollmentModel.js";
import AssessmentResult from "../model/assessmentResultModel.js";
import Assessment from "../model/assessmentModel.js";

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

    // 2. Progress Tracking (Last 6 Weeks)
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42); // 6 * 7 days

    const allEnrollments = await Enrollment.find({ courseId: { $in: courseIds } });
    
    const progressData = [];
    for (let i = 5; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);

        const enrollmentsInWeek = allEnrollments.filter(e => {
            const created = new Date(e.createdAt);
            return created <= weekEnd;
        });

        const avgProgress = enrollmentsInWeek.length > 0
            ? enrollmentsInWeek.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrollmentsInWeek.length
            : 0;

        progressData.push({
            name: `Week ${6 - i}`,
            progress: Math.round(avgProgress)
        });
    }

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

export const getStudentStats = async (req, res) => {
  res.json({
    enrolledCourses: 3,
    completedCourses: 1,
    avgScore: 80,
  });
};