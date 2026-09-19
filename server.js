require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({
    message: "Student Expense AI Backend is running!",
  });
});

app.post("/recommendation", async (req, res) => {
  try {
    const { spendingData } = req.body;

    if (!spendingData) {
      return res.status(400).json({
        success: false,
        message: "Spending data is required.",
      });
    }

    console.log("Received spending data:");
    console.log(JSON.stringify(spendingData, null, 2));

    res.json({
      success: true,
      recommendations: [
        {
          type: "general",
          title: "Backend Test",
          message: "Flutter successfully sent your spending data to the backend.",
        },
      ],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to process recommendation request.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});