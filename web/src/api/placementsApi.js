import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PLACEMENTS_BASE_URL = `${API_BASE_URL}/placements`;

export async function getPlacementsByKey(placementKey) {
  const response = await axios.get(`${PLACEMENTS_BASE_URL}/${placementKey}`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function getAdminPlacements(query = "", status = "all", placementKey = "all") {
  const response = await axios.get(`${PLACEMENTS_BASE_URL}/admin`, {
    params: {
      q: query || undefined,
      status: status === "all" ? undefined : status,
      placementKey: placementKey === "all" ? undefined : placementKey,
    },
    withCredentials: true,
  });

  return Array.isArray(response.data) ? response.data : [];
}

export async function getAdminPlacementById(id) {
  const response = await axios.get(`${PLACEMENTS_BASE_URL}/admin/${id}`, {
    withCredentials: true,
  });

  return response.data;
}

export async function createPlacement(payload) {
  const response = await axios.post(`${PLACEMENTS_BASE_URL}/admin`, payload, {
    withCredentials: true,
  });

  return response.data;
}

export async function updatePlacement(id, payload) {
  const response = await axios.put(`${PLACEMENTS_BASE_URL}/admin/${id}`, payload, {
    withCredentials: true,
  });

  return response.data;
}

export async function deactivatePlacement(id) {
  const response = await axios.post(`${PLACEMENTS_BASE_URL}/admin/${id}/deactivate`, null, {
    withCredentials: true,
  });

  return response.data;
}

export async function reactivatePlacement(id) {
  const response = await axios.post(`${PLACEMENTS_BASE_URL}/admin/${id}/reactivate`, null, {
    withCredentials: true,
  });

  return response.data;
}

export async function uploadPlacementImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${API_BASE_URL}/story-images/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}