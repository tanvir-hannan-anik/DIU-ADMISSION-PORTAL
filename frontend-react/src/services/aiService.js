import axios from "axios";
import API_CONFIG, { API_ENDPOINTS } from "../config/apiConfig";
import api from "./api";

const aiApi = axios.create({
  baseURL: API_CONFIG.AI_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// Fire-and-forget log to the Spring backend so the admin Chat Analytics view has
// real data. Never blocks or breaks the chat if it fails.
const logChat = (moduleType, question, answered, responseTimeMs) => {
  try {
    const bn = /[ঀ-৿]/.test(question || "") ? "bn" : "en";
    api
      .post("/v1/chat/log", {
        moduleType,
        question,
        answered,
        responseTimeMs,
        lang: bn,
      })
      .catch(() => {});
  } catch {
    /* ignore */
  }
};

export const aiService = {
  processPrompt: async (promptData) => {
    const started = Date.now();
    try {
      const response = await aiApi.post(API_ENDPOINTS.AI.PROCESS_PROMPT, {
        prompt: promptData.prompt,
        context: promptData.context || "",
        userId: promptData.userId || "",
        moduleType: promptData.moduleType || "general",
        history: promptData.history || [],
      });

      const data = response.data?.data || response.data;
      const answerText = data?.response || data?.answer || "";
      logChat(
        promptData.moduleType || "general",
        promptData.prompt,
        !!answerText && answerText.trim().length > 0,
        Date.now() - started,
      );

      return {
        success: true,
        data,
      };
    } catch (error) {
      logChat(
        promptData.moduleType || "general",
        promptData.prompt,
        false,
        Date.now() - started,
      );
      const backendMessage = error.response?.data?.message;
      const exact413Message =
        "AI processing failed: Error code: 413 - {'error': {'message': 'Request Entity Too Large', 'type': 'invalid_request_error', 'code': 'request_too_large'}}";

      return {
        success: false,
        error:
          error.response?.status === 413
            ? exact413Message
            : backendMessage || error.message,
        errorCode: error.response?.data?.errorCode || "AI_ERROR",
      };
    }
  },

  checkHealth: async () => {
    try {
      const response = await aiApi.get(API_ENDPOINTS.AI.HEALTH);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("AI service health check failed:", error);
      return null;
    }
  },
};
