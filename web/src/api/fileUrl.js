const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || 'https://localhost:7060'

export function getFileUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${FILE_BASE_URL}${path}`
}