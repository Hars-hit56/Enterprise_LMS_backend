import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import authRouter from "./route/authRoute.js";

dotenv.config();

const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",authRouter)

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running ",
  });
});

app.listen(PORT, () => {
  console.log(` Server running on :${PORT}`);
  connectDb();
});
