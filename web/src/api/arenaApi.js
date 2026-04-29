import api from "./axios";

export async function getArenaChallenges(roomId, bucket = "all", take = 50) {
  const { data } = await api.get(`/rooms/${roomId}/arena/challenges`, {
    params: { bucket, take },
  });
  return data;
}

export async function getArenaChallengeDetail(roomId, challengeId) {
  const { data } = await api.get(
    `/rooms/${roomId}/arena/challenges/${challengeId}`
  );
  return data;
}

export async function createArenaChallenge(roomId, payload) {
  const { data } = await api.post(`/rooms/${roomId}/arena/challenges`, payload);
  return data;
}

export async function submitArenaEntry(roomId, challengeId, payload) {
  const { data } = await api.post(
    `/rooms/${roomId}/arena/challenges/${challengeId}/entries`,
    payload
  );
  return data;
}

export async function voteArenaEntry(roomId, challengeId, payload) {
  const { data } = await api.post(
    `/rooms/${roomId}/arena/challenges/${challengeId}/vote`,
    payload
  );
  return data;
}

export async function createArenaComment(roomId, challengeId, payload) {
  const { data } = await api.post(
    `/rooms/${roomId}/arena/challenges/${challengeId}/comments`,
    payload
  );
  return data;
}

export async function getArenaHallOfBars(roomId, take = 20) {
  const { data } = await api.get(`/rooms/${roomId}/arena/hall-of-bars`, {
    params: { take },
  });
  return data;
}

export async function getArenaLeaderboard(roomId, take = 20) {
  const { data } = await api.get(`/rooms/${roomId}/arena/leaderboard`, {
    params: { take },
  });
  return data;
}
