import { getLeaderboard } from "../api/leaderboardsApi";
import { getMyChallengeInvites } from "../api/challengeInvitesApi";
import { getMyFriendNetwork } from "../api/friendsApi";
import { getMyProfile } from "../api/profileApi";
import { getMySquads, getSquadDetail } from "../api/squadsApi";

function getModeLabel(mode) {
  if (mode === "battle-trivia") return "Battle Trivia";
  if (mode === "word-scramble") return "Word Scramble";
  return "Combined";
}

function getPeriodLabel(period) {
  return period === "previous" ? "Previous week" : "Current week";
}

export function buildPlayerAlerts({ authUser, profile, currentBoard, previousBoard }) {
  const alerts = [];
  if (!authUser?.id || !profile) return alerts;

  const currentRow =
    currentBoard?.rows?.find((row) => row.userId === authUser.id) || null;
  const previousRow =
    previousBoard?.rows?.find((row) => row.userId === authUser.id) || null;
  const leaderScore = currentBoard?.rows?.[0]?.score ?? 0;

  if (previousRow) {
    alerts.push({
      id: "player-recap-ready",
      kind: "Recap ready",
      tone: "violet",
      title: "Your weekly recap card is ready to post.",
      detail: `You finished last week at #${previousRow.rank} with ${previousRow.score} points on the combined board.`,
      ctaTo: "/profile",
      ctaLabel: "Open profile",
      priority: 10,
    });
  }

  if (currentRow && previousRow) {
    const delta = previousRow.rank - currentRow.rank;
    alerts.push({
      id: "player-movement",
      kind: delta > 0 ? "Climbing" : delta < 0 ? "Pressure" : "Holding",
      tone: delta > 0 ? "emerald" : delta < 0 ? "amber" : "blue",
      title:
        delta > 0
          ? `You climbed ${delta} spot${delta === 1 ? "" : "s"} since last week.`
          : delta < 0
            ? `You dropped ${Math.abs(delta)} spot${Math.abs(delta) === 1 ? "" : "s"} from last week.`
            : "You are holding the same position as last week.",
      detail:
        currentRow.rank === 1
          ? "You are leading the current combined board."
          : `${Math.max(0, leaderScore - currentRow.score)} point${Math.max(0, leaderScore - currentRow.score) === 1 ? "" : "s"} behind the current leader.`,
      ctaTo: "/leaderboards?mode=battle-trivia&period=current",
      ctaLabel: "Open standings",
      priority: 20,
    });
  } else if (currentRow) {
    alerts.push({
      id: "player-live-rank",
      kind: "Live rank",
      tone: "blue",
      title: `You are currently #${currentRow.rank} on the combined board.`,
      detail:
        currentRow.rank === 1
          ? "Defend the top spot before the week closes."
          : `${Math.max(0, leaderScore - currentRow.score)} point${Math.max(0, leaderScore - currentRow.score) === 1 ? "" : "s"} behind the leader right now.`,
      ctaTo: "/leaderboards?mode=battle-trivia&period=current",
      ctaLabel: "Push higher",
      priority: 30,
    });
  }

  if ((profile?.growth?.referredSignups ?? 0) > 0) {
    alerts.push({
      id: "player-growth-win",
      kind: "Growth win",
      tone: "emerald",
      title: "Your invites are converting.",
      detail: `${profile.growth.referredSignups} new player${profile.growth.referredSignups === 1 ? "" : "s"} signed up from your BTS sharing.`,
      ctaTo: "/profile",
      ctaLabel: "See growth",
      priority: 40,
    });
  }

  return alerts;
}

