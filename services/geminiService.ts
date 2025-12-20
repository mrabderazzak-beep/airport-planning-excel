
import { GoogleGenAI } from "@google/genai";
import { PlanningData } from "../types";

export const getPlanningAudit = async (planning: PlanningData): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Sample some data to avoid token limits for massive sheets
    const sampleData = planning.rows.slice(0, 5).map(row => row.join(' | ')).join('\n');
    
    const prompt = `Analyze this shift planning data and provide a professional summary of coverage and any potential issues. 
    Planning Name: ${planning.name}
    Data Sample:
    ${sampleData}
    
    Keep the analysis concise and actionable for a manager. Respond in the language detected in the planning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating analysis. Please try again later.";
  }
};
