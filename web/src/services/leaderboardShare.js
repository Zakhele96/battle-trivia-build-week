const MODE_LABELS = {
  combined: "Combined",
  "battle-trivia": "Battle Trivia",
  "word-scramble": "Word Scramble",
};

const PERIOD_LABELS = {
  current: "Current week",
  previous: "Previous week",
};

function getApiRoot() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return apiBaseUrl.replace(/\/api\/?$/, "");
}

export function getModeLabel(mode) {
  return MODE_LABELS[mode] || "Combined";
}

export function getPeriodLabel(period) {
  return PERIOD_LABELS[period] || "Current week";
}

export function buildShareUrl(mode, period, userId) {
  const query = `mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(
    period
  )}&userId=${encodeURIComponent(userId || "")}`;

  return `${getApiRoot()}/share/leaderboard?${query}`;
}

export function buildShareImageUrl(mode, period, userId) {
  const query = `mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(
    period
  )}&userId=${encodeURIComponent(userId || "")}`;

  return `${getApiRoot()}/share/leaderboard/image.svg?${query}`;
}

export function buildChallengeUrl(mode, period, challengerUserId, rivalUserId) {
  const query = `mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(
    period
  )}&challengerUserId=${encodeURIComponent(
    challengerUserId || ""
  )}&rivalUserId=${encodeURIComponent(rivalUserId || "")}`;

  return `${getApiRoot()}/share/challenge?${query}`;
}

export function buildChallengeImageUrl(
  mode,
  period,
  challengerUserId,
  rivalUserId
) {
  const query = `mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(
    period
  )}&challengerUserId=${encodeURIComponent(
    challengerUserId || ""
  )}&rivalUserId=${encodeURIComponent(rivalUserId || "")}`;

  return `${getApiRoot()}/share/challenge/image.svg?${query}`;
}

export function buildSquadInviteUrl(
  inviteCode,
  mode = "combined",
  period = "current"
) {
  const query = `inviteCode=${encodeURIComponent(
    inviteCode || ""
  )}&mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(period)}`;

  return `${getApiRoot()}/share/squad?${query}`;
}

export function buildSquadChallengeUrl(
  challengerInviteCode,
  rivalInviteCode,
  mode = "combined",
  period = "current"
) {
  const query = `challengerInviteCode=${encodeURIComponent(
    challengerInviteCode || ""
  )}&rivalInviteCode=${encodeURIComponent(
    rivalInviteCode || ""
  )}&mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(period)}`;

  return `${getApiRoot()}/share/squad-challenge?${query}`;
}

export function buildPlayerRecapUrl(
  userId,
  mode = "combined",
  period = "previous"
) {
  const query = `userId=${encodeURIComponent(
    userId || ""
  )}&mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(period)}`;

  return `${getApiRoot()}/share/recap/player?${query}`;
}

export function buildPlayerRecapImageUrl(
  userId,
  mode = "combined",
  period = "previous"
) {
  const query = `userId=${encodeURIComponent(
    userId || ""
  )}&mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(period)}`;

  return `${getApiRoot()}/share/recap/player/image.svg?${query}`;
}

export function buildSquadRecapUrl(
  inviteCode,
  mode = "combined",
  period = "previous"
) {
  const query = `inviteCode=${encodeURIComponent(
    inviteCode || ""
  )}&mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(period)}`;

  return `${getApiRoot()}/share/recap/squad?${query}`;
}

export function buildSquadRecapImageUrl(
  inviteCode,
  mode = "combined",
  period = "previous"
) {
  const query = `inviteCode=${encodeURIComponent(
    inviteCode || ""
  )}&mode=${encodeURIComponent(mode)}&period=${encodeURIComponent(period)}`;

  return `${getApiRoot()}/share/recap/squad/image.svg?${query}`;
}

export function buildShareText({ row, mode, period, label }) {
  const playerName = row?.displayName || row?.username || "I";
  const boardLabel = label || getModeLabel(mode);
  const periodLabel = getPeriodLabel(period);
  const scoreLine =
    mode === "combined"
      ? `${row.score} total points (${row.battleTriviaScore} trivia, ${row.wordScrambleScore} scramble)`
      : `${row.score} points`;

  return `${playerName} is ranked #${row.rank} on ${boardLabel} - ${periodLabel} with ${scoreLine}.`;
}

export function buildPromoCaption({ row, mode, period, label }) {
  const playerName = row?.displayName || row?.username || "This player";
  const boardLabel = label || getModeLabel(mode);
  const periodLabel = getPeriodLabel(period);

  return `${playerName} is #${row?.rank ?? "?"} on the ${boardLabel} leaderboard for ${periodLabel}. Think you can beat that? Create your BTS account and get in the race.`;
}

export function buildChallengeText({ challenger, rival, mode, period, label }) {
  const challengerName =
    challenger?.displayName || challenger?.username || "A BTS player";
  const rivalName = rival?.displayName || rival?.username || "another player";
  const boardLabel = label || getModeLabel(mode);
  const periodLabel = getPeriodLabel(period);

  return `${challengerName} just challenged ${rivalName} on ${boardLabel} for ${periodLabel}. Join BTS and see where you land on the board.`;
}

export function buildSquadChallengeText({
  challengerSquad,
  rivalSquad,
  mode,
  period,
  label,
}) {
  const boardLabel = label || getModeLabel(mode);
  const periodLabel = getPeriodLabel(period);

  return `${challengerSquad} just challenged ${rivalSquad} on ${boardLabel} for ${periodLabel}. Join BTS and build a squad that can answer back.`;
}

function slugify(value) {
  return String(value || "bts-rank-card")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function triggerDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

async function renderSvgToPng(svgText) {
  return await new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgText], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      try {
        const width = image.naturalWidth || 1200;
        const height = image.naturalHeight || 630;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas unavailable.");
        }

        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(svgUrl);

            if (!blob) {
              reject(new Error("PNG export failed."));
              return;
            }

            resolve(blob);
          },
          "image/png",
          1
        );
      } catch (error) {
        URL.revokeObjectURL(svgUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error("Image load failed."));
    };

    image.src = svgUrl;
  });
}

export async function downloadShareCardPng({
  mode,
  period,
  userId,
  filenameBase,
}) {
  const response = await fetch(buildShareImageUrl(mode, period, userId));

  if (!response.ok) {
    throw new Error("Could not load rank card.");
  }

  const svgText = await response.text();
  const pngBlob = await renderSvgToPng(svgText);
  triggerDownload(pngBlob, `${slugify(filenameBase)}.png`);
}

export async function downloadImageUrlPng(imageUrl, filenameBase) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Could not load image card.");
  }

  const svgText = await response.text();
  const pngBlob = await renderSvgToPng(svgText);
  triggerDownload(pngBlob, `${slugify(filenameBase)}.png`);
}
