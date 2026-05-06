import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getAdminStats,
  getInstructorStats,
  getStudentStats,
} from "../controller/analyticsController.js";

const router = express.Router();

router.get("/admin", isAuth, getAdminStats);
router.get("/instructor", isAuth, getInstructorStats);
router.get("/student", isAuth, getStudentStats);

export default router;
