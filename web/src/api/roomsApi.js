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

export async function getRoomMessageContext(
  roomId,
  messageId,
  before = 25,
  after = 25
) {
  const { data } = await api.get(`/rooms/${roomId}/messages/${messageId}/context`, {
    params: { before, after },
  });
  return data;
}

export async function getUnreadMentions(take = 20) {
  const { data } = await api.get("/rooms/mentions/unread", {
    params: { take },
  });
  return data;
}

export async function markMessageMentionRead(messageId) {
  const { data } = await api.post(`/rooms/messages/${messageId}/mention-read`);
  return data;
}

export async function markRoomMentionsRead(roomId) {
  await api.post(`/rooms/${roomId}/mentions/read`);
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