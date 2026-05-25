import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createAssessment,
  getAssessmentByCourse,
  getInstructorAssessments,
  submitAssessment,
  getAssessmentResult,
  updateAssessment,
  deleteAssessment,
} from "../controller/assessmentController.js";
import { isInstructor } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", isAuth, createAssessment);
router.get(
  "/instructor/assessments/:courseId",
  isAuth,
  isInstructor,
  getInstructorAssessments,
);
router.get("/:courseId", isAuth, getAssessmentByCourse);
router.post("/:id/submit", isAuth, submitAssessment);
router.get("/:id/result", isAuth, getAssessmentResult);
router.put("/:id", isAuth, updateAssessment);
router.delete("/:id", isAuth, deleteAssessment);

export default router;
