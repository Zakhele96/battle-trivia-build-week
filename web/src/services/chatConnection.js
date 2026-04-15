import * as signalR from "@microsoft/signalr";

export function createChatConnection(token) {
  return new signalR.HubConnectionBuilder()
    .withUrl(import.meta.env.VITE_HUB_URL, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}