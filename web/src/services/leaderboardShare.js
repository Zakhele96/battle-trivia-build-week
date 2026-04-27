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

function escapeSvg(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncateSvgText(value, maxLength = 24) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
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

export async function downloadGeneratedCardPng(svgText, filenameBase) {
  const pngBlob = await renderSvgToPng(svgText);
  triggerDownload(pngBlob, `${slugify(filenameBase)}.png`);
}

export function buildTopThreeCardSvg({ rows = [], label = "Combined", period = "current" }) {
  const top = rows.slice(0, 3);
  const places = [
    { x: 92, y: 640, tone: "#fbbf24" },
    { x: 390, y: 540, tone: "#d1d5db" },
    { x: 688, y: 640, tone: "#fb923c" },
  ];

  const cards = top
    .map((row, index) => {
      const place = places[index];
      if (!place) return "";

      return `
        <rect x="${place.x}" y="${place.y}" width="300" height="360" rx="34" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
        <text x="${place.x + 34}" y="${place.y + 56}" fill="${place.tone}" font-size="24" font-family="Segoe UI, Arial, sans-serif" font-weight="700">#${row.rank}</text>
        <text x="${place.x + 34}" y="${place.y + 126}" fill="#ffffff" font-size="38" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(truncateSvgText(row.displayName || row.username || "Player", 16))}</text>
        <text x="${place.x + 34}" y="${place.y + 172}" fill="#9ca3af" font-size="22" font-family="Segoe UI, Arial, sans-serif">@${escapeSvg(truncateSvgText(row.username || "player", 18))}</text>
        <text x="${place.x + 34}" y="${place.y + 250}" fill="#bfdbfe" font-size="72" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(row.score)}</text>
        <text x="${place.x + 34}" y="${place.y + 292}" fill="#ffffff" font-size="24" font-family="Segoe UI, Arial, sans-serif">points</text>
      `;
    })
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#09090b" />
      <circle cx="150" cy="170" r="220" fill="rgba(59,130,246,0.18)" />
      <circle cx="910" cy="1610" r="280" fill="rgba(245,158,11,0.14)" />
      <rect x="44" y="44" width="992" height="1832" rx="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <text x="92" y="128" fill="#93c5fd" font-size="30" font-family="Segoe UI, Arial, sans-serif" letter-spacing="4">BTS TOP 3</text>
      <text x="92" y="238" fill="#ffffff" font-size="76" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(label)}</text>
      <text x="92" y="298" fill="#cbd5e1" font-size="34" font-family="Segoe UI, Arial, sans-serif">${escapeSvg(getPeriodLabel(period))}</text>
      <text x="92" y="408" fill="#f8fafc" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">These are the names setting the pace right now.</text>
      <text x="92" y="472" fill="#a1a1aa" font-size="32" font-family="Segoe UI, Arial, sans-serif">Post the podium. Bring more people into the board.</text>
      ${cards}
    </svg>
  `;
}

export function buildStreakCardSvg({
  playerName = "Player",
  bestStreak = 0,
  weeklyWins = 0,
  totalCorrectAnswers = 0,
}) {
  const safePlayerName = truncateSvgText(playerName, 22);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#09090b" />
      <circle cx="170" cy="150" r="240" fill="rgba(249,115,22,0.16)" />
      <circle cx="900" cy="1600" r="310" fill="rgba(234,88,12,0.12)" />
      <rect x="44" y="44" width="992" height="1832" rx="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <text x="92" y="128" fill="#fdba74" font-size="30" font-family="Segoe UI, Arial, sans-serif" letter-spacing="4">BTS STREAK CARD</text>
      <text x="92" y="238" fill="#ffffff" font-size="76" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(safePlayerName)}</text>
      <text x="92" y="322" fill="#f59e0b" font-size="160" font-family="Segoe UI, Arial, sans-serif" font-weight="800">x${escapeSvg(bestStreak)}</text>
      <text x="92" y="390" fill="#ffffff" font-size="40" font-family="Segoe UI, Arial, sans-serif">best streak</text>
      <rect x="92" y="540" width="896" height="230" rx="34" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
      <text x="132" y="610" fill="#71717a" font-size="24" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">FLEX</text>
      <text x="132" y="690" fill="#ffffff" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(totalCorrectAnswers)} correct answers</text>
      <text x="132" y="742" fill="#fed7aa" font-size="30" font-family="Segoe UI, Arial, sans-serif">${escapeSvg(weeklyWins)} weekly wins</text>
      <text x="92" y="1040" fill="#f8fafc" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Pressure makes runs. Runs make receipts.</text>
      <text x="92" y="1110" fill="#a1a1aa" font-size="32" font-family="Segoe UI, Arial, sans-serif">Create your BTS account and build a streak people can feel.</text>
    </svg>
  `;
}

