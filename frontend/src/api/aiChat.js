import { api, useMocks } from './client';
import { getAiResponse } from '../mocks/aiResponses';

export async function sendChatMessage(message, conversationHistory) {
  if (useMocks()) {
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1500));
    return getAiResponse(message);
  }

  return api.post('/ai/chat', {
    message,
    history: conversationHistory,
  });
}
