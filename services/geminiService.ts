import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY || "");

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for "Skills Connect", an artisan directory for the East Rand.
Help users find Pros like Plumbers or Electricians in Tsakane, Springs, and Brakpan.
Keep responses under 50 words and professional.
`;

export const getGeminiResponse = async (userMessage: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `${SYSTEM_INSTRUCTION}\n\nUser: ${userMessage}\nAssistant:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the server. Please check your internet and try again.";
  }
};

export const getConstructionEstimate = async (description: string, imageFiles: File[] = []) => {
  const responseText = await getGeminiResponse(
    `Please provide a short construction estimate for the following task: ${description}`
  );

  return {
    shareId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    tradeNeeded: "General Contractor",
    assumptions: responseText,
    diyHours: 8,
    riskFactor: 15,
    clarifyingQuestions: [],
    materialsBoM: [{ item: "Materials", cost: 1200 }],
    toolsBoM: [{ item: "Tools", cost: 350 }],
    userInput: description,
  };
};