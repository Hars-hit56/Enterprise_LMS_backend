import Course from "../model/courseModel.js";
import Enrollment from "../model/enrollmentModel.js";
import AssessmentResult from "../model/assessmentResultModel.js";

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

const getCourseLectureIds = (course) => {
  if (!course?.modules) return [];

  return course.modules.flatMap((module) =>
    (module.lectures || []).map((lecture) => lecture?._id?.toString()),
  ).filter(Boolean);
};

const getCourseCompletion = (enrollment, course) => {
  const lectureIds = getCourseLectureIds(course);
  if (!lectureIds.length) return Number(enrollment.progress || 0);

  const lectureIdSet = new Set(lectureIds);
  const completedCount = new Set(
    (enrollment.completedLectures || [])
      .map((lectureId) => lectureId.toString())
      .filter((lectureId) => lectureIdSet.has(lectureId)),
  ).size;

  return Math.round((completedCount / lectureIds.length) * 100);
};

const buildCategoryProfile = (enrollments, assessmentResults) => {
  const profile = new Map();

  enrollments.forEach((enrollment) => {
    const course = enrollment.courseId;
    if (!course?.category) return;

    const category = course.category;
    const current = profile.get(category) || {
      enrolledCount: 0,
      progressTotal: 0,
      scoreTotal: 0,
      scoreCount: 0,
    };

    current.enrolledCount += 1;
    current.progressTotal += getCourseCompletion(enrollment, course);
    profile.set(category, current);
  });

  assessmentResults.forEach((result) => {
    const category = result.assessmentId?.courseId?.category;
    if (!category) return;

    const current = profile.get(category) || {
      enrolledCount: 0,
      progressTotal: 0,
      scoreTotal: 0,
      scoreCount: 0,
    };

    current.scoreTotal += Number(result.percentage || 0);
    current.scoreCount += 1;
    profile.set(category, current);
  });

  return profile;
};

const getRecommendedLevel = (averageScore) => {
  if (averageScore >= 80) return "Advanced";
  if (averageScore >= 55) return "Intermediate";
  return "Beginner";
};

const getCourseReason = ({ categoryMatch, levelMatch, popularity, isFree }) => {
  if (categoryMatch && levelMatch) {
    return "Matches your learning history and current performance level.";
  }

  if (categoryMatch) {
    return "Matches categories you are already learning.";
  }

  if (popularity > 0) {
    return "Popular with learners on the platform.";
  }

  if (isFree) {
    return "Free course you can start exploring.";
  }

  return "Useful course to expand your learning path.";
};

export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.userId;

    const enrollments = await Enrollment.find({ userId })
      .populate({
        path: "courseId",
        populate: {
          path: "modules.lectures",
          model: "Lecture",
        },
      })
      .lean();

    const enrolledCourseIds = enrollments
      .map((enrollment) => enrollment.courseId?._id?.toString())
      .filter(Boolean);

    const assessmentResults = await AssessmentResult.find({ userId })
      .populate({
        path: "assessmentId",
        populate: {
          path: "courseId",
          select: "category level title",
        },
      })
      .lean();

    const categoryProfile = buildCategoryProfile(enrollments, assessmentResults);
    const averageAssessmentScore = assessmentResults.length
      ? assessmentResults.reduce(
          (sum, result) => sum + Number(result.percentage || 0),
          0,
        ) / assessmentResults.length
      : 0;
    const recommendedLevel = getRecommendedLevel(averageAssessmentScore);

    const publishedCourses = await Course.find({
      isPublished: true,
      _id: { $nin: enrolledCourseIds },
    })
      .populate("creator", "name photoUrl")
      .lean();

    const courseRecommendations = publishedCourses
      .map((course) => {
        const categoryStats = categoryProfile.get(course.category);
        const categoryMatch = Boolean(categoryStats);
        const levelMatch = course.level === recommendedLevel;
        const popularity = course.enrolledStudents?.length || 0;

        let score = 20;
        if (categoryMatch) score += 35;
        if (levelMatch) score += 20;
        if (course.isFree) score += 5;
        score += Math.min(popularity * 2, 20);

        if (categoryStats?.scoreCount) {
          const categoryAverage =
            categoryStats.scoreTotal / categoryStats.scoreCount;
          if (categoryAverage < 55 && course.level === "Beginner") score += 15;
          if (categoryAverage >= 80 && course.level === "Advanced") score += 15;
        }

        return {
          course,
          score: clampScore(score),
          reason: getCourseReason({
            categoryMatch,
            levelMatch,
            popularity,
            isFree: course.isFree,
          }),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const materialRecommendations = enrollments
      .flatMap((enrollment) => {
        const course = enrollment.courseId;
        if (!course) return [];

        const completedLectures = new Set(
          (enrollment.completedLectures || []).map((lectureId) =>
            lectureId.toString(),
          ),
        );
        const completion = getCourseCompletion(enrollment, course);

        return (course.modules || []).flatMap((module) =>
          (module.lectures || [])
            .filter((lecture) => !completedLectures.has(lecture._id.toString()))
            .map((lecture) => ({
              courseId: course._id,
              courseTitle: course.title,
              category: course.category,
              moduleTitle: module.moduleTitle,
              lecture,
              score: clampScore(100 - completion),
              reason:
                completion < 50
                  ? "Continue this course to build your foundation."
                  : "Next incomplete lesson in your active course.",
            })),
        );
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return res.status(200).json({
      success: true,
      strategy: "rule_based_personalization",
      profile: {
        enrolledCourses: enrolledCourseIds.length,
        averageAssessmentScore: Math.round(averageAssessmentScore),
        recommendedLevel,
        preferredCategories: Array.from(categoryProfile.keys()),
      },
      courses: courseRecommendations,
      materials: materialRecommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to get recommendations ${error.message}`,
    });
  }
};
