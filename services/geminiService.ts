
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateTimerPresets = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a set of countdown timers for: "${prompt}". Provide up to 6 timers with labels and durations in seconds.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  durationSeconds: { type: Type.NUMBER }
                },
                required: ["label", "durationSeconds"]
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.timers || [];
  } catch (error) {
    console.error("Gemini preset generation failed:", error);
    return [];
  }
};
