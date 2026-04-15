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

export async function createSubscriber(payload) {
  const response = await fetch(getApiUrl("/api/subscribers"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.title ||
      data?.message ||
      "Failed to subscribe.";
    throw new Error(message);
  }

  return data;
}