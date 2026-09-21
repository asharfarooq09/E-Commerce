import { GoogleGenerativeAI } from "@google/generative-ai";
import { env, isGeminiConfigured } from "../config/env";
import { AppError } from "../middleware/error-handler";

let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!isGeminiConfigured()) {
    throw new AppError(
      "Gemini is not configured. Set GEMINI_API_KEY in backend/.env (https://aistudio.google.com/apikey), or use Ollama as the chat/embedding provider.",
      503,
    );
  }

  if (!client) {
    client = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  }

  return client;
}
