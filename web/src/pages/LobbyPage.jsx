import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FeaturedTriviaCard from "../components/lobby/FeaturedTriviaCard";
import LeaderboardPreviewCard from "../components/lobby/LeaderboardPreviewCard";
import WinnersPodiumCard from "../components/lobby/WinnersPodiumCard";
import AppSectionNav from "../components/layout/AppSectionNav";
import {
  getBattleTriviaSessionPodium,
  getCurrentBattleTriviaLeaderboard,
  getRoomSessionStatus,
  getRooms,
} from "../api/roomsApi";
import { getLeaderboard } from "../api/leaderboardsApi";
import { getMyProfile, getMyProfileHistory } from "../api/profileApi";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useMentions } from "../context/MentionContext";
import MentionInboxCard from "../components/mentions/MentionInboxCard";
import { getUnreadMentions } from "../api/roomsApi";
import { getActiveSponsor } from "../api/sponsorApi";
import SponsorSpotlightCard, {
  hasSponsorPlacement,
} from "../components/sponsor/SponsorSpotlightCard";

function formatEndedAt(value) {
  if (!value) return "Latest completed week";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest completed week";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatPoints(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0 pts";
  return `${numeric} pts`;
}

function getInitials(value) {
  if (!value) return "P";

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function SectionHeader({ eyebrow, title, description, isLight = false }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2.5 sm:mb-4">
      <div>
        <div
          className={`text-[10px] uppercase tracking-[0.18em] sm:text-[11px] ${
            isLight ? "text-stone-500" : "text-neutral-500"
          }`}
        >
          {eyebrow}
        </div>
        <div
          className={`mt-1 text-[16px] font-semibold tracking-[-0.03em] sm:text-[19px] ${
            isLight ? "text-stone-900" : "text-white"
          }`}
        >
          {title}
        </div>
        {description ? (
          <div
            className={`mt-1 text-[12px] leading-5 sm:mt-1.5 sm:text-[13px] ${
              isLight ? "text-stone-600" : "text-neutral-400"
            }`}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MobileLobbySection({
  eyebrow,
  title,
  description,
  isLight = false,
  children,
}) {
  return (
    <section
      className={`rounded-[28px] border p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)] sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none ${
        isLight
          ? "border-[#dcc9aa] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,232,216,0.96))]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(18,22,31,0.98),rgba(8,10,16,0.98))]"
      }`}
    >
      <div className="sm:hidden">
        <div
          className={`text-[10px] uppercase tracking-[0.18em] ${
            isLight ? "text-stone-500" : "text-blue-200/70"
          }`}
        >
          {eyebrow}
        </div>
        <h2
          className={`mt-2 text-[24px] font-semibold tracking-[-0.05em] ${
            isLight ? "text-stone-900" : "text-white"
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={`mt-1.5 text-[13px] leading-6 ${
              isLight ? "text-stone-600" : "text-neutral-400"
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-4 sm:mt-0">{children}</div>
    </section>
  );
}

function DeferredSection({
  children,
  minHeightClassName = "min-h-[180px]",
  onVisible,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isVisible) return undefined;

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      {
        rootMargin: "220px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || typeof onVisible !== "function") return undefined;
    onVisible();
    return undefined;
  }, [isVisible, onVisible]);

  return (
    <div ref={containerRef}>
      {isVisible ? (
        children
      ) : (
        <div
          className={`rounded-[24px] border border-white/8 bg-white/[0.02] ${minHeightClassName}`}
        />
      )}
    </div>
  );
}

function LobbyHighlightCard({
  eyebrow,
  title,
  description,
  accent = "blue",
  isLight = false,
}) {
  const accentClass =
    accent === "amber"
      ? isLight
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-amber-300/18 bg-amber-400/10"
      : accent === "emerald"
      ? isLight
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-emerald-300/18 bg-emerald-400/10"
      : isLight
      ? "border-sky-300 bg-sky-50 text-sky-800"
      : "border-blue-300/18 bg-blue-400/10";
  const cardClassName = isLight
    ? "rounded-[18px] border border-[#ddc8a8] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,234,218,0.96))] p-3.5 shadow-[0_16px_28px_rgba(114,84,41,0.1)]"
    : "rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5";

  return (
    <div className={cardClassName}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={`text-[10px] uppercase tracking-[0.16em] ${
              isLight ? "text-stone-500" : "text-neutral-500"
            }`}
          >
            {eyebrow}
          </div>
          <div
            className={`mt-1.5 text-[16px] font-semibold tracking-[-0.03em] ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {title}
          </div>
          <div
            className={`mt-1 text-[12px] leading-5 ${
              isLight ? "text-stone-600" : "text-neutral-400"
            }`}
          >
            {description}
          </div>
        </div>

        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentClass}`}
        >
          Live
        </div>
      </div>
    </div>
  );
}

function QuickDestinationCard({
  to,
  eyebrow,
  title,
  description,
  isLight = false,
}) {
  const cardClassName = isLight
    ? "rounded-[18px] border border-[#ddc8a8] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,232,216,0.96))] p-3.5 shadow-[0_16px_28px_rgba(114,84,41,0.1)] transition hover:border-[#cda768] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,239,226,1))] sm:rounded-[20px] sm:p-4"
    : "rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[20px] sm:p-4";
  return (
    <Link to={to} className={cardClassName}>
      <div
        className={`text-[9px] uppercase tracking-[0.16em] sm:text-[10px] ${
          isLight ? "text-stone-500" : "text-neutral-500"
        }`}
      >
        {eyebrow}
      </div>

      <div
        className={`mt-1.5 text-[14px] font-semibold tracking-[-0.03em] sm:text-[15px] ${
          isLight ? "text-stone-900" : "text-white"
        }`}
      >
        {title}
      </div>

      <div
        className={`mt-1 text-[12px] leading-5 sm:text-[13px] sm:leading-5 ${
          isLight ? "text-stone-600" : "text-neutral-400"
        }`}
      >
        {description}
      </div>

      <div
        className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] ${
          isLight ? "text-[#0f5fa8]" : "text-blue-300/80"
        }`}
      >
        Open
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}

function LeaderCard({ entry, isLight = false }) {
  const isChampion = entry.rank === 1;

  return (
    <div
      className={`rounded-[16px] border p-3 sm:rounded-[18px] sm:p-3.5 ${
        isChampion
          ? isLight
            ? "border-amber-300 bg-amber-50"
            : "border-amber-400/20 bg-amber-500/10"
          : isLight
          ? "border-[#e2d4c2] bg-[rgba(255,252,247,0.88)]"
          : "border-white/8 bg-black/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] sm:text-[10px] ${
            isChampion
              ? isLight
                ? "bg-amber-100 text-amber-800"
                : "bg-amber-400/15 text-amber-200"
              : isLight
              ? "bg-stone-100 text-stone-600"
              : "bg-white/[0.05] text-neutral-400"
          }`}
        >
          #{entry.rank}
        </span>

        {isChampion ? (
          <span aria-hidden="true" className="emoji-native">
            👑
          </span>
        ) : null}
      </div>

      <div
        className={`mt-2.5 truncate text-[13px] font-semibold sm:mt-3 sm:text-sm ${
          isLight ? "text-stone-900" : "text-white"
        }`}
      >
        {entry.displayName || entry.username}
      </div>

      <div
        className={`mt-1 text-[10px] sm:text-[11px] ${
          isLight ? "text-stone-500" : "text-neutral-500"
        }`}
      >
        @{entry.username}
      </div>

      <div
        className={`mt-2.5 text-[13px] font-semibold sm:mt-3 sm:text-sm ${
          isChampion
            ? isLight
              ? "text-amber-800"
              : "text-amber-200"
            : isLight
            ? "text-[#0f5fa8]"
            : "text-blue-300"
        }`}
      >
        {entry.score} pts
      </div>
    </div>
  );
}

function LeadersPanel({ title, subtitle, entries, isLight = false }) {
  return (
    <div
      className={`mt-3 rounded-[18px] border p-3 sm:mt-4 sm:rounded-[22px] sm:p-4 ${
        isLight
          ? "border-[#dcc9aa] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,232,216,0.96))]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div
            className={`text-[10px] uppercase tracking-[0.18em] sm:text-[11px] ${
              isLight ? "text-stone-500" : "text-neutral-500"
            }`}
          >
            {title}
          </div>
          <div
            className={`mt-1 text-[12px] sm:text-sm ${
              isLight ? "text-stone-600" : "text-neutral-300"
            }`}
          >
            {subtitle}
          </div>
        </div>

        <div
          className={`rounded-full border px-3 py-1 text-[9px] font-medium uppercase tracking-[0.16em] sm:text-[10px] ${
            isLight
              ? "border-[#e2d4c2] bg-white/70 text-stone-500"
              : "border-white/8 bg-white/[0.03] text-neutral-400"
          }`}
        >
          Top {entries.length}
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-3">
        {entries.map((entry) => (
          <LeaderCard
            key={`${entry.userId}-${entry.rank}`}
            entry={entry}
            isLight={isLight}
          />
        ))}
      </div>
    </div>
  );
}

function DashboardHero({
  user,
  isFirstTimeUser,
  currentStanding,
  bestStreak,
  totalCorrectAnswers,
  isLight = false,
}) {
  const displayName = user?.displayName || user?.username || "Player";
  const greeting = user?.displayName
    ? `${user.displayName}, your race is live`
    : "Your race is live";
  const providerLabel =
    user?.authProvider === "google"
      ? "Google sign-in"
      : user?.authProvider === "facebook"
        ? "Facebook sign-in"
        : "BTS sign-in";
  const summary = isFirstTimeUser
    ? "Jump into Battle Trivia, lock in your first result, and start giving yourself something worth chasing."
    : "Keep pressure on the Battle Trivia board, jump back into live rooms, and see if your momentum is actually holding.";
  const momentumLabel = currentStanding
    ? `Board spot #${currentStanding.rank}`
    : "Fresh start";
  const statCards = [
    {
      label: "Current rank",
      value: currentStanding ? `#${currentStanding.rank}` : "Unranked",
      helper: currentStanding ? `${currentStanding.score} pts` : "Get on the Battle Trivia board",
    },
    {
      label: "Best streak",
      value: bestStreak > 0 ? `x${bestStreak}` : "x0",
      helper: bestStreak > 0 ? "Personal best" : "Start a run",
    },
    {
      label: "Correct answers",
      value: String(totalCorrectAnswers ?? 0),
      helper: (totalCorrectAnswers ?? 0) > 0 ? "Lifetime total" : "No history yet",
    },
  ];

  return (
    <div
      className={`mb-5 rounded-[30px] border p-4 sm:mb-7 sm:rounded-[30px] sm:p-5 lg:p-5 ${
        isLight
          ? "border-[#d8c3a0] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,231,214,0.98))] shadow-[0_18px_40px_rgba(114,84,41,0.12)]"
          : "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.08),transparent_22%),linear-gradient(180deg,rgba(20,24,34,0.98),rgba(8,10,16,0.98))] shadow-[0_22px_48px_rgba(0,0,0,0.22)]"
      }`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div
          className={`h-14 w-14 shrink-0 overflow-hidden rounded-full border sm:h-14 sm:w-14 ${
            isLight
              ? "border-[#e2d4c2] bg-white/80"
              : "border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),rgba(255,255,255,0.04))]"
          }`}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center text-sm font-semibold sm:text-lg ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              {getInitials(displayName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div
              className={`text-[10px] uppercase tracking-[0.2em] sm:text-[11px] ${
                isLight ? "text-[#9a6706]" : "text-blue-300/70"
              }`}
            >
              Dashboard live
            </div>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.14em] sm:hidden ${
                isLight
                  ? "border-[#e2d4c2] bg-white/70 text-stone-500"
                  : "border-white/10 bg-white/[0.04] text-neutral-300"
              }`}
            >
              {providerLabel}
            </span>
          </div>

          <div
            className={`mt-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium sm:text-[14px] ${
              isLight ? "text-stone-500" : "text-neutral-400"
            }`}
          >
            <span className="truncate">{displayName}</span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.14em] ${
                isLight
                  ? "border-[#dcc9aa] bg-amber-50/80 text-amber-800"
                  : "border-emerald-300/15 bg-emerald-400/10 text-emerald-200"
              }`}
            >
              {momentumLabel}
            </span>
          </div>

          <div
            className={`mt-1 hidden rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] sm:inline-flex sm:text-[10px] ${
              isLight
                ? "border-[#e2d4c2] bg-white/70 text-stone-500"
                : "border-white/10 bg-white/[0.04] text-neutral-300"
            }`}
          >
            {providerLabel}
          </div>

          <h1
            className={`mt-2 text-[30px] font-semibold leading-[0.98] tracking-[-0.06em] sm:mt-3 sm:text-[30px] ${
              isLight ? "text-stone-950" : "text-white"
            }`}
          >
            {greeting}
          </h1>

          <p
            className={`hidden mt-2 max-w-[40rem] text-[13px] leading-5 sm:text-[14px] sm:leading-6 ${
              isLight ? "text-stone-500" : "text-neutral-400"
            }`}
          >
            {isFirstTimeUser
              ? "You’re all set. Start with the featured competition, explore the rooms, and build your first result."
              : "Start with the featured competition, jump into rooms, check the weekly standings, or head straight to your profile."}
          </p>

          <p
            className={`mt-2 max-w-[32rem] text-[12px] leading-5 sm:text-[14px] sm:leading-6 ${
              isLight ? "text-stone-500" : "text-neutral-400"
            }`}
          >
            {summary}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-2">
            <Link
              to="/rooms"
              className={`inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[20px] border px-3 py-3 text-[10px] font-medium uppercase tracking-[0.14em] transition sm:min-h-0 sm:rounded-full sm:px-3.5 sm:py-2 sm:text-[11px] ${
                isLight
                  ? "border-stone-200 bg-white/78 text-stone-900 hover:border-[#cda768] hover:bg-white"
                  : "border-blue-400/18 bg-blue-500/10 text-white hover:border-blue-400/22 hover:bg-blue-500/14"
              }`}
            >
              Jump into rooms
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              to="/leaderboards?mode=battle-trivia&period=current"
              className={`inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[20px] border px-3 py-3 text-[10px] font-medium uppercase tracking-[0.14em] transition sm:min-h-0 sm:rounded-full sm:px-3.5 sm:py-2 sm:text-[11px] ${
                isLight
                  ? "border-stone-200 bg-white/62 text-stone-700 hover:border-stone-300 hover:bg-white"
                  : "border-white/8 bg-black/20 text-neutral-200 hover:border-white/12 hover:bg-white/[0.05]"
              }`}
            >
              See standings
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {statCards.map((item, index) => (
              <div
                key={item.label}
                className={`rounded-[20px] border p-3 sm:rounded-[16px] sm:p-3 ${
                  isLight
                    ? "border-[#e2d4c2] bg-white/74"
                    : "border-white/8 bg-black/20"
                } ${index === statCards.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}
              >
                <div
                  className={`text-[9px] uppercase tracking-[0.14em] ${
                    isLight ? "text-stone-500" : "text-neutral-500"
                  }`}
                >
                  {item.label}
                </div>
                <div
                  className={`mt-1 text-[15px] font-semibold tracking-[-0.04em] sm:mt-1.5 sm:text-[18px] ${
                    isLight ? "text-stone-950" : "text-white"
                  }`}
                >
                  {item.value}
                </div>
                <div
                  className={`mt-1 text-[10px] leading-4 sm:text-[11px] ${
                    isLight ? "text-stone-500" : "text-neutral-400"
                  }`}
                >
                  {item.helper}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WinnerSpotlightCard({ winner, sessionPodium, isLight = false }) {
  const cardClassName = isLight
    ? "group block rounded-[22px] border border-[#d7bd8f] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_28%),linear-gradient(180deg,#fff9ef,#f3e3cb)] p-4 shadow-[0_18px_34px_rgba(127,88,35,0.14)] transition hover:-translate-y-[1px] hover:border-[#c79b56] hover:shadow-[0_22px_40px_rgba(127,88,35,0.18)] sm:rounded-[24px] sm:p-5"
    : "group block rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.16)] transition hover:-translate-y-[1px] hover:border-white/15 sm:rounded-[24px] sm:p-5";
  const eyebrowClassName = isLight
    ? "text-[10px] uppercase tracking-[0.18em] text-amber-700/80 sm:text-[11px]"
    : "text-[10px] uppercase tracking-[0.18em] text-amber-200/80 sm:text-[11px]";
  const titleClassName = isLight
    ? "mt-1 text-[24px] font-semibold tracking-[-0.04em] text-stone-950 sm:text-[30px]"
    : "mt-1 text-[24px] font-semibold tracking-[-0.04em] text-white sm:text-[30px]";
  const bodyClassName = isLight
    ? "mt-2 text-[13px] leading-6 text-stone-600 sm:text-[14px]"
    : "mt-2 text-[13px] leading-6 text-neutral-300 sm:text-[14px]";
  const chipClassName = isLight
    ? "rounded-full border border-amber-300 bg-white/78 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-800"
    : "rounded-full border border-amber-300/18 bg-amber-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-100";
  const ctaClassName = isLight
    ? "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f5fa8] transition group-hover:text-[#0b4f8e]"
    : "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200 transition group-hover:text-white";

  return (
    <Link
      to="/leaderboards?mode=battle-trivia&period=previous"
      className={cardClassName}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className={eyebrowClassName}>Last winner</div>
          <div className={titleClassName}>
            {winner ? winner.displayName || winner.username : "Waiting for a finish"}
          </div>
          <div className={bodyClassName}>
            {winner
              ? `${winner.score} pts on the latest Battle Trivia finish.`
              : "As soon as a session closes, the latest winner will headline the dashboard here."}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={chipClassName}>
            {sessionPodium?.endedAt ? formatEndedAt(sessionPodium.endedAt) : "Latest result"}
          </div>
          <div className={ctaClassName}>
            Open standings
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SnapshotOverviewCard({
  currentStanding,
  recentResult,
  bestStreak,
  isLight = false,
}) {
  const cardClassName = isLight
    ? "group block rounded-[22px] border border-[#d8c3a0] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,232,216,0.96))] p-4 shadow-[0_16px_30px_rgba(114,84,41,0.12)] transition hover:-translate-y-[1px] hover:border-[#cda768] hover:shadow-[0_20px_36px_rgba(114,84,41,0.16)] sm:rounded-[24px] sm:p-5"
    : "group block rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 transition hover:-translate-y-[1px] hover:border-white/15 sm:rounded-[24px] sm:p-5";
  const panelClassName = isLight
    ? "rounded-[16px] border border-[#e2d4c2] bg-white/78 p-3.5"
    : "rounded-[16px] border border-white/8 bg-black/20 p-3.5";

  return (
    <Link to="/profile" className={`block ${cardClassName}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div
            className={`text-[10px] uppercase tracking-[0.18em] ${
              isLight ? "text-stone-500" : "text-neutral-500"
            }`}
          >
            Your snapshot
          </div>
          <div
            className={`mt-1 text-[20px] font-semibold tracking-[-0.04em] sm:text-[24px] ${
              isLight ? "text-stone-950" : "text-white"
            }`}
          >
            Your recent shape at a glance
          </div>
          <div
            className={`mt-2 max-w-[38rem] text-[13px] leading-6 ${
              isLight ? "text-stone-600" : "text-neutral-400"
            }`}
          >
            Open profile for the deeper view, but this card keeps your latest result,
            best streak, and current place easy to scan from the dashboard.
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            isLight ? "text-[#0f5fa8]" : "text-blue-200"
          }`}
        >
          Open profile
          <span aria-hidden="true">→</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className={panelClassName}>
          <div className={`text-[10px] uppercase tracking-[0.16em] ${isLight ? "text-stone-500" : "text-neutral-500"}`}>
            Recent result
          </div>
          {recentResult ? (
            <>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div
                  className={`text-[22px] font-semibold tracking-[-0.04em] ${
                    isLight ? "text-stone-950" : "text-white"
                  }`}
                >
                  {formatPoints(recentResult.score)}
                </div>

                <div
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                    isLight
                      ? "border-sky-300 bg-sky-50 text-sky-800"
                      : "border-blue-400/18 bg-blue-500/10 text-blue-200"
                  }`}
                >
                  #{recentResult.rank}
                </div>
              </div>

              <div className={`mt-1 text-[12px] ${isLight ? "text-stone-600" : "text-neutral-400"}`}>
                {recentResult.title || "Battle Trivia"} · {formatShortDate(recentResult.endedAt)}
              </div>
            </>
          ) : (
            <>
              <div className={`mt-2 text-[22px] font-semibold tracking-[-0.04em] ${isLight ? "text-stone-950" : "text-white"}`}>
                —
              </div>
              <div className={`mt-1 text-[12px] ${isLight ? "text-stone-600" : "text-neutral-400"}`}>
                Play a round to start filling this out.
              </div>
            </>
          )}
        </div>

        <div className={panelClassName}>
          <div className={`text-[10px] uppercase tracking-[0.16em] ${isLight ? "text-stone-500" : "text-neutral-500"}`}>
            Best streak
          </div>
          <div className={`mt-2 text-[22px] font-semibold tracking-[-0.04em] ${isLight ? "text-stone-950" : "text-white"}`}>
            x{bestStreak}
          </div>
          <div className={`mt-1 text-[12px] ${isLight ? "text-stone-600" : "text-neutral-400"}`}>
            {bestStreak > 0
              ? "Your best run so far."
              : "No streak recorded yet."}
          </div>
        </div>

        <div className={panelClassName}>
          <div className={`text-[10px] uppercase tracking-[0.16em] ${isLight ? "text-stone-500" : "text-neutral-500"}`}>
            Current standing
          </div>
          <div className={`mt-2 text-[22px] font-semibold tracking-[-0.04em] ${isLight ? "text-stone-950" : "text-white"}`}>
            {currentStanding ? `#${currentStanding.rank}` : "Unranked"}
          </div>
          <div className={`mt-1 text-[12px] ${isLight ? "text-stone-600" : "text-neutral-400"}`}>
            {currentStanding
              ? `${currentStanding.score} pts in current-week Battle Trivia.`
              : "No placement in the current Battle Trivia board yet."}
          </div>
        </div>
      </div>
    </Link>
  );
}

function RecentResultPulseCard({ recentResult, isLight = false }) {
  const shellClassName = isLight
    ? "rounded-[18px] border border-[#ddc8a8] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,232,216,0.96))] p-3.5 shadow-[0_16px_28px_rgba(114,84,41,0.1)] transition hover:border-[#cda768] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,239,226,1))] sm:rounded-[20px] sm:p-4"
    : "rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.018))] sm:rounded-[20px] sm:p-4";

  const statChipClassName = isLight
    ? "rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-sky-800"
    : "rounded-full border border-blue-400/18 bg-blue-500/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-blue-200";

  return (
    <Link to="/activity" className={`block ${shellClassName}`}>
      <div className="flex items-center justify-between gap-3">
        <div
          className={`text-[10px] uppercase tracking-[0.16em] ${
            isLight ? "text-stone-500" : "text-neutral-500"
          }`}
        >
          Recent result
        </div>
        <div className={statChipClassName}>Review</div>
      </div>

      {recentResult ? (
        <>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className={`text-[22px] font-semibold tracking-[-0.04em] ${
                  isLight ? "text-stone-900" : "text-white"
                }`}
              >
                {formatPoints(recentResult.score)}
              </div>
              <div
                className={`mt-1 truncate text-[12px] leading-5 ${
                  isLight ? "text-stone-600" : "text-neutral-400"
                }`}
              >
                {recentResult.title || "Battle Trivia"}
              </div>
            </div>

            <div
              className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                isLight
                  ? "border-[#e2d4c2] bg-white/80 text-stone-700"
                  : "border-white/10 bg-white/[0.04] text-neutral-300"
              }`}
            >
              #{recentResult.rank}
            </div>
          </div>

          <div
            className={`mt-3 flex items-center justify-between gap-3 text-[12px] ${
              isLight ? "text-stone-600" : "text-neutral-400"
            }`}
          >
            <span className="truncate">{formatShortDate(recentResult.endedAt)}</span>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] ${
                isLight ? "text-[#0f5fa8]" : "text-blue-300/80"
              }`}
            >
              Open activity
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </>
      ) : (
        <>
          <div
            className={`mt-2.5 text-[20px] font-semibold tracking-[-0.04em] sm:text-[22px] ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            No result yet
          </div>

          <div
            className={`mt-1.5 text-[12px] leading-5 sm:text-[13px] sm:leading-6 ${
              isLight ? "text-stone-600" : "text-neutral-400"
            }`}
          >
            Jump into the featured room to start building your history.
          </div>
        </>
      )}
    </Link>
  );
}

function PulseCard({
  to,
  eyebrow,
  title,
  description,
  accent = "blue",
  cta = "View",
  isLight = false,
}) {
  const accentClasses =
    accent === "violet"
      ? isLight
        ? "border-violet-300 bg-violet-50 text-violet-800"
        : "border-violet-400/18 bg-violet-500/10"
      : accent === "emerald"
      ? isLight
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-emerald-400/18 bg-emerald-500/10"
      : isLight
      ? "border-sky-300 bg-sky-50 text-sky-800"
      : "border-blue-400/18 bg-blue-500/10";

  return (
    <Link
      to={to}
      className={`block rounded-[18px] border p-3.5 transition sm:rounded-[20px] sm:p-4 ${
        isLight
          ? "border-[#ddc8a8] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,232,216,0.96))] shadow-[0_16px_28px_rgba(114,84,41,0.1)] hover:border-[#cda768] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,239,226,1))]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.018))]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`text-[10px] uppercase tracking-[0.16em] ${
            isLight ? "text-stone-500" : "text-neutral-500"
          }`}
        >
          {eyebrow}
        </div>
        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentClasses}`}
        >
          {cta}
        </div>
      </div>

      <div
        className={`mt-2.5 text-[20px] font-semibold tracking-[-0.04em] sm:text-[22px] ${
          isLight ? "text-stone-900" : "text-white"
        }`}
      >
        {title}
      </div>

      <div
        className={`mt-1.5 text-[12px] leading-5 sm:text-[13px] sm:leading-6 ${
          isLight ? "text-stone-600" : "text-neutral-400"
        }`}
      >
        {description}
      </div>
    </Link>
  );
}

function NextMoveRow({
  step,
  title,
  description,
  to,
  actionLabel,
  accent = "blue",
  isLight = false,
}) {
  const accentClasses =
    accent === "violet"
      ? isLight
        ? "border-violet-300 bg-violet-50 text-violet-800"
        : "border-violet-400/18 bg-violet-500/10 text-violet-200"
      : accent === "emerald"
      ? isLight
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
      : isLight
      ? "border-sky-300 bg-sky-50 text-sky-800"
      : "border-blue-400/18 bg-blue-500/10 text-blue-200";

  return (
    <div
      className={`rounded-[14px] border px-3 py-2.5 sm:rounded-[16px] sm:px-3.5 sm:py-3 ${
        isLight
          ? "border-[#e2d4c2] bg-[rgba(255,252,247,0.86)]"
          : "border-white/8 bg-black/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`text-[10px] uppercase tracking-[0.14em] ${
              isLight ? "text-stone-500" : "text-neutral-500"
            }`}
          >
            {step}
          </div>
          <div
            className={`mt-1 text-[13px] font-semibold sm:text-sm ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {title}
          </div>
          <div
            className={`mt-1 text-[11px] leading-5 sm:text-[12px] ${
              isLight ? "text-stone-600" : "text-neutral-400"
            }`}
          >
            {description}
          </div>
        </div>

        <Link
          to={to}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] transition hover:opacity-90 ${accentClasses}`}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

function NextUpCard({ isFirstTimeUser, featuredRoom, isLight = false }) {
  const featuredLink = featuredRoom ? `/rooms/${featuredRoom.id}` : "/rooms";

  return (
    <div
      className={`rounded-[20px] border p-3.5 sm:rounded-[24px] sm:p-4 ${
        isLight
          ? "border-[#dcc9aa] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,232,216,0.96))] shadow-[0_16px_28px_rgba(114,84,41,0.1)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={`text-[10px] uppercase tracking-[0.16em] ${
              isLight ? "text-stone-500" : "text-neutral-500"
            }`}
          >
            Next up
          </div>
          <div
            className={`mt-1.5 text-[15px] font-semibold tracking-[-0.03em] sm:text-[17px] ${
              isLight ? "text-stone-900" : "text-white"
            }`}
          >
            {isFirstTimeUser ? "Your first 3 moves" : "Keep momentum going"}
          </div>
        </div>

        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${
            isLight
              ? "border-[#e2d4c2] bg-white/70 text-stone-500"
              : "border-white/10 bg-white/[0.04] text-neutral-300"
          }`}
        >
          Quick
        </div>
      </div>

      <div
        className={`mt-2 text-[12px] leading-5 sm:text-[13px] ${
          isLight ? "text-stone-600" : "text-neutral-400"
        }`}
      >
        {isFirstTimeUser
          ? "Start cleanly and let the app begin to populate around your activity."
          : "Use the dashboard as a control point, then move straight into what matters."}
      </div>

      <div className="mt-3 space-y-2.5">
        {isFirstTimeUser ? (
          <>
            <NextMoveRow
              step="Step 1"
              title="Enter the featured room"
              description="Play your first round and start building history."
              to={featuredLink}
              actionLabel="Play"
              accent="blue"
              isLight={isLight}
            />
            <NextMoveRow
              step="Step 2"
              title="Check live standings"
              description="See how the weekly competition is moving."
              to="/leaderboards?mode=battle-trivia&period=current"
              actionLabel="View"
              accent="violet"
              isLight={isLight}
            />
            <NextMoveRow
              step="Step 3"
              title="Complete your profile"
              description="Set your display name and account details."
              to="/profile"
              actionLabel="Edit"
              accent="emerald"
              isLight={isLight}
            />
          </>
        ) : (
          <>
            <NextMoveRow
              step="Play"
              title="Jump back into competition"
              description="Use the featured room for the fastest return to live play."
              to={featuredLink}
              actionLabel="Open"
              accent="blue"
              isLight={isLight}
            />
            <NextMoveRow
              step="Track"
              title="Review your recent activity"
              description="Open your activity page to check recent results."
              to="/activity"
              actionLabel="Review"
              accent="violet"
              isLight={isLight}
            />
            <NextMoveRow
              step="Compare"
              title="Check where you stand"
              description="See your place in the current rankings this week."
              to="/leaderboards?mode=battle-trivia&period=current"
              actionLabel="Compare"
              accent="emerald"
              isLight={isLight}
            />
          </>
        )}
      </div>
    </div>
  );
}

// function MentionSummaryCard({ roomsWithUnreadMentions, totalUnreadMentions }) {
//   if (totalUnreadMentions <= 0) return null;

//   const priorityRoom = roomsWithUnreadMentions[0] || null;

//   return (
//     <div className="mb-5 rounded-[20px] border border-amber-400/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_38%),linear-gradient(180deg,rgba(245,158,11,0.1),rgba(245,158,11,0.04))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.12)] sm:mb-6 sm:rounded-[24px] sm:p-5">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div>
//           <div className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80 sm:text-[11px]">
//             Mentions waiting
//           </div>
//           <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[18px]">
//             You have {formatMentionCount(totalUnreadMentions)} waiting across{" "}
//             {roomsWithUnreadMentions.length} room
//             {roomsWithUnreadMentions.length === 1 ? "" : "s"}.
//           </div>
//           <div className="mt-1.5 text-[12px] leading-5 text-amber-50/80 sm:text-[13px]">
//             Open a room to clear its unread mentions.
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           {priorityRoom ? (
//             <Link
//               to={`/rooms/${priorityRoom.id}`}
//               className="inline-flex items-center gap-2 rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-amber-300/14 sm:px-4 sm:py-2 sm:text-sm"
//             >
//               Open latest mention
//               <span aria-hidden="true">→</span>
//             </Link>
//           ) : null}

//           <Link
//             to="/rooms"
//             className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.06] sm:px-4 sm:py-2 sm:text-sm"
//           >
//             View rooms
//             <span aria-hidden="true">→</span>
//           </Link>
//         </div>
//       </div>

//       <div className="mt-3 flex flex-wrap gap-2">
//         {roomsWithUnreadMentions.slice(0, 3).map((room) => (
//           <Link
//             key={room.id}
//             to={`/rooms/${room.id}`}
//             className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white transition hover:bg-black/30"
//           >
//             <span className="truncate">{room.name}</span>
//             <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium text-amber-100">
//               {room.unreadMentionCount}
//             </span>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }

export default function LobbyPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const { syncRoomsFromPayload, mergeRooms } = useMentions();

  const [rawRooms, setRawRooms] = useState([]);
  const [featuredRoomStatus, setFeaturedRoomStatus] = useState(null);
  const [sessionPodium, setSessionPodium] = useState(null);
  const [currentLeaders, setCurrentLeaders] = useState([]);
  const [wordScrambleLeaders, setWordScrambleLeaders] = useState([]);
  const [battleTriviaBoardRows, setBattleTriviaBoardRows] = useState([]);
  const [battleTriviaSponsor, setBattleTriviaSponsor] = useState(null);
  const [profileOverview, setProfileOverview] = useState(null);
  const [recentResult, setRecentResult] = useState(null);
  const [shouldLoadStandingsSection, setShouldLoadStandingsSection] =
    useState(false);
  const [hasLoadedStandingsSection, setHasLoadedStandingsSection] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadMentions, setUnreadMentions] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setError("");
      setIsLoading(true);

      try {
        const [roomsData, mentionsData] = await Promise.all([
          getRooms(),
          getUnreadMentions(8).catch(() => []),
        ]);
        if (!isMounted) return;

        const nextRooms = Array.isArray(roomsData) ? roomsData : [];
        setRawRooms(nextRooms);
        syncRoomsFromPayload(nextRooms);
        setUnreadMentions(Array.isArray(mentionsData) ? mentionsData : []);

        const battleTriviaRoom =
          nextRooms.find((room) => room.slug === "battle-trivia") ||
          nextRooms.find((room) => room.roomType === "trivia") ||
          null;

        const [
          status,
          podium,
          leaders,
          battleTriviaBoard,
          sponsorData,
          profileData,
          historyData,
        ] = await Promise.all([
          battleTriviaRoom
            ? getRoomSessionStatus(battleTriviaRoom.id).catch(() => null)
            : Promise.resolve(null),
          getBattleTriviaSessionPodium().catch(() => null),
          getCurrentBattleTriviaLeaderboard(3).catch(() => []),
          getLeaderboard("battle-trivia", "current", 100).catch(() => ({
            rows: [],
          })),
          getActiveSponsor("battle-trivia").catch(() => null),
          getMyProfile().catch(() => null),
          getMyProfileHistory(1, 1).catch(() => ({
            items: [],
          })),
        ]);

        if (isMounted) {
          setFeaturedRoomStatus(status || null);
          setSessionPodium(podium || null);
          setCurrentLeaders(Array.isArray(leaders) ? leaders : []);
          setBattleTriviaBoardRows(
            Array.isArray(battleTriviaBoard?.rows) ? battleTriviaBoard.rows : []
          );
          setBattleTriviaSponsor(sponsorData || null);
          setProfileOverview(profileData || null);
          setRecentResult(
            Array.isArray(historyData?.items)
              ? historyData.items[0] || null
              : null
          );
        }
      } catch {
        if (isMounted) {
          setError("Failed to load dashboard.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [syncRoomsFromPayload]);

  useEffect(() => {
    if (!shouldLoadStandingsSection || hasLoadedStandingsSection) {
      return undefined;
    }

    let isMounted = true;

    async function loadStandingsSection() {
      const scrambleBoard = await getLeaderboard(
        "word-scramble",
        "current",
        3
      ).catch(() => ({
        rows: [],
      }));

      if (!isMounted) return;

      setWordScrambleLeaders(
        Array.isArray(scrambleBoard?.rows) ? scrambleBoard.rows : []
      );
      setHasLoadedStandingsSection(true);
    }

    loadStandingsSection();

    return () => {
      isMounted = false;
    };
  }, [hasLoadedStandingsSection, shouldLoadStandingsSection]);

  const rooms = useMemo(() => mergeRooms(rawRooms), [rawRooms, mergeRooms]);

  const featuredRoom = useMemo(() => {
    const baseRoom =
      rooms.find((room) => room.slug === "battle-trivia") ||
      rooms.find((room) => room.roomType === "trivia") ||
      null;

    if (!baseRoom) return null;

    return {
      ...baseRoom,
      sessionStatus: featuredRoomStatus,
    };
  }, [rooms, featuredRoomStatus]);

  // const roomsWithUnreadMentions = useMemo(() => {
  //   return [...rooms]
  //     .filter((room) => (Number(room?.unreadMentionCount) || 0) > 0)
  //     .sort(
  //       (a, b) =>
  //         (Number(b?.unreadMentionCount) || 0) -
  //         (Number(a?.unreadMentionCount) || 0)
  //     );
  // }, [rooms]);

  // const totalUnreadMentions = useMemo(() => {
  //   return roomsWithUnreadMentions.reduce(
  //     (sum, room) => sum + (Number(room?.unreadMentionCount) || 0),
  //     0
  //   );
  // }, [roomsWithUnreadMentions]);

  const showPodium =
    !!sessionPodium?.hasPodium && sessionPodium?.winners?.length > 0;
  const showCurrentLeaders = !showPodium && currentLeaders.length > 0;
  const latestWinner =
    sessionPodium?.winners?.find((entry) => entry.rank === 1) || null;

  const battleTriviaLeadersPreview = useMemo(
    () => currentLeaders.slice(0, 3),
    [currentLeaders]
  );

  const currentStanding = useMemo(() => {
    if (!user?.id) return null;
    return battleTriviaBoardRows.find((row) => row.userId === user.id) || null;
  }, [battleTriviaBoardRows, user?.id]);

  const totalCorrectAnswers = profileOverview?.stats?.totalCorrectAnswers ?? 0;
  const bestStreak = profileOverview?.stats?.bestStreak ?? 0;

  const isFirstTimeUser =
    !recentResult &&
    !currentStanding &&
    bestStreak === 0 &&
    totalCorrectAnswers === 0;
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`lobby-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "lobby-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />
        <DashboardHero
          user={user}
          isFirstTimeUser={isFirstTimeUser}
          currentStanding={currentStanding}
          bestStreak={bestStreak}
          totalCorrectAnswers={totalCorrectAnswers}
          isLight={isLight}
        />
        {error ? (
          <div className="mb-5 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90 sm:mb-6 sm:rounded-[22px]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
            Loading dashboard...
          </div>
        ) : (
          <>
            <section className="mb-6 sm:mb-8">
              <MobileLobbySection
                eyebrow="Winners"
                title="Who owns the week?"
                description="Latest result up top, then the current board if the race is still moving."
                isLight={isLight}
              >
                <div className="sm:hidden">
                  {showPodium ? (
                    <WinnersPodiumCard
                      title="Latest Battle Trivia winners"
                      subtitle={`Finished ${formatEndedAt(
                        sessionPodium.endedAt
                      )}. First, second, and third are now front and center in the dashboard.`}
                      winners={sessionPodium.winners}
                      to="/leaderboards?mode=battle-trivia&period=previous"
                    />
                  ) : (
                    <WinnerSpotlightCard
                      winner={latestWinner}
                      sessionPodium={sessionPodium}
                      isLight={isLight}
                    />
                  )}
                </div>

                <div className="hidden sm:block">
                  <WinnerSpotlightCard
                    winner={latestWinner}
                    sessionPodium={sessionPodium}
                    isLight={isLight}
                  />
                </div>

                {hasSponsorPlacement(battleTriviaSponsor, "lobby-featured") ? (
                  <div className="mt-3 sm:mt-4">
                    <SponsorSpotlightCard sponsor={battleTriviaSponsor} />
                  </div>
                ) : null}

                <div className="hidden sm:block">
                  {showPodium ? (
                    <WinnersPodiumCard
                      title="Latest Battle Trivia winners"
                      subtitle={`Finished ${formatEndedAt(
                        sessionPodium.endedAt
                      )}. First, second, and third are now front and center in the dashboard.`}
                      winners={sessionPodium.winners}
                      to="/leaderboards?mode=battle-trivia&period=previous"
                    />
                  ) : showCurrentLeaders ? (
                    <LeadersPanel
                      title="Current Battle Trivia leaders"
                      subtitle="Live standings for this week"
                      entries={currentLeaders}
                      isLight={isLight}
                    />
                  ) : null}
                </div>
              </MobileLobbySection>
            </section>
            {featuredRoom ? (
              <section className="mb-6 sm:hidden">
                <MobileLobbySection
                  eyebrow="Battle Trivia"
                  title="Main competition"
                  description="Jump straight into the featured room from the dashboard."
                  isLight={isLight}
                >
                  <div className="grid gap-4">
                    <FeaturedTriviaCard room={featuredRoom} />
                  </div>
                </MobileLobbySection>
              </section>
            ) : null}

            <div className="hidden sm:block">
              <MentionInboxCard
                title="Unread mentions"
                description="Open a mention and jump into the exact message instead of just clearing a room badge."
                items={unreadMentions}
              />
            </div>

            {false ? (
            <section className="mb-7 sm:mb-9">
              <SectionHeader
                eyebrow="Personal"
                title={isFirstTimeUser ? "Getting started" : "Your snapshot"}
                description={
                  isFirstTimeUser
                    ? "A cleaner first-time experience: start playing, complete your profile, and watch your results appear here."
                    : "One clean clickable snapshot instead of three separate mini-cards."
                }
                isLight={isLight}
              />

              {!isFirstTimeUser ? (
                <div className="mb-3 sm:mb-4">
                  <SnapshotOverviewCard
                    currentStanding={currentStanding}
                    recentResult={recentResult}
                    bestStreak={bestStreak}
                    isLight={isLight}
                  />
                </div>
              ) : null}

              <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
                {isFirstTimeUser ? (
                  <>
                    <div className="hidden sm:block">
                    <PulseCard
                      to={featuredRoom ? `/rooms/${featuredRoom.id}` : "/rooms"}
                      eyebrow="Step 1"
                      title="Play your first round"
                      description="Enter the featured room and answer a few questions to start building history."
                      accent="blue"
                      cta="Start"
                      isLight={isLight}
                    />
                    </div>

                    <div className="hidden sm:block">
                    <PulseCard
                      to="/rooms"
                      eyebrow="Step 2"
                      title="Explore game rooms"
                      description="Browse the competitive spaces and find the rooms you want to return to."
                      accent="violet"
                      cta="Browse"
                      isLight={isLight}
                    />
                    </div>

                    <div className="hidden sm:block">
                    <PulseCard
                      to="/profile"
                      eyebrow="Step 3"
                      title="Finish your profile"
                      description="Update your display name and account details so the app feels more personal."
                      accent="emerald"
                      cta="Edit"
                      isLight={isLight}
                    />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hidden">
                    <RecentResultPulseCard
                      recentResult={recentResult}
                      isLight={isLight}
                    />
                    </div>

                    <div className="hidden">
                    <PulseCard
                      to="/profile"
                      eyebrow="Best streak"
                      title={`x${bestStreak}`}
                      description={
                        bestStreak > 0
                          ? "Your all-time best answer streak."
                          : "No streak recorded yet — start a run and build momentum."
                      }
                      accent="violet"
                      isLight={isLight}
                    />
                    </div>

                    <div className="hidden">
                    <PulseCard
                      to="/leaderboards?mode=battle-trivia&period=current"
                      eyebrow="Current standing"
                      title={currentStanding ? `#${currentStanding.rank}` : "Unranked"}
                      description={
                        currentStanding
                          ? `${currentStanding.score} pts in current-week Battle Trivia.`
                          : "You are not placed in the current Battle Trivia standings yet."
                      }
                      accent="emerald"
                      isLight={isLight}
                    />
                    </div>
                  </>
                )}
              </div>
            </section>
            ) : null}

            {featuredRoom ? (
              <DeferredSection minHeightClassName="hidden min-h-[320px] sm:block">
                <section className="hidden sm:block sm:mb-8">
                <SectionHeader
                  eyebrow="Battle Trivia"
                  title="Main competition"
                  description="A big direct entry into the main room, with live state and run mode visible before you jump in."
                  isLight={isLight}
                />

                <div className="grid gap-4">
                  <FeaturedTriviaCard room={featuredRoom} />
                </div>
                </section>
              </DeferredSection>
            ) : null}

            <DeferredSection minHeightClassName="hidden min-h-[250px] sm:block">
              <section className="hidden sm:block sm:mb-9">
              <SectionHeader
                eyebrow="Explore"
                title="Keep exploring"
                description="Use the dashboard like a launchpad and move straight into the part of the app you want."
                isLight={isLight}
              />

              <div className="grid gap-3 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuickDestinationCard
                    to="/rooms"
                    eyebrow="Rooms"
                    title="Open all rooms"
                    description="Jump across Battle Trivia, Word Scramble, and every other live space."
                    isLight={isLight}
                  />

                  <QuickDestinationCard
                    to="/community"
                    eyebrow="Community"
                    title="Join the community"
                    description="Move into social rooms, side conversations, and the lighter side of the app."
                    isLight={isLight}
                  />
                </div>

                <NextUpCard
                  isFirstTimeUser={isFirstTimeUser}
                  featuredRoom={featuredRoom}
                  isLight={isLight}
                />
              </div>
              </section>
            </DeferredSection>

            <DeferredSection
              minHeightClassName="min-h-[300px]"
              onVisible={() => setShouldLoadStandingsSection(true)}
            >
              <section>
              <MobileLobbySection
                eyebrow="Standings"
                title="Weekly race"
                description="A quick Battle Trivia score race for this week, then the deeper boards when you want them."
                isLight={isLight}
              >
                <div className="hidden sm:block">
                  <SectionHeader
                    eyebrow="Standings"
                    title="Weekly race"
                    description="A quick Battle Trivia score race for this week, then the full standings page when you want the deeper view."
                    isLight={isLight}
                  />
                </div>

                {hasSponsorPlacement(battleTriviaSponsor, "lobby-standings") ? (
                  <div className="mb-3 sm:mb-4">
                    <SponsorSpotlightCard sponsor={battleTriviaSponsor} compact />
                  </div>
                ) : null}

                <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <LeaderboardPreviewCard
                    title="Battle Trivia race"
                    subtitle="Current week · Top 3 across Battle Trivia and Word Scramble"
                    rows={battleTriviaLeadersPreview}
                    to="/leaderboards?mode=battle-trivia&period=current"
                    accent="blue"
                  />

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <QuickDestinationCard
                      to="/leaderboards?mode=battle-trivia&period=previous"
                      eyebrow="Winners archive"
                      title="See recent Battle Trivia results"
                      description="Open the leaderboard page to review completed sessions and full rankings beyond the podium."
                      isLight={isLight}
                    />

                    <QuickDestinationCard
                      to="/leaderboards?mode=word-scramble&period=current"
                      eyebrow="Live race"
                      title="Check Word Scramble standings"
                      description={`${
                        wordScrambleLeaders[0]?.displayName ||
                        wordScrambleLeaders[0]?.username ||
                        "Live players"
                      } and the rest of the field are still climbing this week's board.`}
                      isLight={isLight}
                    />
                  </div>
                </div>
              </MobileLobbySection>
              </section>
            </DeferredSection>
          </>
        )}
      </div>

    </div>
  );
}
