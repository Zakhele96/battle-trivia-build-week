import api from "./axios";

export async function createChallengeInvite(payload) {
  const { data } = await api.post("/challenge-invites", payload);
  return data;
}

export async function getMyChallengeInvites() {
  const { data } = await api.get("/challenge-invites/mine");
  return data;
}

export async function acceptChallengeInvite(inviteId) {
  const { data } = await api.post(`/challenge-invites/${inviteId}/accept`);
  return data;
}
