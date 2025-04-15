"use server"

import { GoogleGenerativeAI } from "@google/generative-ai";

// Predefined categories
const VALID_CATEGORIES = [
  "Groceries", "Dining", "Entertainment", "Transportation", 
  "Shopping", "Utilities", "Housing", "Healthcare", "Other"
];

// Initialize the Google Generative AI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function categorizeTransaction(
  description: string, 
  counterparty: string, 
  amount: number, 
  type: string
): Promise<string> {
  try {
    // If it's a credit transaction, categorize as Income
    if (type === "credit") {
      return "Income";
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim();

    // Validate that the category is one of our predefined categories
    const finalCategory = VALID_CATEGORIES.includes(category) ? category : "Other";

    return finalCategory;
  } catch (error) {
    console.error("Error categorizing transaction with Gemini:", error);
    return "Other"; // Default to "Other" if categorization fails
  }
}

