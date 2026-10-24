app.use(express.json({ limit: "1mb" }));

app.post("/recommendation", async (req, res) => {
  try {
    const { spendingData } = req.body ?? {};

    if (
      spendingData == null ||
      typeof spendingData !== "object" ||
      Array.isArray(spendingData)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid spending data is required.",
      });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",

      // Keep the instructions separate from the financial data.
      instructions: `
You are a financial recommendation assistant for college students.

Analyze the student's financial information and provide
personalized, practical, responsible recommendations.

IMPORTANT GUIDELINES:

1. Generate 3 to 5 relevant recommendations.
2. Each recommendation must contain type, title, and message.
3. Keep titles short and clear.
4. Each message must contain only 1 to 2 short sentences.
5. Use simple language suitable for college students.
6. Give actionable suggestions, not just observations.
7. Analyze the overall financial situation before giving advice.
8. Consider current budget, spending, remaining budget, days remaining,
   previous-month spending, spending categories, spending patterns,
   and relevant profile information when available.
9. Consider whether the current budget appears sufficient.
10. Do not automatically recommend reducing the highest spending category.
11. Treat essential expenses such as food and transportation carefully.
    Do not suggest further cuts when the data indicates these expenses
    are already low or the student's budget is very limited.
12. If the budget appears insufficient, explain this possibility instead
    of simply recommending cuts to essential expenses.
13. Low food spending does not automatically mean the student should
    spend less on food.
14. Do not make health or nutritional judgments from expense data.
15. Use location only as context for location-dependent expenses.
16. Do not invent local prices, fares, or other costs.
17. Do not invent missing financial information.
18. Offer suggestions, not commands or decisions on the student's behalf.
19. Avoid repeating the same advice.
20. Recommend only actions relevant to the student's actual situation.
    Do not force every recommendation category.

Only use facts supported by the supplied data. If information is missing,
avoid assumptions and give advice that remains useful and appropriate.

Possible recommendation types:
budget, spending, food, transportation, saving, trend, warning, general.

The type must match the main topic of the recommendation.
Return the structured recommendation data only.
      `,

      // Send financial information as data, not as instructions.
      input: JSON.stringify(spendingData),

      text: {
        format: {
          type: "json_schema",
          name: "financial_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                minItems: 3,
                maxItems: 5,
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: [
                        "budget",
                        "spending",
                        "food",
                        "transportation",
                        "saving",
                        "trend",
                        "warning",
                        "general",
                      ],
                    },
                    title: { type: "string" },
                    message: { type: "string" },
                  },
                  required: ["type", "title", "message"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    // Make sure the model returned usable JSON.
    if (!response.output_text) {
      throw new Error(
        `OpenAI returned no text. Status: ${response.status}`
      );
    }

    const result = JSON.parse(response.output_text);

    if (
      !Array.isArray(result.recommendations) ||
      result.recommendations.length < 3 ||
      result.recommendations.length > 5
    ) {
      throw new Error("The recommendation response is invalid.");
    }

    return res.json({
      success: true,
      recommendations: result.recommendations,
    });
  } catch (error) {
    // Keep detailed errors in your server logs, not in the app response.
    console.error("AI recommendation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendations. Please try again.",
    });
  }
});