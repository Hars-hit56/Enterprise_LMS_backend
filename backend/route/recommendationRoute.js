import express from "express";
import isAuth from "../middleware/isAuth.js";
import { getPersonalizedRecommendations } from "../controller/recommendationController.js";

const router = express.Router();

router.get("/", isAuth, getPersonalizedRecommendations);

export default router;
