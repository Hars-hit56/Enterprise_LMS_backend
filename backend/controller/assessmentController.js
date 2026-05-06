import Assessment from "../model/assessmentModel.js";

export const createAssessment = async (req, res) => {
  const assessment = await Assessment.create(req.body);
  res.json(assessment);
};

export const getAssessmentByCourse = async (req, res) => {
  const data = await Assessment.find({ courseId: req.params.courseId });
  res.json(data);
};

export const submitAssessment = async (req, res) => {
  const { answers } = req.body;

  let score = Math.floor(Math.random() * 100); // basic

  res.json({ score });
};