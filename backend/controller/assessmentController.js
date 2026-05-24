import Assessment from "../model/assessmentModel.js";
import AssessmentResult from "../model/assessmentResultModel.js";
import Course from "../model/courseModel.js";

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
    let correctCount = 0;
    let incorrectCount = 0;
    const questionResults = [];

    assessment.questions.forEach((q, index) => {
      // Assuming answers array contains the index of the option selected by the user
      // Example: answers = [0, 2, 1]
      const userAnswerIndex = answers[index];

      // If the user didn't answer, userAnswerIndex might be undefined or null
      const isCorrect = userAnswerIndex === q.correctAnswer;

      if (isCorrect) {
        score += q.point;
        correctCount++;
      } else {
        incorrectCount++;
      }

      const userAnswerText = (userAnswerIndex !== undefined && userAnswerIndex !== null && q.options[userAnswerIndex] !== undefined)
        ? q.options[userAnswerIndex]
        : "No answer provided";

      const correctAnswerText = q.options[q.correctAnswer];

      questionResults.push({
        question: q.question,
        isCorrect,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        explanation: q.explanation || ""
      });
    });

    const totalPoints = assessment.questions.reduce(
      (acc, q) => acc + q.point,
      0,
    );

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const passed = percentage >= assessment.passingScore;
    const status = passed ? "PASS" : "FAIL";

    // Save the result to the database
    const assessmentResult = await AssessmentResult.create({
      assessmentId: assessment._id,
      userId: req.userId, // Assuming req.user is set by isAuth middleware
      score,
      totalPoints,
      correctCount,
      incorrectCount,
      percentage,
      passed,
      status,
      totalQuestions: assessment.questions.length,
      questionResults
    });

    res.status(200).json({
      success: true,
      result: assessmentResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ASSESSMENT RESULT FOR STUDENT
export const getAssessmentResult = async (req, res) => {
  try {
    const { id } = req.params; // Assessment ID

    // Find the latest result for this user and assessment
    const result = await AssessmentResult.findOne({
      assessmentId: id,
      userId: req.userId,
    }).sort({ createdAt: -1 });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No result found for this assessment",
      });
    }

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE ASSESSMENT
export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    const course = await Course.findById(assessment.courseId);
    if (!course || course.creator.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this assessment" });
    }

    const updatedAssessment = await Assessment.findByIdAndUpdate(id, req.body, { new: true });

    res.status(200).json({
      success: true,
      message: "Assessment updated successfully",
      assessment: updatedAssessment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE ASSESSMENT
export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    const course = await Course.findById(assessment.courseId);
    if (!course || course.creator.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this assessment" });
    }

    await Assessment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Assessment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
