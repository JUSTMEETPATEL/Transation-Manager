/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI, GoogleGenerativeAIError } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Import a simple async retry utility. In a real project, you might use a library
// like 'async-retry' or implement a more sophisticated one.
// For this example, I'll include a basic retry mechanism inline.

// Initialize the Google Generative AI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { description, counterparty, amount, type } = await request.json();

    // If it's a credit transaction, categorize as Income directly
    if (type === "credit") {
      return NextResponse.json({ category: "Income" });
    }

    // For debit transactions, use Gemini to analyze and categorize
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze this transaction and categorize it into exactly one of these categories:
      - Groceries
      - Dining
      - Entertainment
      - Transportation
      - Shopping
      - Utilities
      - Housing
      - Healthcare
      - Other

      Transaction details:
      - Merchant/Counterparty: ${counterparty}
      - Description: ${description}
      - Amount: ${amount}

      Respond with ONLY the category name, nothing else.
    `;

    // --- Start of Retry Logic ---
    const MAX_RETRIES = 5; // Maximum number of retries
    let retryDelayMs = 1000; // Initial delay of 1 second

    let category = "Other"; // Default category in case of repeated failures

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedCategory = response.text().trim();

        // Validate that the category is one of our predefined categories
        const validCategories = [
          "Groceries", "Dining", "Entertainment", "Transportation",
          "Shopping", "Utilities", "Housing", "Healthcare", "Other"
        ];

        category = validCategories.includes(generatedCategory) ? generatedCategory : "Other";

        // If successful, break out of the retry loop
        break;

      } catch (error: any) { // Catch any potential errors during the API call
        // Check if the error is a GoogleGenerativeAIError and specifically a 429 (Too Many Requests)
        if (error instanceof GoogleGenerativeAIError && error.message.includes("429 Too Many Requests")) {
          console.warn(
            `Attempt ${attempt + 1}/${MAX_RETRIES}: Quota exceeded. Retrying in ${retryDelayMs / 1000} seconds...`
          );
          // Wait for the calculated delay before the next attempt
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          // Exponentially increase the delay for the next retry
          retryDelayMs *= 2; // Double the delay for the next attempt
          // Add a small random jitter to the delay to prevent thundering herd problem
          retryDelayMs += Math.random() * 500; // Add up to 0.5 seconds of random delay
        } else {
          // If it's not a 429 error or max retries reached, re-throw or handle as a fatal error
          console.error(`Error during Gemini API call on attempt ${attempt + 1}:`, error);
          // If we are on the last attempt and it's still an error, we stop retrying
          if (attempt === MAX_RETRIES - 1) {
            throw error; // Re-throw the error if all retries fail or it's a non-429 error
          }
        }
      }
    }
    // --- End of Retry Logic ---

    // Return the categorized result
    return NextResponse.json({ category });

  } catch (error) {
    console.error("Failed to categorize transaction after all attempts:", error);
    return NextResponse.json(
      { error: "Failed to categorize transaction due to an internal error or persistent rate limits." },
      { status: 500 }
    );
  }
}
