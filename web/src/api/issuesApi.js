import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

export async function getIssues() {
  const response = await api.get('/issues')
  return response.data
}

export async function getIssueBySlug(slug) {
  const response = await api.get(`/issues/${slug}`)
  return response.data
}

export async function getIssuePages(issueId) {
  const response = await api.get(`/issues/${issueId}/pages`)
  return response.data
}

export async function uploadIssue(formData) {
  const response = await api.post('/issues/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function updateIssue(id, payload) {
  const response = await api.put(`/issues/${id}`, payload)
  return response.data
}

export async function publishIssue(id) {
  await api.post(`/issues/${id}/publish`)
}

export async function unpublishIssue(id) {
  await api.post(`/issues/${id}/unpublish`)
}

export async function deleteIssue(id) {
  await api.delete(`/issues/${id}`)
}

export async function getAllIssues() {
  const response = await api.get('/issues/admin/all')
  return response.data
}

export async function getAdminIssueById(id) {
  const response = await api.get(`/issues/admin/${id}`)
  return response.data
}