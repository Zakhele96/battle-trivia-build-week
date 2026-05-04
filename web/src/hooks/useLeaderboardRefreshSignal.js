import { useEffect } from "react";
import { createChatConnection } from "../services/chatConnection";

export default function useLeaderboardRefreshSignal(token, onRefresh) {
  useEffect(() => {
    if (!token || typeof onRefresh !== "function") {
      return undefined;
    }

    let isDisposed = false;
    const connection = createChatConnection(token);

    connection.on("GlobalLeaderboardChanged", (payload) => {
      if (isDisposed) return;
      onRefresh(payload || null);
    });

    connection
      .start()
      .catch(() => {
        // ignore background leaderboard signal startup failures
      });

    return () => {
      isDisposed = true;
      connection.off("GlobalLeaderboardChanged");
      connection
        .stop()
        .catch(() => {
          // ignore shutdown failures
        });
    };
  }, [token, onRefresh]);
}
