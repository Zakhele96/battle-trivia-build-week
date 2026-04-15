import api from "./axios";

export async function getAdminTriviaQuestions(params = {}) {
  const { data } = await api.get("/admin/trivia-questions", { params });
  return data;
}

export async function getAdminTriviaQuestion(id) {
  const { data } = await api.get(`/admin/trivia-questions/${id}`);
  return data;
}

export async function createAdminTriviaQuestion(payload) {
  const { data } = await api.post("/admin/trivia-questions", payload);
  return data;
}

export async function updateAdminTriviaQuestion(id, payload) {
  const { data } = await api.put(`/admin/trivia-questions/${id}`, payload);
  return data;
}

export async function setAdminTriviaQuestionActive(id, isActive) {
  await api.patch(`/admin/trivia-questions/${id}/active`, null, {
    params: { isActive },
  });
}

export async function getBattleTriviaSettings() {
  const { data } = await api.get("/admin/battle-trivia/settings");
  return data;
}

export async function updateBattleTriviaSettings(payload) {
  const { data } = await api.put("/admin/battle-trivia/settings", payload);
  return data;
}