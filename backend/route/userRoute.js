import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getCurrentUser,
  updateProfile,
  getAllUsers,
  updateUserByAdmin,
  updateUserByInstructor,
  deleteUserByAdmin,
} from "../controller/userController.js";
import { isAdmin, isInstructor } from "../middleware/roleMiddleware.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.get("/getcurrentuser", isAuth, getCurrentUser);

userRouter.put("/updateprofile", isAuth, upload.single("photoUrl"), updateProfile);

// Admin Routes
userRouter.get("/admin/users", isAuth, isAdmin, getAllUsers);
userRouter.put("/admin/users/:id", isAuth, isAdmin, updateUserByAdmin);
userRouter.delete("/admin/users/:id", isAuth, isAdmin, deleteUserByAdmin);

// Instructor Routes
userRouter.put("/instructor/users/:id", isAuth, isInstructor, updateUserByInstructor);

export default userRouter;
