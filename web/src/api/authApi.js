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

export async function facebookLogin(payload) {
  const body =
    typeof payload === "string" ? { accessToken: payload } : payload;
  const { data } = await api.post("/auth/facebook", body);
  return data;
}

export async function verifyEmail(payload) {
  const { data } = await api.post("/auth/verify-email", payload);
  return data;
}

export async function resendVerification(payload) {
  const { data } = await api.post("/auth/resend-verification", payload);
  return data;
}
