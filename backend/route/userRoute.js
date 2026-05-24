import express from "express";
import isAuth from "../middleware/isAuth.js";
import { getCurrentUser, updateProfile, getAllUsers, updateUserByAdmin, deleteUserByAdmin } from "../controller/userController.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.get("/getcurrentuser", isAuth, getCurrentUser);

userRouter.put("/updateprofile", isAuth, upload.single("photoUrl"), updateProfile);

// Admin Routes
userRouter.get("/admin/users", isAuth, isAdmin, getAllUsers);
userRouter.put("/admin/users/:id", isAuth, isAdmin, updateUserByAdmin);
userRouter.delete("/admin/users/:id", isAuth, isAdmin, deleteUserByAdmin);

export default userRouter;
