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

export async function getAdminWordScrambleWords(params = {}) {
  const { data } = await api.get("/admin/word-scramble/words", { params });
  return data;
}

export async function getAdminWordScrambleWord(id) {
  const { data } = await api.get(`/admin/word-scramble/words/${id}`);
  return data;
}

export async function createAdminWordScrambleWord(payload) {
  const { data } = await api.post("/admin/word-scramble/words", payload);
  return data;
}

export async function updateAdminWordScrambleWord(id, payload) {
  const { data } = await api.put(`/admin/word-scramble/words/${id}`, payload);
  return data;
}

export async function setAdminWordScrambleWordActive(id, isActive) {
  await api.patch(`/admin/word-scramble/words/${id}/active`, null, {
    params: { isActive },
  });
}

export async function getAdminUsers(params = {}) {
  const { data } = await api.get("/admin/users", { params });
  return data;
}

export async function getAdminGrowthSnapshot() {
  const { data } = await api.get("/admin/growth/snapshot");
  return data;
}

export async function setAdminUserAccess(userId, isAdmin) {
  const { data } = await api.patch(`/admin/users/${userId}/admin`, {
    isAdmin,
  });
  return data;
}

export async function getAdminLeaderboardSponsors() {
  const { data } = await api.get("/admin/leaderboard-sponsors");
  return data;
}

export async function createAdminLeaderboardSponsor(payload) {
  const { data } = await api.post("/admin/leaderboard-sponsors", payload);
  return data;
}

export async function updateAdminLeaderboardSponsor(id, payload) {
  const { data } = await api.put(`/admin/leaderboard-sponsors/${id}`, payload);
  return data;
}

export async function setAdminLeaderboardSponsorActive(id, isActive) {
  const { data } = await api.patch(
    `/admin/leaderboard-sponsors/${id}/active`,
    null,
    { params: { isActive } }
  );
  return data;
}

export async function getBattleTriviaSettings() {
  const { data } = await api.get("/admin/battle-trivia/settings");
  return data;
}

export async function updateBattleTriviaSettings(payload) {
  const { data } = await api.put("/admin/battle-trivia/settings", payload);
  return data;
}
