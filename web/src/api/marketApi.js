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

export async function getJseNews(take = 8) {
  const response = await fetch(getApiUrl(`/api/market/jse-news?take=${take}`), {
    method: "GET",
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error("Failed to load JSE news.");
  }

  return Array.isArray(data) ? data : [];
}