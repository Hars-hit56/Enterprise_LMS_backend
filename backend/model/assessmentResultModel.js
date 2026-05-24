import mongoose from "mongoose";

const questionResultSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  userAnswer: {
    type: String,
    default: null,
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    default: "",
  },
});

const assessmentResultSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    incorrectCount: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    status: {
      type: String,
      enum: ["PASS", "FAIL"],
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    questionResults: [questionResultSchema],
  },
  { timestamps: true },
);

export default mongoose.model("AssessmentResult", assessmentResultSchema);
