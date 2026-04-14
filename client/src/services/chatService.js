import api from "./api";

export const chatService = {
  startConversation: (carId, initialMessage) =>
    api.post("/messages/conversation", { carId, initialMessage }),

  getConversations: () => api.get("/messages/conversations"),

  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),

  sendMessage: (conversationId, data) => api.post(`/messages/${conversationId}`, data),
};
