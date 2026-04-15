const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function getApiUrl(path) {
  if (!API_BASE_URL) return path;

  try {
    const url = new URL(API_BASE_URL);
    return `${url.origin}${path}`;
  } catch {
    return path;
  }
}

export async function adminLogin(payload) {
  const response = await fetch(getApiUrl("/api/auth/admin/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Login failed.");
  }

  return data;
}

export async function adminLogout() {
  const response = await fetch(getApiUrl("/api/auth/admin/logout"), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed.");
  }

  return true;
}

export async function getAdminMe() {
  const response = await fetch(getApiUrl("/api/auth/admin/me"), {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error("Failed to load admin session.");
  }

  return data;
}