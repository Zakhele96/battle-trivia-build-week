import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const STORIES_BASE_URL = `${API_BASE_URL}/stories`;
const STORY_IMAGES_BASE_URL = `${API_BASE_URL}/story-images`;

export async function getPublishedStories() {
  const response = await axios.get(STORIES_BASE_URL);
  return response.data;
}

export async function getStoryBySlug(slug) {
  const response = await axios.get(`${STORIES_BASE_URL}/${slug}`);
  return response.data;
}

export async function getAdminStories() {
  const response = await axios.get(`${STORIES_BASE_URL}/admin/all`);
  return response.data;
}

export async function getAdminStoryById(id) {
  const response = await axios.get(`${STORIES_BASE_URL}/admin/${id}`);
  return response.data;
}

export async function createStory(payload) {
  const response = await axios.post(STORIES_BASE_URL, payload);
  return response.data;
}

export async function updateStory(id, payload) {
  const response = await axios.put(`${STORIES_BASE_URL}/${id}`, payload);
  return response.data;
}

export async function publishStory(id) {
  const response = await axios.post(`${STORIES_BASE_URL}/${id}/publish`);
  return response.data;
}

export async function unpublishStory(id) {
  const response = await axios.post(`${STORIES_BASE_URL}/${id}/unpublish`);
  return response.data;
}

export async function deleteStory(id) {
  const response = await axios.delete(`${STORIES_BASE_URL}/${id}`);
  return response.data;
}

export async function uploadStoryImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${STORY_IMAGES_BASE_URL}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function getStoryImages() {
  const response = await axios.get(STORY_IMAGES_BASE_URL);
  return response.data;
}

export async function getOrphanStoryImages(olderThanHours = 12) {
  const response = await axios.get(`${STORY_IMAGES_BASE_URL}/orphans`, {
    params: { olderThanHours },
  });
  return response.data;
}

export async function deleteStoryImage(id) {
  const response = await axios.delete(`${STORY_IMAGES_BASE_URL}/${id}`);
  return response.data;
}

export async function cleanupOrphanStoryImages(olderThanHours = 12) {
  const response = await axios.post(`${STORY_IMAGES_BASE_URL}/cleanup-orphans`, null, {
    params: { olderThanHours },
  });
  return response.data;
}

export async function searchStories(query, page = 1, pageSize = 24) {
  const trimmed = query?.trim();

  if (!trimmed) {
    return {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }

  const response = await axios.get(`${STORIES_BASE_URL}/search`, {
    params: {
      q: trimmed,
      page,
      pageSize,
    },
  });

  const data = response.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    totalCount: Number(data.totalCount || 0),
    page: Number(data.page || page),
    pageSize: Number(data.pageSize || pageSize),
  };
}