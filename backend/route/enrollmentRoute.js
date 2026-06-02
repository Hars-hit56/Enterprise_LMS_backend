import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  enrollCourse,
  getMyCourses,
  markLectureComplete,
  markLectureIncomplete,
} from "../controller/enrollmentController.js";

const router = express.Router();
console.log("Enrollment routes loaded");

router.post("/:courseId", isAuth, enrollCourse);
router.get("/my", isAuth, getMyCourses);
router.put(
  "/:courseId/lectures/:lectureId/complete",
  isAuth,
  markLectureComplete,
);
router.put(
  "/:courseId/lectures/:lectureId/incomplete",
  isAuth,
  markLectureIncomplete,
);

export default router;