export function buildSquadAlerts(squadDetails = []) {
  const alerts = [];

  squadDetails.forEach(({ current, previous }) => {
    if (!current) return;

    if (previous?.leaderboardRows?.length) {
      alerts.push({
        id: `squad-recap-${current.id}`,
        kind: "Squad recap",
        tone: "violet",
        title: `${current.name} has a weekly squad recap ready.`,
        detail: `${current.name} closed last week with ${previous.memberCount} member${previous.memberCount === 1 ? "" : "s"} on the board.`,
        ctaTo: `/squads?squadId=${current.id}&mode=combined&period=current`,
        ctaLabel: "Open squad",
        priority: 50,
      });
    }

    if (current.overallRank > 0) {
      const delta =
        previous?.overallRank > 0 ? previous.overallRank - current.overallRank : 0;
      alerts.push({
        id: `squad-momentum-${current.id}`,
        kind:
          delta > 0 ? "Squad climbing" : delta < 0 ? "Squad pressure" : "Squad live",
        tone: delta > 0 ? "emerald" : delta < 0 ? "amber" : "blue",
        title:
          delta > 0
            ? `${current.name} climbed ${delta} squad spot${delta === 1 ? "" : "s"}.`
            : delta < 0
              ? `${current.name} dropped ${Math.abs(delta)} squad spot${Math.abs(delta) === 1 ? "" : "s"}.`
              : `${current.name} is holding at #${current.overallRank}.`,
        detail:
          current.overallRank === 1
            ? "Your squad is leading this board right now."
            : `${current.pointsBehindLeader} point${current.pointsBehindLeader === 1 ? "" : "s"} behind the lead and ${current.pointsToNextRank} point${current.pointsToNextRank === 1 ? "" : "s"} away from the next jump.`,
        ctaTo: `/squads?squadId=${current.id}&mode=${current.leaderboardMode || "combined"}&period=${current.leaderboardPeriod || "current"}`,
        ctaLabel: "Rally squad",
        priority: 60,
      });
    }
  });

  return alerts;
}

export function buildChallengeInviteAlerts(invites = []) {
  return (Array.isArray(invites) ? invites : [])
    .filter((invite) => invite?.status === "pending" && invite?.id)
    .map((invite) => ({
      id: `challenge-invite-${invite.id}`,
      kind: "Challenge",
      tone: "amber",
      title: `${invite.challengerName || invite.challengerUsername || "A player"} challenged you on ${getModeLabel(invite.mode)}.`,
      detail: `Accept the invite and jump into the ${getPeriodLabel(invite.period).toLowerCase()} board.`,
      ctaTo: `/leaderboards?mode=${encodeURIComponent(invite.mode || "combined")}&period=${encodeURIComponent(invite.period || "current")}`,
      ctaLabel: "Accept challenge",
      actionType: "accept-challenge",
      challengeInviteId: invite.id,
      priority: 5,
    }));
}

export function buildFriendRequestAlerts(network) {
  const incoming = Array.isArray(network?.incomingRequests)
    ? network.incomingRequests
    : [];

  return incoming
    .filter((request) => request?.friendshipId && request?.userId)
    .map((request) => ({
      id: `friend-request-${request.friendshipId}`,
      kind: "Friend request",
      tone: "emerald",
      title: `${request.displayName || request.username || "A player"} wants to join your friend circle.`,
      detail: "Accept the request to unlock the friends leaderboard and head-to-head rivalry cards.",
      ctaTo: "/profile",
      ctaLabel: "Accept request",
      actionType: "accept-friend-request",
      friendshipId: request.friendshipId,
      priority: 6,
    }));
}

export async function fetchAlertsFeed(authUser) {
  if (!authUser?.id) {
    return [];
  }

  const [profile, currentBoard, previousBoard, squads, challengeInvites, friendNetwork] = await Promise.all([
    getMyProfile(),
    getLeaderboard("combined", "current", 200),
    getLeaderboard("combined", "previous", 200),
    getMySquads(),
    getMyChallengeInvites().catch(() => []),
    getMyFriendNetwork().catch(() => null),
  ]);

  const squadDetails = await Promise.all(
    (Array.isArray(squads) ? squads : []).map(async (squad) => {
      const [current, previous] = await Promise.all([
        getSquadDetail(squad.id, "combined", "current").catch(() => null),
        getSquadDetail(squad.id, "combined", "previous").catch(() => null),
      ]);

      return { current, previous };
    })
  );

  return [
    ...buildChallengeInviteAlerts(challengeInvites),
    ...buildFriendRequestAlerts(friendNetwork),
    ...buildPlayerAlerts({
      authUser,
      profile,
      currentBoard,
      previousBoard,
    }),
    ...buildSquadAlerts(squadDetails),
  ].sort((left, right) => (left.priority || 999) - (right.priority || 999));
}
