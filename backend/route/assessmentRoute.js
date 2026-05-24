import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createAssessment,
  getAssessmentByCourse,
  submitAssessment,
  getAssessmentResult,
  updateAssessment,
  deleteAssessment,
} from "../controller/assessmentController.js";

const router = express.Router();

router.post("/", isAuth, createAssessment);
router.get("/:courseId", isAuth, getAssessmentByCourse);
router.post("/:id/submit", isAuth, submitAssessment);
router.get("/:id/result", isAuth, getAssessmentResult);
router.put("/:id", isAuth, updateAssessment);
router.delete("/:id", isAuth, deleteAssessment);

export default router;