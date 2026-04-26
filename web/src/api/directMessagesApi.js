import api from "./axios";

export async function getDirectConversations() {
  const { data } = await api.get("/direct-messages/conversations");
  return data;
}

export async function getOrCreateDirectConversation(otherUserId) {
  const { data } = await api.post(`/direct-messages/conversations/with/${otherUserId}`);
  return data;
}

export async function getDirectMessages(conversationId, take = 50) {
  const { data } = await api.get(`/direct-messages/conversations/${conversationId}/messages`, {
    params: { take },
  });
  return data;
}

export async function markDirectConversationRead(conversationId) {
  const { data } = await api.post(`/direct-messages/conversations/${conversationId}/read`);
  return data;
}
