import api from "./axios";

export async function getRooms() {
  const { data } = await api.get("/rooms");
  return data;
}

export async function getRoom(roomId) {
  const { data } = await api.get(`/rooms/${roomId}`);
  return data;
}

export async function getRoomMessages(roomId, take = 50) {
  const { data } = await api.get(`/rooms/${roomId}/messages`, {
    params: { take },
  });
  return data;
}

export async function getRoomSessionStatus(roomId) {
  const { data } = await api.get(`/rooms/${roomId}/session-status`);
  return data;
}

export async function getCurrentBattleTriviaLeaderboard(take = 3) {
  const { data } = await api.get("/battle-trivia/current-leaderboard", {
    params: { take },
  });
  return data;
}

export async function getRecentBattleTriviaWinners(take = 3) {
  const { data } = await api.get("/battle-trivia/recent-winners", {
    params: { take },
  });
  return data;
}

export async function getMyBattleTriviaProfileStats() {
  const { data } = await api.get("/battle-trivia/profile-stats/me");
  return data;
}

export async function getMyBattleTriviaSessionSummary() {
  const { data } = await api.get("/battle-trivia/session-summary/me");
  return data;
}

export async function getBattleTriviaSessionPodium() {
  const { data } = await api.get("/battle-trivia/session-summary/podium");
  return data;
}

export async function getMyRoomModerationState(roomId) {
  const { data } = await api.get(`/rooms/${roomId}/moderation-state/me`);
  return data;
}

export async function getWordScrambleSessionStatus(roomId) {
  const { data } = await api.get(`/rooms/${roomId}/word-scramble-status`);
  return data;
}

export async function getWordScrambleState(roomId) {
  const { data } = await api.get(`/rooms/${roomId}/word-scramble-state`);
  return data;
}