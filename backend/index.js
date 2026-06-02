import express from "express";
import dotenv from "dotenv";
dotenv.config();

import connectDb from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./route/authRoute.js";
import courseRouter from "./route/courseRoute.js";
import userRouter from "./route/userRoute.js";
import enrollmentRouter from "./route/enrollmentRoute.js";
import assessmentRouter from "./route/assessmentRoute.js";
import analyticsRouter from "./route/analyticsRoute.js";
import recommendationRouter from "./route/recommendationRoute.js";


const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://enterprise-lms-frontend.vercel.app",
  ],
  credentials: true
}));

app.use("/api/auth", authRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);
app.use("/api/enrollment", enrollmentRouter);
app.use("/api/assessment", assessmentRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/recommendations", recommendationRouter);

app.get("/", (req, res) => {
  res.json({ message: "Server running" });
});

app.listen(PORT, () => {
  console.log(` Server running on :${PORT}`);
  connectDb();
});
