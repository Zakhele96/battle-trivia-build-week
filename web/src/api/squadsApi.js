import api from "./axios";

export async function getMySquads() {
  const { data } = await api.get("/squads/mine");
  return data;
}

export async function createSquad(payload) {
  const { data } = await api.post("/squads", payload);
  return data;
}

export async function joinSquad(payload) {
  const { data } = await api.post("/squads/join", payload);
  return data;
}

export async function getSquadDetail(
  squadId,
  mode = "combined",
  period = "current"
) {
  const { data } = await api.get(`/squads/${squadId}`, {
    params: { mode, period },
  });
  return data;
}
