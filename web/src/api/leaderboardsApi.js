import api from "./axios";

export async function getLeaderboard(mode, period = "current", take = 100) {
  const { data } = await api.get(`/leaderboards/${mode}`, {
    params: { period, take },
  });
  return data;
}