import Assessment from "../model/assessmentModel.js";

// CREATE ASSESSMENT
export const createAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.create(req.body);

    res.status(201).json({
      success: true,
      message: "Assessment created successfully",
      assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ASSESSMENT BY COURSE
export const getAssessmentByCourse = async (req, res) => {
  try {
    const assessment = await Assessment.find({
      courseId: req.params.courseId,
    });

    res.status(200).json({
      success: true,
      assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SUBMIT ASSESSMENT
export const submitAssessment = async (req, res) => {
  try {
    const { answers } = req.body;

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    let score = 0;

    assessment.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        score += q.point;
      }
    });

    const totalPoints = assessment.questions.reduce(
      (acc, q) => acc + q.point,
      0,
    );

    const percentage = (score / totalPoints) * 100;

    const passed = percentage >= assessment.passingScore;

    res.status(200).json({
      success: true,
      score,
      totalPoints,
      percentage,
      passed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
