import api from "./axios";

export async function deleteRoomMessage(messageId, reason = "") {
  const { data } = await api.delete(`/admin/messages/${messageId}`, {
    params: reason ? { reason } : undefined,
  });
  return data;
}

export async function muteRoomUser(
  roomId,
  userId,
  durationMinutes = 10,
  reason = ""
) {
  const { data } = await api.post(`/admin/rooms/${roomId}/mute`, {
    userId,
    durationMinutes,
    reason,
  });
  return data;
}

export async function unmuteRoomUser(roomId, userId) {
  const { data } = await api.post(`/admin/rooms/${roomId}/unmute`, {
    userId,
  });
  return data;
}

export async function updateRoomSlowMode(roomId, slowModeSeconds) {
  const { data } = await api.post(`/admin/rooms/${roomId}/slow-mode`, {
    slowModeSeconds,
  });
  return data;
}

export async function getRoomModerationActions(roomId, take = 12) {
  const { data } = await api.get(`/admin/rooms/${roomId}/actions`, {
    params: { take },
  });
  return data;
}