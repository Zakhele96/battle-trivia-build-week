export const SITE_NAME = "BTS";
export const SITE_TITLE = "BTS | Battle Trivia, Word Scramble, Weekly Leaderboards";
export const SITE_DESCRIPTION =
  "BTS is a live competition platform for Battle Trivia and Word Scramble, with weekly leaderboards, player profiles, direct messages, alerts, and squad competition.";
export const SITE_KEYWORDS = [
  "BTS game",
  "Battle Trivia",
  "Word Scramble",
  "weekly leaderboard",
  "trivia competition",
  "multiplayer trivia",
  "word puzzle competition",
  "live trivia game",
  "online leaderboard game",
  "social gaming",
];
export const SITE_URL =
  import.meta.env.VITE_SITE_URL || "https://www.brotechnodevs.co.za";
export const DEFAULT_OG_IMAGE =
  import.meta.env.VITE_OG_IMAGE_URL || `${SITE_URL}/favicon.svg`;

export function buildCanonicalUrl(path = "/") {
  try {
    return new URL(path, SITE_URL).toString();
  } catch {
    return SITE_URL;
  }
}
