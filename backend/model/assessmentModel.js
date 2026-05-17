import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  point: {
    type: Number,
    required: true,
    default: 1,
  },

  question: {
    type: String,
    required: true,
  },

  options: {
    type: [String],
    required: true,
  },

  explanation: {
    type: String,
    default: "",
  },

  correctAnswer: {
    type: Number,
    required: true,
  },
});

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    questions: [questionSchema],

    timeLimit: {
      type: Number,
      default: 0,
    },

    passingScore: {
      type: Number,
      default: 0,
    },

    maxAttempt: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Assessment", assessmentSchema);
