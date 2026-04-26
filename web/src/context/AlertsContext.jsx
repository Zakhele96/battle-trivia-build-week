import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { acceptChallengeInvite } from "../api/challengeInvitesApi";
import { acceptFriendRequest } from "../api/friendsApi";
import { useAuth } from "../hooks/useAuth";
import { fetchAlertsFeed } from "../services/alertsFeed";

const AlertsContext = createContext(null);

function buildStorageKey(userId) {
  return userId ? `bts_alerts_read_v1_${userId}` : "";
}

function readStoredIds(userId) {
  if (!userId) return [];

  try {
    const raw = localStorage.getItem(buildStorageKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeStoredIds(userId, ids) {
  if (!userId) return;
  localStorage.setItem(buildStorageKey(userId), JSON.stringify(ids));
}

export function AlertsProvider({ children }) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [readAlertIds, setReadAlertIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setReadAlertIds([]);
      return;
    }

    setReadAlertIds(readStoredIds(user.id));
  }, [user?.id]);

  const refreshAlerts = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setAlerts([]);
      setError("");
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError("");

    try {
      const nextAlerts = await fetchAlertsFeed(user);
      setAlerts(nextAlerts);

      setReadAlertIds((previous) => {
        const allowedIds = new Set(nextAlerts.map((item) => item.id));
        const nextReadIds = previous.filter((id) => allowedIds.has(id));
        writeStoredIds(user.id, nextReadIds);
        return nextReadIds;
      });

      return nextAlerts;
    } catch {
      setError("Failed to load alerts.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated || !user?.id) {
      setAlerts([]);
      setReadAlertIds([]);
      setError("");
      setIsLoading(false);
      return;
    }

    refreshAlerts().catch(() => {
      // ignore provider sync errors
    });
  }, [isAuthenticated, isInitializing, refreshAlerts, user?.id]);

  const markAlertRead = useCallback(
    (alertId) => {
      if (!alertId || !user?.id) return;

      setReadAlertIds((previous) => {
        if (previous.includes(alertId)) return previous;
        const next = [...previous, alertId];
        writeStoredIds(user.id, next);
        return next;
      });
    },
    [user?.id]
  );

  const markAllAlertsRead = useCallback(() => {
    if (!user?.id) return;

    const next = alerts.map((item) => item.id);
    setReadAlertIds(next);
    writeStoredIds(user.id, next);
  }, [alerts, user?.id]);

  const resetAlertInbox = useCallback(() => {
    if (!user?.id) return;

    setReadAlertIds([]);
    writeStoredIds(user.id, []);
  }, [user?.id]);

  const acceptInboxChallenge = useCallback(
    async (inviteId) => {
      if (!inviteId) return null;

      const accepted = await acceptChallengeInvite(inviteId);
      await refreshAlerts();
      return accepted;
    },
    [refreshAlerts]
  );

  const acceptInboxFriendRequest = useCallback(
    async (friendshipId) => {
      if (!friendshipId) return null;

      const accepted = await acceptFriendRequest(friendshipId);
      await refreshAlerts();
      return accepted;
    },
    [refreshAlerts]
  );

  const unreadCount = useMemo(() => {
    const readSet = new Set(readAlertIds);
    return alerts.reduce((count, item) => count + (readSet.has(item.id) ? 0 : 1), 0);
  }, [alerts, readAlertIds]);

  const value = useMemo(
    () => ({
      alerts,
      isLoading,
      error,
      readAlertIds,
      unreadCount,
      refreshAlerts,
      markAlertRead,
      markAllAlertsRead,
      resetAlertInbox,
      acceptInboxChallenge,
      acceptInboxFriendRequest,
    }),
    [
      alerts,
      isLoading,
      error,
      readAlertIds,
      unreadCount,
      refreshAlerts,
      markAlertRead,
      markAllAlertsRead,
      resetAlertInbox,
      acceptInboxChallenge,
      acceptInboxFriendRequest,
    ]
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const context = useContext(AlertsContext);

  if (!context) {
    throw new Error("useAlerts must be used inside AlertsProvider.");
  }

  return context;
}
