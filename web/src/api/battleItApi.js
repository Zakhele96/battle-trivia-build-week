import api from "./axios";

export async function getBattleItState(roomId) {
  const { data } = await api.get(`/rooms/${roomId}/battle-it/state`);
  return data;
}

export async function getPublicBattleItSessions(roomId) {
  const { data } = await api.get(`/rooms/${roomId}/battle-it/public-sessions`);
  return Array.isArray(data) ? data : [];
}

export async function generateBattleItPack(roomId, form) {
  const body = new FormData();
  if (form.sourceText?.trim()) body.append("sourceText", form.sourceText.trim());
  body.append("difficulty", form.difficulty || "medium");
  body.append("answerMode", form.answerMode || "text");
  body.append("visibility", form.visibility || "code-only");
  body.append("questionDurationSeconds", String(form.questionDurationSeconds || 20));
  body.append("revealDelaySeconds", String(form.revealDelaySeconds || 5));
  for (const image of form.images || []) body.append("images", image);

  const { data } = await api.post(`/rooms/${roomId}/battle-it/generate`, body);
  return data;
}

export async function updateBattleItDraft(roomId, sessionId, payload) {
  const { data } = await api.put(
    `/rooms/${roomId}/battle-it/sessions/${sessionId}`,
    payload
  );
  return data;
}

export async function joinBattleIt(roomId, code) {
  const { data } = await api.post(`/rooms/${roomId}/battle-it/join`, { code });
  return data;
}

export async function joinPublicBattleIt(roomId, sessionId) {
  const { data } = await api.post(
    `/rooms/${roomId}/battle-it/sessions/${sessionId}/join`
  );
  return data;
}

export async function openBattleItLobby(roomId, sessionId) {
  const { data } = await api.post(
    `/rooms/${roomId}/battle-it/sessions/${sessionId}/open`
  );
  return data;
}

export async function startBattleIt(roomId, sessionId) {
  const { data } = await api.post(
    `/rooms/${roomId}/battle-it/sessions/${sessionId}/start`
  );
  return data;
}

export async function replayBattleIt(roomId, sessionId) {
  const { data } = await api.post(
    `/rooms/${roomId}/battle-it/sessions/${sessionId}/replay`
  );
  return data;
}
