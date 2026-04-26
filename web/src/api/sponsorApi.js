import api from "./axios";

export async function getActiveSponsor(mode) {
  const { data } = await api.get("/sponsors/active", {
    params: { mode },
  });
  return data;
}
