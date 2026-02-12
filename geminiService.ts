
import { GoogleGenAI, Type } from "@google/genai";
import { DeductionCategory } from "./types";

// Initializing GoogleGenAI client with the mandatory process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateUniqueCode = async (planName: string, providerName: string, category: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a unique, short, professional 6-8 character payroll code (uppercase alphanumeric) for an HR deduction. 
    Plan: ${planName}, Provider: ${providerName}, Category: ${category}. 
    Return ONLY the code. Example: MED-BLU-01`,
  });
  return response.text.trim().toUpperCase();
};

export const parseBulkDeductions = async (rawText: string): Promise<any[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse the following text into a list of payroll deduction plans. Extract Plan Name, Provider Name, and Category.
    Text: ${rawText}
    
    Valid Categories are: ${Object.values(DeductionCategory).join(', ')}. 
    Map the extracted data to these categories accurately. 
    Also, generate a unique payroll code for each.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            planName: { type: Type.STRING },
            providerName: { type: Type.STRING },
            category: { type: Type.STRING },
            suggestedCode: { type: Type.STRING }
          },
          required: ["planName", "providerName", "category", "suggestedCode"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};
