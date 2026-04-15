import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CATEGORIES_BASE_URL = `${API_BASE_URL}/categories`;

export async function getPublicCategories() {
  const response = await axios.get(CATEGORIES_BASE_URL);
  return Array.isArray(response.data) ? response.data : [];
}

export async function getAdminCategories(query = "", status = "all") {
  const response = await axios.get(`${CATEGORIES_BASE_URL}/admin`, {
    params: {
      q: query || undefined,
      status: status === "all" ? undefined : status,
    },
    withCredentials: true,
  });

  return Array.isArray(response.data) ? response.data : [];
}

export async function getAdminCategoryById(id) {
  const response = await axios.get(`${CATEGORIES_BASE_URL}/admin/${id}`, {
    withCredentials: true,
  });
  return response.data;
}

export async function createCategory(payload) {
  const response = await axios.post(`${CATEGORIES_BASE_URL}/admin`, payload, {
    withCredentials: true,
  });
  return response.data;
}

export async function updateCategory(id, payload) {
  const response = await axios.put(`${CATEGORIES_BASE_URL}/admin/${id}`, payload, {
    withCredentials: true,
  });
  return response.data;
}

export async function deactivateCategory(id) {
  const response = await axios.post(`${CATEGORIES_BASE_URL}/admin/${id}/deactivate`, null, {
    withCredentials: true,
  });
  return response.data;
}

export async function reactivateCategory(id) {
  const response = await axios.post(`${CATEGORIES_BASE_URL}/admin/${id}/reactivate`, null, {
    withCredentials: true,
  });
  return response.data;
}