export function buildTopTenCardSvg({
  playerName = "Player",
  rank = 10,
  score = 0,
  label = "Combined",
  period = "current",
}) {
  const safePlayerName = truncateSvgText(playerName, 22);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#09090b" />
      <circle cx="170" cy="170" r="230" fill="rgba(16,185,129,0.16)" />
      <circle cx="930" cy="1580" r="290" fill="rgba(59,130,246,0.14)" />
      <rect x="44" y="44" width="992" height="1832" rx="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <text x="92" y="128" fill="#6ee7b7" font-size="30" font-family="Segoe UI, Arial, sans-serif" letter-spacing="4">BTS TOP 10 PUSH</text>
      <text x="92" y="238" fill="#ffffff" font-size="72" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(safePlayerName)}</text>
      <text x="92" y="310" fill="#cbd5e1" font-size="34" font-family="Segoe UI, Arial, sans-serif">${escapeSvg(label)} · ${escapeSvg(getPeriodLabel(period))}</text>
      <text x="92" y="504" fill="#86efac" font-size="190" font-family="Segoe UI, Arial, sans-serif" font-weight="800">#${escapeSvg(rank)}</text>
      <text x="92" y="582" fill="#ffffff" font-size="42" font-family="Segoe UI, Arial, sans-serif">still alive in the top 10</text>
      <text x="92" y="742" fill="#bfdbfe" font-size="88" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(score)} pts</text>
      <text x="92" y="1040" fill="#f8fafc" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">The climb is real. The board still moves.</text>
      <text x="92" y="1110" fill="#a1a1aa" font-size="32" font-family="Segoe UI, Arial, sans-serif">Join BTS and see if you can hold a top 10 slot yourself.</text>
    </svg>
  `;
}

export function buildRivalryCardSvg({
  challenger,
  rival,
  label = "Combined",
  period = "current",
}) {
  const challengerName = challenger?.displayName || challenger?.username || "You";
  const rivalName = rival?.displayName || rival?.username || "Rival";
  const safeChallengerName = truncateSvgText(challengerName, 12);
  const safeRivalName = truncateSvgText(rivalName, 12);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#09090b" />
      <circle cx="170" cy="170" r="230" fill="rgba(59,130,246,0.18)" />
      <circle cx="930" cy="1580" r="290" fill="rgba(249,115,22,0.14)" />
      <rect x="44" y="44" width="992" height="1832" rx="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <text x="92" y="128" fill="#c4b5fd" font-size="30" font-family="Segoe UI, Arial, sans-serif" letter-spacing="4">BTS RIVALRY CARD</text>
      <text x="92" y="220" fill="#ffffff" font-size="70" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(label)}</text>
      <text x="92" y="280" fill="#cbd5e1" font-size="34" font-family="Segoe UI, Arial, sans-serif">${escapeSvg(getPeriodLabel(period))}</text>
      <rect x="92" y="420" width="380" height="520" rx="36" fill="rgba(59,130,246,0.09)" stroke="rgba(96,165,250,0.18)" />
      <text x="132" y="498" fill="#93c5fd" font-size="24" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">YOU</text>
      <text x="132" y="598" fill="#ffffff" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(safeChallengerName)}</text>
      <text x="132" y="716" fill="#bfdbfe" font-size="120" font-family="Segoe UI, Arial, sans-serif" font-weight="800">#${escapeSvg(challenger?.rank ?? "-")}</text>
      <text x="132" y="790" fill="#ffffff" font-size="34" font-family="Segoe UI, Arial, sans-serif">${escapeSvg(challenger?.score ?? 0)} pts</text>
      <rect x="608" y="420" width="380" height="520" rx="36" fill="rgba(249,115,22,0.09)" stroke="rgba(251,146,60,0.18)" />
      <text x="648" y="498" fill="#fdba74" font-size="24" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">RIVAL</text>
      <text x="648" y="598" fill="#ffffff" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${escapeSvg(safeRivalName)}</text>
      <text x="648" y="716" fill="#fed7aa" font-size="120" font-family="Segoe UI, Arial, sans-serif" font-weight="800">#${escapeSvg(rival?.rank ?? "-")}</text>
      <text x="648" y="790" fill="#ffffff" font-size="34" font-family="Segoe UI, Arial, sans-serif">${escapeSvg(rival?.score ?? 0)} pts</text>
      <text x="500" y="690" fill="#f9a8d4" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="800">VS</text>
      <text x="92" y="1120" fill="#f8fafc" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Turn the leaderboard into a real rivalry.</text>
      <text x="92" y="1190" fill="#a1a1aa" font-size="32" font-family="Segoe UI, Arial, sans-serif">Post the matchup. Then go move the board.</text>
    </svg>
  `;
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
