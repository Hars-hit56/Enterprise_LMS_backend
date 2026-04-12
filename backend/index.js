import express from "express";

const app = express();
app.use(express.json());


const PORT = process.env.PORT || 3000;


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running "
  });
});


app.listen(PORT, () => {
  console.log(` Server running on :${PORT}`);
});