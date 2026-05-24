import User from "../model/userModel.js";
import Course from "../model/courseModel.js";
import Enrollment from "../model/enrollmentModel.js";
import AssessmentResult from "../model/assessmentResultModel.js";
import Assessment from "../model/assessmentModel.js";

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalInstructor = await User.countDocuments({ role: "instructor" });
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalEnrolledStudent = await Enrollment.countDocuments();
    
    // Revenue and Lessons Calculation
    const allCourses = await Course.find();
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
      
      const dayStart = new Date(date.setHours(0,0,0,0));
      const dayEnd = new Date(date.setHours(23,59,59,999));

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

    // 2. Progress Tracking (Last 6 Weeks)
    const progressData = [];
    const allEnrollments = await Enrollment.find();

    for (let i = 5; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      
      const enrollmentsUpToNow = allEnrollments.filter(e => new Date(e.createdAt) <= weekEnd);
      const avgProgress = enrollmentsUpToNow.length > 0
        ? enrollmentsUpToNow.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrollmentsUpToNow.length
        : 0;

      progressData.push({
        name: `Week ${6 - i}`,
        progress: Math.round(avgProgress)
      });
    }

    res.json({
      totalUsers,
      totalCourses,
      totalInstructor,
      totalStudents,
      totalEnrolledStudent,
      totalRevenue,
      totalLessons,
      activeCourses: totalCourses, // Existing field mapping
      completionRate: 70, // Placeholder
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