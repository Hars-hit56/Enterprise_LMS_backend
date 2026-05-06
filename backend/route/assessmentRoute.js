import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createAssessment,
  getAssessmentByCourse,
  submitAssessment,
} from "../controller/assessmentController.js";

const router = express.Router();

router.post("/", isAuth, createAssessment);
router.get("/:courseId", isAuth, getAssessmentByCourse);
router.post("/:id/submit", isAuth, submitAssessment);

export default router;