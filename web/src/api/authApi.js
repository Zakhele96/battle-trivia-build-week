import api from "./axios";

export async function register(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put("/profile", payload);
  return data;
}
export async function googleLogin(payload) {
  const body =
    typeof payload === "string" ? { idToken: payload } : payload;
  const { data } = await api.post("/auth/google", body);
  return data;
}
