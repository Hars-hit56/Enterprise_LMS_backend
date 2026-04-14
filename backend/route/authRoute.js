import express from "express";
import { login, logout, signUp } from "../controller/authController.js";

const authRouter = express.Router();

// Auth routes
authRouter.post("/signup", signUp);
authRouter.post("/login", login);
authRouter.get("/logout", logout);

export default authRouter;
