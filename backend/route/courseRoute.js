import express from "express";
import {
  createCourse,
  getPublishedCourses,
  getCreatorCourses,
  editCourse,
  getCourseById,
  removeCourse,
  getCreatorById,
} from "../controller/courseController.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";

const courseRouter = express.Router();

// For Courses
courseRouter.post("/create", isAuth, upload.any(), createCourse);
courseRouter.get("/getpublished", getPublishedCourses);
courseRouter.get("/getcreator", isAuth, getCreatorCourses);
courseRouter.put(
  "/editcourse/:courseId",
  isAuth,
  upload.any(),
  editCourse,
);
courseRouter.get("/getcourse/:courseId", isAuth, getCourseById);
courseRouter.delete("/remove/:courseId", isAuth, removeCourse);
courseRouter.post("/creator", isAuth, getCreatorById);

export default courseRouter;
