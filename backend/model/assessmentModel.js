import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    title: String,
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number,
      },
    ],
    timeLimit: Number,
    passingScore: Number,
  },
  { timestamps: true },
);

export default mongoose.model("Assessment", assessmentSchema);
