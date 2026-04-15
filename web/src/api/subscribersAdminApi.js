import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SUBSCRIBERS_BASE_URL = `${API_BASE_URL}/subscribers`;

export async function getSubscribers(query = "", status = "all") {
  const response = await axios.get(SUBSCRIBERS_BASE_URL, {
    params: {
      q: query || undefined,
      status: status === "all" ? undefined : status,
    },
    withCredentials: true,
  });

  return Array.isArray(response.data) ? response.data : [];
}

export async function deactivateSubscriber(subscriberId) {
  const response = await axios.post(
    `${SUBSCRIBERS_BASE_URL}/${subscriberId}/deactivate`,
    null,
    { withCredentials: true }
  );

  return response.data;
}

export async function reactivateSubscriber(subscriberId) {
  const response = await axios.post(
    `${SUBSCRIBERS_BASE_URL}/${subscriberId}/reactivate`,
    null,
    { withCredentials: true }
  );

  return response.data;
}

export function getSubscribersExportUrl(query = "", status = "all") {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (status && status !== "all") {
    params.set("status", status);
  }

  const qs = params.toString();
  return `${SUBSCRIBERS_BASE_URL}/export${qs ? `?${qs}` : ""}`;
}