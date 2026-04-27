import api from "./axios";

export async function getMyProfile() {
  const { data } = await api.get("/profile/me");
  return data;
}

export async function getUserProfile(userId) {
  const { data } = await api.get(`/profile/users/${userId}`);
  return data;
}

export async function updateMyProfile(payload) {
  const { data } = await api.put("/profile", payload);
  return data;
}

export async function changeMyPassword(payload) {
  const { data } = await api.put("/profile/password", payload);
  return data;
}

export async function getMyProfileHistory(page = 1, pageSize = 10) {
  const { data } = await api.get("/profile/history", {
    params: { page, pageSize },
  });
  return data;
}

export async function getMyProgression() {
  const { data } = await api.get("/profile/progression");
  return data;
}

export async function getMyMissions() {
  const { data } = await api.get("/profile/missions");
  return data;
}
