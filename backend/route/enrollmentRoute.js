import express from "express";
import isAuth from "../middleware/isAuth.js";
import { enrollCourse, getMyCourses } from "../controller/enrollmentController.js";

const router = express.Router();

router.post("/:courseId", isAuth, enrollCourse);
router.get("/my", isAuth, getMyCourses);

export default router;