import api from "./axios";

export async function searchPlayers(query) {
  const { data } = await api.get("/friends/search", {
    params: { query },
  });
  return data;
}

export async function getMyFriendNetwork() {
  const { data } = await api.get("/friends/network");
  return data;
}

export async function sendFriendRequest(targetUserId) {
  const { data } = await api.post("/friends/requests", { targetUserId });
  return data;
}

export async function acceptFriendRequest(friendshipId) {
  const { data } = await api.post(`/friends/requests/${friendshipId}/accept`);
  return data;
}

export async function declineFriendRequest(friendshipId) {
  const { data } = await api.post(`/friends/requests/${friendshipId}/decline`);
  return data;
}

export async function getFriendsLeaderboard(mode, period = "current") {
  const { data } = await api.get("/friends/leaderboard", {
    params: { mode, period },
  });
  return data;
}

export async function getHeadToHead(otherUserId) {
  const { data } = await api.get(`/friends/head-to-head/${otherUserId}`);
  return data;
}
