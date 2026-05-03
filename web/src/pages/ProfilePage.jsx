import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  changeMyPassword,
  getMyMissions,
  getMyProfile,
  getMyProfileHistory,
  getMyProgression,
  updateMyProfile,
} from "../api/profileApi";
import { getLeaderboard } from "../api/leaderboardsApi";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getMyFriendNetwork,
  searchPlayers,
  sendFriendRequest,
} from "../api/friendsApi";
import ProfileAchievementsCard from "../components/profile/ProfileAchievementsCard";
import ProfileFriendsCard from "../components/profile/ProfileFriendsCard";
import ProfileMissionsCard from "../components/profile/ProfileMissionsCard";
import ProfileProgressCard from "../components/profile/ProfileProgressCard";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import { useSoundPreferences } from "../hooks/useSoundPreferences";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushConfig,
  isPushSupported,
  syncPushSubscriptionIfEnabled,
} from "../pwa/pushNotifications";
import {
  buildPlayerRecapImageUrl,
  buildPlayerRecapUrl,
  buildShareUrl,
  buildStreakCardSvg,
  buildTopTenCardSvg,
  downloadGeneratedCardPng,
  downloadImageUrlPng,
  downloadShareCardPng,
} from "../services/leaderboardShare";

function formatFastest(ms) {
  if (typeof ms !== "number") return "-";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 10000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInitials(value) {
  if (!value) return "P";

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function getAuthProviderLabel(provider) {
  return provider === "google"
    ? "Google account"
    : provider === "facebook"
      ? "Facebook account"
      : "BTS account";
}

function getAvatarCropMetrics(pendingAvatar, crop, frameSize) {
  if (!pendingAvatar?.naturalWidth || !pendingAvatar?.naturalHeight) {
    return null;
  }

  const zoom = Math.max(1, Number(crop?.zoom || 1));
  const baseScale = Math.max(
    frameSize / pendingAvatar.naturalWidth,
    frameSize / pendingAvatar.naturalHeight
  );
  const scaledWidth = pendingAvatar.naturalWidth * baseScale * zoom;
  const scaledHeight = pendingAvatar.naturalHeight * baseScale * zoom;
  const maxOffsetX = Math.max(0, (scaledWidth - frameSize) / 2);
  const maxOffsetY = Math.max(0, (scaledHeight - frameSize) / 2);
  const offsetX = ((Number(crop?.x || 0) || 0) / 100) * maxOffsetX;
  const offsetY = ((Number(crop?.y || 0) || 0) / 100) * maxOffsetY;

  return {
    scaledWidth,
    scaledHeight,
    offsetX,
    offsetY,
  };
}

function readImageDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      });
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
}

async function buildCroppedAvatar(src, crop, outputSize = 512) {
  const image = await new Promise((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error("Could not load image."));
    nextImage.src = src;
  });

  const metrics = getAvatarCropMetrics(
    {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    },
    crop,
    outputSize
  );

  if (!metrics) {
    throw new Error("Could not crop image.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not crop image.");
  }

  const drawX = outputSize / 2 - metrics.scaledWidth / 2 + metrics.offsetX;
  const drawY = outputSize / 2 - metrics.scaledHeight / 2 + metrics.offsetY;

  context.clearRect(0, 0, outputSize, outputSize);
  context.drawImage(image, drawX, drawY, metrics.scaledWidth, metrics.scaledHeight);

  return canvas.toDataURL("image/jpeg", 0.92);
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          {eyebrow}
        </div>
        <div className="mt-1 text-[19px] font-semibold tracking-[-0.03em] text-white">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-[13px] leading-6 text-neutral-400">
            {description}
          </div>
        ) : null}
      </div>
      {action || null}
    </div>
  );
}

function MobileSectionShell({ eyebrow, title, description, children, accent = "blue" }) {
  const accentClass =
    accent === "amber"
      ? "border-amber-300/16 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]"
      : accent === "violet"
        ? "border-violet-300/16 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]"
        : "border-blue-300/16 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]";

  return (
    <section className={`mb-5 rounded-[28px] border p-4 sm:hidden ${accentClass}`}>
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          {eyebrow}
        </div>
        <div className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-white">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-[13px] leading-6 text-neutral-400">
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div
      className={`rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-white">
        {value}
      </div>
      {detail ? <div className="mt-1 text-[12px] text-neutral-400">{detail}</div> : null}
    </div>
  );
}

function HistoryItem({ item }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-white">
            {item.title || "Battle Trivia session"}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">{formatDate(item.endedAt)}</div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[15px] font-semibold text-blue-300">{item.score} pts</div>
          <div className="mt-1 text-[11px] text-neutral-500">Rank #{item.rank}</div>
        </div>
      </div>
    </div>
  );
}

function MobileProfileHero({
  profile,
  authUser,
  avatarUrl,
  statusMessage,
  progression,
  stats,
  playerMomentum,
  currentStanding,
  onAvatarFileChange,
  onRemoveAvatar,
  isRemovingAvatar = false,
}) {
  const displayName =
    profile?.displayName ||
    authUser?.displayName ||
    profile?.username ||
    authUser?.username ||
    "Player";
  const username = profile?.username || authUser?.username || "username";
  const providerLabel = getAuthProviderLabel(authUser?.authProvider || "local");
  const isSupporter = authUser?.isSupporter || profile?.isSupporter;
  const progressPercent =
    progression && progression.nextLevelXp > progression.currentLevelStartXp
      ? Math.min(
          100,
          Math.round(
            ((progression.xpTotal - progression.currentLevelStartXp) /
              (progression.nextLevelXp - progression.currentLevelStartXp)) *
              100
          )
        )
      : 0;

  return (
    <div className="mb-5 rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/75">
            Your account
          </div>
          <div className="mt-1 text-[28px] font-semibold tracking-[-0.05em] text-white">
            {displayName}
          </div>
          <div className="mt-1 text-[13px] text-neutral-400">@{username}</div>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300">
          {providerLabel}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <label
            className="absolute -right-1 bottom-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-blue-300/18 bg-blue-500 text-sm text-white shadow-[0_8px_22px_rgba(37,99,235,0.28)] transition hover:bg-blue-400"
            aria-label="Upload profile photo"
            title="Upload profile photo"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path
                d="M10 13.5V6.5M6.75 9.75L10 6.5L13.25 9.75M5.5 14.75H14.5"
                className="stroke-current"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarFileChange}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onRemoveAvatar}
            disabled={!avatarUrl || isRemovingAvatar}
            className="absolute -left-1 bottom-3 flex h-8 w-8 items-center justify-center rounded-full border border-red-300/18 bg-red-500/90 text-sm text-white shadow-[0_8px_22px_rgba(239,68,68,0.22)] transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Remove profile photo"
            title="Remove profile photo"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path
                d="M7.75 5.75H12.25M5.75 7.25L6.4 14.08C6.5 15.1 7.36 15.88 8.39 15.88H11.61C12.64 15.88 13.5 15.1 13.6 14.08L14.25 7.25M8.5 8.75V12.5M11.5 8.75V12.5M7.25 5.75L7.7 4.87C7.95 4.37 8.46 4.05 9.02 4.05H10.98C11.54 4.05 12.05 4.37 12.3 4.87L12.75 5.75"
                className="stroke-current"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            {progression ? (
              <div className="rounded-full border border-blue-300/18 bg-blue-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-blue-100">
                Level {progression.level}
              </div>
            ) : null}
            {currentStanding?.rank ? (
              <div className="rounded-full border border-emerald-300/18 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-100">
                Rank #{currentStanding.rank}
              </div>
            ) : null}
            <div
              className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                isSupporter
                  ? "border-amber-300/18 bg-amber-400/10 text-amber-100"
                  : "border-white/10 bg-white/[0.04] text-neutral-300"
              }`}
            >
              {isSupporter ? "Supporter active" : "Supporter inactive"}
            </div>
          </div>

          {progression ? (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-neutral-400">
                <span>{progression.xpTotal.toLocaleString()} XP</span>
                <span>{progressPercent}% to next level</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(59,130,246,1)_0%,rgba(96,165,250,1)_45%,rgba(139,92,246,1)_100%)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Correct
              </div>
              <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white">
                {stats?.totalCorrectAnswers ?? 0}
              </div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Weekly wins
              </div>
              <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white">
                {stats?.weeklyWins ?? 0}
              </div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Fastest
              </div>
              <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white">
                {formatFastest(stats?.fastestCorrectAnswerMs)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3 text-left">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            DM status
          </div>
          <div className="mt-1 text-[13px] leading-5 text-white">
            {statusMessage || "No status set right now."}
          </div>
        </div>

        {playerMomentum ? (
          <div className="rounded-[20px] border border-violet-400/18 bg-violet-500/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-violet-100/75">
              This week
            </div>
            <div className="mt-1 text-sm font-medium text-white">{playerMomentum.title}</div>
            <div className="mt-1 text-[12px] leading-5 text-violet-100/80">
              {playerMomentum.detail}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MobileProfileField({ icon, label, helper, children }) {
  return (
    <div className="flex gap-3 rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-base text-neutral-300">
        <span aria-hidden="true">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          {label}
        </div>
        <div className="mt-2">{children}</div>
        {helper ? <div className="mt-2 text-[11px] leading-4 text-neutral-500">{helper}</div> : null}
      </div>
    </div>
  );
}

function AvatarCropModal({
  pendingAvatar,
  crop,
  onCropChange,
  onCancel,
  onApply,
  isApplying = false,
}) {
  const previewMetrics = getAvatarCropMetrics(pendingAvatar, crop, 240);

  if (!pendingAvatar || !previewMetrics) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-[34rem] rounded-[28px] border border-white/10 bg-neutral-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
          Profile picture
        </div>
        <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-white">
          Frame your photo
        </div>
        <div className="mt-2 text-sm leading-6 text-neutral-400">
          Adjust the crop now. BTS saves a centered square version so your photo stays clean in DMs and profile views.
        </div>

        <div className="mt-5 flex justify-center">
          <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-[32px] border border-white/10 bg-black/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <img
              src={pendingAvatar.src}
              alt="Crop preview"
              className="absolute max-w-none select-none"
              style={{
                width: `${previewMetrics.scaledWidth}px`,
                height: `${previewMetrics.scaledHeight}px`,
                left: `calc(50% - ${previewMetrics.scaledWidth / 2}px + ${previewMetrics.offsetX}px)`,
                top: `calc(50% - ${previewMetrics.scaledHeight / 2}px + ${previewMetrics.offsetY}px)`,
              }}
            />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              <span>Zoom</span>
              <span>{crop.zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="2.6"
              step="0.01"
              value={crop.zoom}
              onChange={(event) =>
                onCropChange((previous) => ({
                  ...previous,
                  zoom: Number(event.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              <span>Left / right</span>
              <span>{crop.x}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={crop.x}
              onChange={(event) =>
                onCropChange((previous) => ({
                  ...previous,
                  x: Number(event.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              <span>Up / down</span>
              <span>{crop.y}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={crop.y}
              onChange={(event) =>
                onCropChange((previous) => ({
                  ...previous,
                  y: Number(event.target.value),
                }))
              }
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onApply}
            disabled={isApplying}
            className="rounded-[16px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {isApplying ? "Applying..." : "Use this photo"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Cancel
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

function HeroCard({ profile, authUser, stats, playerMomentum }) {
  const displayName =
    profile?.displayName ||
    authUser?.displayName ||
    profile?.username ||
    authUser?.username ||
    "Player";
  const username = profile?.username || authUser?.username || "username";
  const avatarUrl = profile?.avatarUrl || authUser?.avatarUrl || null;
  const statusMessage = profile?.statusMessage || authUser?.statusMessage || "";
  const email = profile?.email || authUser?.email || "-";
  const phone = profile?.phoneNumber || authUser?.phoneNumber || "Not added";
  const providerLabel =
    getAuthProviderLabel(authUser?.authProvider || "local");
  const supporterBadgeLabel = authUser?.supporterBadgeLabel || profile?.supporterBadgeLabel || "Supporter";
  const isSupporter = authUser?.isSupporter || profile?.isSupporter;

  return (
    <Panel className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05] sm:h-24 sm:w-24">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
              Your profile at a glance
            </div>
            <div className="mt-2 break-words text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[34px]">
              {displayName}
            </div>
            <div className="mt-1 break-all text-sm text-neutral-400">@{username}</div>

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300">
                {providerLabel}
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                  isSupporter
                    ? "border-amber-300/18 bg-amber-400/10 text-amber-100"
                    : "border-white/10 bg-white/[0.04] text-neutral-300"
                }`}
              >
                {isSupporter ? `${supporterBadgeLabel} active` : "Supporter inactive"}
              </div>
              <div className="rounded-full border border-emerald-400/16 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-100">
                {statusMessage ? "DM status set" : "No DM status yet"}
              </div>
            </div>

            <div className="mt-4 rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                What people see in direct messages
              </div>
              <div className="mt-1 text-sm leading-6 text-white">
                {statusMessage || "No status set right now."}
              </div>
            </div>

            {playerMomentum ? (
              <div className="mt-4 rounded-[18px] border border-violet-400/18 bg-violet-500/10 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-violet-100/75">
                  This week
                </div>
                <div className="mt-1 text-sm text-white">{playerMomentum.title}</div>
                <div className="mt-1 text-[12px] leading-5 text-violet-100/80">
                  {playerMomentum.detail}
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-[18px] border border-amber-300/16 bg-amber-400/10 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-amber-100/75">
                Support BTS
              </div>
              <div className="mt-1 text-sm text-white">
                Supporter is priced to stay light at R18/month.
              </div>
              <div className="mt-1 text-[12px] leading-5 text-amber-50/80">
                Unlock supporter cosmetics and keep the app moving without affecting gameplay balance.
              </div>
              <Link
                to="/support"
                className="mt-3 inline-flex rounded-full border border-amber-200/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-50 transition hover:bg-white/15"
              >
                Open support options
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
          <StatCard label="Email" value={email} />
          <StatCard label="Phone" value={phone} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Battle Trivia correct" value={stats.totalCorrectAnswers ?? 0} />
        <StatCard
          label="Word Scramble correct"
          value={stats.wordScrambleCorrectAnswers ?? 0}
        />
        <StatCard label="Weekly wins" value={stats.weeklyWins ?? 0} />
        <StatCard label="Fastest correct" value={formatFastest(stats.fastestCorrectAnswerMs)} />
      </div>
    </Panel>
  );
}

function ChoiceIndicator({ active, isLight = false }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
        active
          ? isLight
            ? "border-sky-400 bg-sky-50 shadow-[0_0_0_3px_rgba(14,116,144,0.08)]"
            : "border-blue-300/50 bg-blue-400/18 shadow-[0_0_0_3px_rgba(96,165,250,0.08)]"
          : isLight
          ? "border-[#d6c2a4] bg-white/70"
          : "border-white/12 bg-white/[0.03]"
      }`}
      aria-hidden="true"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full transition ${
          active ? (isLight ? "bg-sky-600" : "bg-blue-100") : "bg-transparent"
        }`}
      />
    </span>
  );
}

function PreferenceToggle({
  label,
  description,
  active,
  onToggle,
  isLight = false,
  accentClass = "border-blue-300/22 bg-blue-500/10",
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onToggle(!active)}
      className={`w-full rounded-[16px] border px-4 py-3 text-left transition ${
        active
          ? accentClass
          : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="mt-1 text-[12px] leading-5 text-neutral-400">{description}</div>
        </div>
        <ChoiceIndicator active={active} isLight={isLight} />
      </div>
    </button>
  );
}

function ThemeCard({ themePreference, setThemePreference, isLight = false }) {
  const options = [
    {
      value: "system",
      label: "Follow device",
      description: "Switch automatically with your phone or desktop theme.",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Keep the darker look everywhere.",
    },
    {
      value: "light",
      label: "Light",
      description: "Use the lighter app appearance.",
    },
  ];

  return (
    <Panel>
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">Theme</div>
        <div className="mt-1 text-sm text-neutral-400">
          Pick how the app should look for you.
        </div>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Theme preference">
        {options.map((option) => {
          const active = themePreference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setThemePreference(option.value)}
              className={`w-full rounded-[16px] border px-4 py-3 text-left transition ${
                active
                  ? "border-blue-300/22 bg-blue-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{option.label}</div>
                  <div className="mt-1 text-[12px] leading-5 text-neutral-400">
                    {option.description}
                  </div>
                </div>
                <ChoiceIndicator active={active} isLight={isLight} />
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function SoundCard({
  soundEffectsEnabled,
  timerWarningsEnabled,
  setSoundEffectsEnabled,
  setTimerWarningsEnabled,
  isLight = false,
}) {
  return (
    <Panel>
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">Sound</div>
        <div className="mt-1 text-sm text-neutral-400">
          Control local game sounds on this device.
        </div>
      </div>

      <div className="space-y-3">
        <PreferenceToggle
          label="Sound effects"
          description="Play feedback sounds when you answer or solve correctly."
          active={soundEffectsEnabled}
          onToggle={setSoundEffectsEnabled}
          isLight={isLight}
        />

        <PreferenceToggle
          label="Timer warnings"
          description="Play subtle end-of-round cues in the final seconds."
          active={timerWarningsEnabled}
          onToggle={setTimerWarningsEnabled}
          isLight={isLight}
        />
      </div>
    </Panel>
  );
}

function NotificationCard({
  pushStatus,
  isPushConfigured,
  pushError,
  isUpdatingPush,
  onTogglePush,
  isLight = false,
}) {
  const isEnabled = pushStatus === "enabled";
  const isBlocked = pushStatus === "blocked";
  const isUnsupported = pushStatus === "unsupported";
  const isUnavailable = pushStatus === "unavailable";
  const isBusy = isUpdatingPush || isUnsupported || isUnavailable;

  let statusTitle = "Push notifications are ready to turn on";
  let statusDescription =
    "Default BTS behavior is to keep message notifications on when your browser permission allows it.";

  if (isEnabled) {
    statusTitle = "Push notifications are on";
    statusDescription =
      "Direct messages can reach this device while BTS is closed.";
  } else if (isBlocked) {
    statusTitle = "Browser notifications are blocked";
    statusDescription =
      "This device denied the browser permission, so BTS cannot turn notifications on until that is changed in browser settings.";
  } else if (isUnsupported) {
    statusTitle = "Push notifications are not supported here";
    statusDescription =
      "This browser or device does not expose the web-push features BTS needs.";
  } else if (isUnavailable) {
    statusTitle = "Push notifications are not configured on the server";
    statusDescription =
      "The BTS push service is not available yet for this environment.";
  }

  return (
    <Panel>
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">Notifications</div>
        <div className="mt-1 text-sm text-neutral-400">
          Manage browser notifications for direct messages on this device.
        </div>
      </div>

      <div className="space-y-3">
        <PreferenceToggle
          label="Direct message notifications"
          description="When browser permission is granted, BTS keeps DM push notifications on by default for this device."
          active={isEnabled}
          onToggle={onTogglePush}
          isLight={isLight}
          accentClass="border-emerald-300/22 bg-emerald-500/10"
        />

        <div
          className={`rounded-[16px] border px-4 py-3 ${
            isEnabled
              ? "border-emerald-300/18 bg-emerald-500/10"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <div className="text-sm font-medium text-white">{statusTitle}</div>
          <div className="mt-1 text-[12px] leading-5 text-neutral-400">
            {statusDescription}
          </div>
          {!isPushConfigured ? (
            <div className="mt-2 text-[12px] text-amber-200/85">
              BTS push is not configured for this environment yet.
            </div>
          ) : null}
          {pushStatus === "prompt" ? (
            <div className="mt-2 text-[12px] text-blue-100/75">
              The browser still needs your permission before BTS can subscribe this device.
            </div>
          ) : null}
          {pushError ? (
            <div className="mt-2 text-[12px] text-red-300/90">{pushError}</div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onTogglePush(!isEnabled)}
          disabled={isBusy}
          className={`w-full rounded-[16px] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isEnabled
              ? "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {isUpdatingPush
            ? isEnabled
              ? "Turning off..."
              : "Turning on..."
            : isEnabled
              ? "Turn off notifications"
              : "Turn on notifications"}
        </button>
      </div>
    </Panel>
  );
}

function SignInMethodCard({ authProvider }) {
  const providerLabel =
    authProvider === "google"
      ? "Google"
      : authProvider === "facebook"
        ? "Facebook"
        : "BTS";

  return (
    <Panel>
      <div className="text-sm font-semibold text-white">Sign-in method</div>
      <div className="mt-4 rounded-[16px] border border-white/8 bg-black/20 px-4 py-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          Provider
        </div>
        <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white">
          {providerLabel}
        </div>
        <div className="mt-3 text-sm text-neutral-400">
          {authProvider === "google"
            ? "This account signs in with Google, so password changes are not needed here."
            : authProvider === "facebook"
              ? "This account signs in with Facebook, so password changes are not needed here."
              : "This account uses your BTS password for sign-in."}
        </div>
      </div>
    </Panel>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, setUser, user: authUser } = useAuth();
  const { themePreference, setThemePreference, resolvedTheme } = useTheme();
  const {
    soundEffectsEnabled,
    timerWarningsEnabled,
    setSoundEffectsEnabled,
    setTimerWarningsEnabled,
  } = useSoundPreferences();

  const [profile, setProfile] = useState(null);
  const [progression, setProgression] = useState(null);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [totalPages, setTotalPages] = useState(1);

  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [avatarCrop, setAvatarCrop] = useState({ zoom: 1, x: 0, y: 0 });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [growthMessage, setGrowthMessage] = useState("");
  const [friendMessage, setFriendMessage] = useState("");

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProgression, setIsLoadingProgression] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isApplyingAvatarCrop, setIsApplyingAvatarCrop] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  const [playerMomentum, setPlayerMomentum] = useState(null);
  const [currentCombinedStanding, setCurrentCombinedStanding] = useState(null);
  const [missions, setMissions] = useState(null);
  const [friendNetwork, setFriendNetwork] = useState(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [pushStatus, setPushStatus] = useState("checking");
  const [isPushConfigured, setIsPushConfigured] = useState(false);
  const [pushError, setPushError] = useState("");
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoadingProfile(true);

      try {
        const data = await getMyProfile();
        if (!isMounted) return;

        setProfile(data);
        setDisplayName(data?.displayName || "");
        setPhoneNumber(data?.phoneNumber || "");
        setAvatarUrl(data?.avatarUrl || "");
        setStatusMessage(data?.statusMessage || "");
      } catch {
        if (isMounted) setError("Failed to load profile.");
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncPushState() {
      if (!isPushSupported()) {
        if (isMounted) {
          setPushStatus("unsupported");
          setIsPushConfigured(false);
        }
        return;
      }

      try {
        const config = await getPushConfig();
        if (!isMounted) return;

        setIsPushConfigured(Boolean(config?.isConfigured));

        if (!config?.isConfigured) {
          setPushStatus("unavailable");
          return;
        }

        if (Notification.permission === "granted") {
          await syncPushSubscriptionIfEnabled();
          if (!isMounted) return;
          setPushStatus("enabled");
          return;
        }

        if (Notification.permission === "denied") {
          setPushStatus("blocked");
          return;
        }

        setPushStatus("prompt");
      } catch {
        if (!isMounted) return;
        setPushStatus("error");
      }
    }

    syncPushState().catch(() => null);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProgression() {
      setIsLoadingProgression(true);

      try {
        const data = await getMyProgression();
        if (isMounted) setProgression(data);
      } catch {
        if (isMounted) setError("Failed to load progression.");
      } finally {
        if (isMounted) setIsLoadingProgression(false);
      }
    }

    loadProgression();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoadingHistory(true);

      try {
        const data = await getMyProfileHistory(page, pageSize);
        if (!isMounted) return;

        setHistory(Array.isArray(data?.items) ? data.items : []);
        setTotalPages(data?.totalPages || 1);
      } catch {
        if (isMounted) setError("Failed to load profile history.");
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [page]);

  useEffect(() => {
    let isMounted = true;

    async function loadMomentum() {
      if (!authUser?.id) return;

      try {
        const [currentBoard, previousBoard] = await Promise.all([
          getLeaderboard("combined", "current", 200),
          getLeaderboard("combined", "previous", 200),
        ]);

        if (!isMounted) return;

        const currentRow =
          currentBoard?.rows?.find((row) => row.userId === authUser.id) || null;
        const previousRow =
          previousBoard?.rows?.find((row) => row.userId === authUser.id) || null;
        const leaderScore = currentBoard?.rows?.[0]?.score ?? 0;
        setCurrentCombinedStanding(currentRow);

        if (previousRow) {
          const delta = currentRow ? previousRow.rank - currentRow.rank : 0;

          setPlayerMomentum({
            title: currentRow
              ? delta > 0
                ? `You climbed ${delta} spot${delta === 1 ? "" : "s"} since last week.`
                : delta < 0
                ? `You slipped ${Math.abs(delta)} spot${Math.abs(delta) === 1 ? "" : "s"} from last week.`
                : "You held the same place as last week."
              : "Your weekly recap is ready to post.",
            detail: currentRow
              ? currentRow.rank === 1
                ? "You are leading the current combined board right now."
                : `${Math.max(0, leaderScore - currentRow.score)} point${Math.max(0, leaderScore - currentRow.score) === 1 ? "" : "s"} separate you from the current leader.`
              : `Last week you finished #${previousRow.rank} with ${previousRow.score} points.`,
          });
          return;
        }

        if (currentRow) {
          setPlayerMomentum({
            title: `You are currently #${currentRow.rank} on the combined board.`,
            detail:
              currentRow.rank === 1
                ? "Protect the lead and post the recap when the week closes."
                : `${Math.max(0, leaderScore - currentRow.score)} point${Math.max(0, leaderScore - currentRow.score) === 1 ? "" : "s"} behind the leader right now.`,
          });
        } else {
          setPlayerMomentum(null);
        }
      } catch {
        if (isMounted) {
          setCurrentCombinedStanding(null);
          setPlayerMomentum(null);
        }
      }
    }

    loadMomentum();

    return () => {
      isMounted = false;
    };
  }, [authUser?.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadMissions() {
      setIsLoadingMissions(true);

      try {
        const data = await getMyMissions();
        if (isMounted) setMissions(data);
      } catch {
        if (isMounted) setMissions(null);
      } finally {
        if (isMounted) setIsLoadingMissions(false);
      }
    }

    loadMissions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFriends() {
      setIsLoadingFriends(true);

      try {
        const data = await getMyFriendNetwork();
        if (isMounted) setFriendNetwork(data);
      } catch {
        if (isMounted) setFriendNetwork(null);
      } finally {
        if (isMounted) setIsLoadingFriends(false);
      }
    }

    loadFriends();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => profile?.stats || {}, [profile]);
  const growth = useMemo(() => profile?.growth || {}, [profile]);
  const loginProvider = localStorage.getItem("bts_login_provider");
  const authProvider = authUser?.authProvider || loginProvider || "local";
  const isLocalAccount = authProvider === "local";
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  async function handleTogglePush(nextActive) {
    setPushError("");
    setIsUpdatingPush(true);

    try {
      if (nextActive) {
        const result = await enablePushNotifications();
        if (result.enabled) {
          setPushStatus("enabled");
        } else {
          setPushStatus(result.reason === "denied" ? "blocked" : "prompt");
        }
      } else {
        await disablePushNotifications();
        setPushStatus("prompt");
      }
    } catch (err) {
      setPushError(err?.response?.data?.message || "Could not update notifications.");
      setPushStatus("error");
    } finally {
      setIsUpdatingPush(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsSavingProfile(true);

      const updated = await updateMyProfile({
        displayName,
        phoneNumber,
        avatarUrl,
        statusMessage,
      });

      setProfile(updated);
      setAvatarUrl(updated?.avatarUrl || "");
      setStatusMessage(updated?.statusMessage || "");
      setUser((previous) =>
        previous
          ? {
              ...previous,
              displayName: updated?.displayName || previous.displayName,
              phoneNumber: updated?.phoneNumber ?? previous.phoneNumber,
              avatarUrl: updated?.avatarUrl ?? null,
              statusMessage: updated?.statusMessage ?? "",
            }
          : previous
      );
      setMessage("Profile updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsSavingPassword(true);
      await changeMyPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for your profile picture.");
      return;
    }

    if (file.size > 750 * 1024) {
      setError("Profile picture must be 750 KB or smaller.");
      return;
    }

    try {
      const nextAvatarUrl = await readImageDataUrl(file);
      const dimensions = await loadImageDimensions(nextAvatarUrl);

      setError("");
      setPendingAvatar({
        src: nextAvatarUrl,
        naturalWidth: dimensions.naturalWidth,
        naturalHeight: dimensions.naturalHeight,
      });
      setAvatarCrop({ zoom: 1, x: 0, y: 0 });
    } catch {
      setError("Could not load that profile picture.");
    }
  }

  async function handleApplyAvatarCrop() {
    if (!pendingAvatar) return;

    try {
      setIsApplyingAvatarCrop(true);
      const nextAvatarUrl = await buildCroppedAvatar(pendingAvatar.src, avatarCrop);
      setAvatarUrl(nextAvatarUrl);
      setPendingAvatar(null);
      setError("");
      setMessage("Photo updated. Save profile when you're ready.");
    } catch {
      setError("Could not crop that profile picture.");
    } finally {
      setIsApplyingAvatarCrop(false);
    }
  }

  function handleCancelAvatarCrop() {
    setPendingAvatar(null);
    setAvatarCrop({ zoom: 1, x: 0, y: 0 });
  }

  async function handleRemoveAvatar() {
    if (!avatarUrl) return;

    setError("");
    setMessage("");
    setPendingAvatar(null);
    setAvatarCrop({ zoom: 1, x: 0, y: 0 });

    const previousAvatarUrl = avatarUrl;

    try {
      setIsRemovingAvatar(true);
      setAvatarUrl("");

      const updated = await updateMyProfile({
        displayName,
        phoneNumber,
        avatarUrl: "",
        statusMessage,
      });

      setProfile(updated);
      setAvatarUrl(updated?.avatarUrl || "");
      setStatusMessage(updated?.statusMessage || "");
      setUser((previous) =>
        previous
          ? {
              ...previous,
              displayName: updated?.displayName || previous.displayName,
              phoneNumber: updated?.phoneNumber ?? previous.phoneNumber,
              avatarUrl: updated?.avatarUrl ?? null,
              statusMessage: updated?.statusMessage ?? "",
            }
          : previous
      );
      setMessage("Profile photo removed.");
    } catch (err) {
      setAvatarUrl(previousAvatarUrl);
      setError(err?.response?.data?.message || "Failed to remove profile photo.");
    } finally {
      setIsRemovingAvatar(false);
    }
  }

  const handleCopyInvite = async () => {
    if (!authUser?.id) return;

    try {
      await navigator.clipboard.writeText(buildShareUrl("combined", "current", authUser.id));
      setGrowthMessage("Invite link copied.");
    } catch {
      setGrowthMessage("Could not copy invite link.");
    }
  };

  const handleShareInvite = async () => {
    if (!authUser?.id) return;

    const url = buildShareUrl("combined", "current", authUser.id);
    const playerName =
      profile?.displayName || authUser.displayName || profile?.username || authUser.username || "I";
    const text = `${playerName} just shared their BTS page. Create your account, join the weekly leaderboard race, and earn your own recap card.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `${playerName} on BTS`, text, url });
        setGrowthMessage("Share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setGrowthMessage("Invite page copied.");
    } catch {
      setGrowthMessage("Could not share invite page right now.");
    }
  };

  const handleDownloadGrowthCard = async () => {
    if (!authUser?.id) return;

    try {
      await downloadShareCardPng({
        mode: "combined",
        period: "current",
        userId: authUser.id,
        filenameBase: `${profile?.displayName || profile?.username || "player"}-bts-growth-card`,
      });
      setGrowthMessage("Rank card downloaded.");
    } catch {
      setGrowthMessage("Could not download rank card.");
    }
  };

  const handleShareWeeklyRecap = async () => {
    if (!authUser?.id) return;

    const url = buildPlayerRecapUrl(authUser.id, "combined", "previous");
    const playerName =
      profile?.displayName || authUser.displayName || profile?.username || authUser.username || "I";
    const text = `${playerName} just posted their BTS weekly recap. See how they finished and create your own account to get on next week's board.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "My BTS weekly recap", text, url });
        setGrowthMessage("Weekly recap share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setGrowthMessage("Weekly recap copied.");
    } catch {
      setGrowthMessage("Could not share weekly recap right now.");
    }
  };

  const handleDownloadWeeklyRecap = async () => {
    if (!authUser?.id) return;

    try {
      await downloadImageUrlPng(
        buildPlayerRecapImageUrl(authUser.id, "combined", "previous"),
        `${profile?.displayName || profile?.username || "player"}-weekly-recap`
      );
      setGrowthMessage("Weekly recap downloaded.");
    } catch {
      setGrowthMessage("Could not download weekly recap.");
    }
  };

  const handleDownloadStreakCard = async () => {
    const playerName =
      profile?.displayName ||
      authUser?.displayName ||
      profile?.username ||
      authUser?.username ||
      "Player";

    try {
      await downloadGeneratedCardPng(
        buildStreakCardSvg({
          playerName,
          bestStreak: stats.bestStreak ?? 0,
          weeklyWins: stats.weeklyWins ?? 0,
          totalCorrectAnswers: stats.totalCorrectAnswers ?? 0,
        }),
        `${playerName}-streak-card`
      );
      setGrowthMessage("Streak card downloaded.");
    } catch {
      setGrowthMessage("Could not download streak card.");
    }
  };

  const handleDownloadTopTenCard = async () => {
    if (!currentCombinedStanding || currentCombinedStanding.rank > 10) {
      setGrowthMessage("Top 10 card unlocks once you are inside the top 10.");
      return;
    }

    const playerName =
      profile?.displayName ||
      authUser?.displayName ||
      profile?.username ||
      authUser?.username ||
      "Player";

    try {
      await downloadGeneratedCardPng(
        buildTopTenCardSvg({
          playerName,
          rank: currentCombinedStanding.rank,
          score: currentCombinedStanding.score,
          label: "Combined",
          period: "current",
        }),
        `${playerName}-top-10-card`
      );
      setGrowthMessage("Top 10 card downloaded.");
    } catch {
      setGrowthMessage("Could not download top 10 card.");
    }
  };

  const refreshFriendNetwork = async () => {
    const data = await getMyFriendNetwork();
    setFriendNetwork(data);
  };

  const handleFriendSearch = async (event) => {
    event.preventDefault();
    setFriendMessage("");

    if (!friendSearchQuery.trim()) {
      setFriendSearchResults([]);
      return;
    }

    try {
      const results = await searchPlayers(friendSearchQuery.trim());
      setFriendSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setFriendMessage("Could not search players right now.");
    }
  };

  const handleSendFriendRequest = async (player) => {
    try {
      await sendFriendRequest(player.userId);
      setFriendMessage(`Friend request sent to ${player.displayName || player.username}.`);
      const results = await searchPlayers(friendSearchQuery.trim());
      setFriendSearchResults(Array.isArray(results) ? results : []);
      await refreshFriendNetwork();
    } catch (err) {
      setFriendMessage(err?.response?.data?.message || "Could not send friend request.");
    }
  };

  const handleAcceptFriendRequest = async (player) => {
    if (!player?.friendshipId) return;

    try {
      await acceptFriendRequest(player.friendshipId);
      setFriendMessage(`${player.displayName || player.username} is now on your friends board.`);
      await refreshFriendNetwork();
    } catch (err) {
      setFriendMessage(err?.response?.data?.message || "Could not accept friend request.");
    }
  };

  const handleDeclineFriendRequest = async (player) => {
    if (!player?.friendshipId) return;

    try {
      await declineFriendRequest(player.friendshipId);
      setFriendMessage("Friend request cleared.");
      await refreshFriendNetwork();
    } catch (err) {
      setFriendMessage(err?.response?.data?.message || "Could not clear friend request.");
    }
  };

  return (
    <div
      className={`profile-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "profile-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Profile"
          title="Your account"
          description="See who you are in BTS, update what shows in DMs, and check how your week is going."
          actions={[
            {
              label: "Logout",
              onClick: handleLogout,
            },
            {
              label: "View standings",
              to: "/leaderboards?mode=battle-trivia&period=current",
            },
            {
              label: "Support BTS",
              to: "/support",
            },
            {
              label: "Open activity",
              to: "/activity",
            },
          ]}
        />

        {error ? (
          <div className="mb-4 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-[20px] border border-emerald-900/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-300/90">
            {message}
          </div>
        ) : null}

        <MobileProfileHero
          profile={profile}
          authUser={authUser}
          avatarUrl={avatarUrl || null}
          statusMessage={statusMessage}
          progression={progression}
          stats={stats}
          playerMomentum={playerMomentum}
          currentStanding={currentCombinedStanding}
          onAvatarFileChange={handleAvatarFileChange}
          onRemoveAvatar={handleRemoveAvatar}
          isRemovingAvatar={isRemovingAvatar}
        />

        <div className="mb-6 hidden sm:block">
          <HeroCard
            profile={profile}
            authUser={authUser}
            stats={stats}
            playerMomentum={playerMomentum}
          />
        </div>

        <MobileSectionShell
          eyebrow="Profile"
          title="Account details"
          description="Edit the basics people see first."
        >
          <Panel>
            {isLoadingProfile ? (
              <div className="text-sm text-neutral-500">Loading profile...</div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <MobileProfileField icon="✎" label="Name">
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full border-0 bg-transparent p-0 text-[18px] font-medium text-white outline-none placeholder:text-neutral-500"
                    placeholder="Your display name"
                  />
                </MobileProfileField>

                <MobileProfileField
                  icon="i"
                  label="About"
                  helper="This is your DM status."
                >
                  <textarea
                    value={statusMessage}
                    onChange={(event) => setStatusMessage(event.target.value.slice(0, 120))}
                    rows={2}
                    placeholder="Available for late-night trivia smoke."
                    className="w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-6 text-white outline-none placeholder:text-neutral-500"
                  />
                </MobileProfileField>

                <MobileProfileField icon="☎" label="Phone">
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    className="w-full border-0 bg-transparent p-0 text-[16px] text-white outline-none placeholder:text-neutral-500"
                    placeholder="Add your phone number"
                  />
                </MobileProfileField>

                <MobileProfileField icon="@" label="Username">
                  <div className="text-[15px] text-neutral-300">
                    @{profile?.username || authUser?.username || ""}
                  </div>
                </MobileProfileField>

                <MobileProfileField icon="✉" label="Email">
                  <div className="break-all text-[15px] text-neutral-300">
                    {profile?.email || authUser?.email || ""}
                  </div>
                </MobileProfileField>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="mt-1 w-full rounded-[16px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </button>
              </form>
            )}
          </Panel>
        </MobileSectionShell>

        <MobileSectionShell
          eyebrow="Theme"
          title="Theme"
          description="Dark is the default, but you can switch it here."
          accent="violet"
        >
          <ThemeCard
            themePreference={themePreference}
            setThemePreference={setThemePreference}
            isLight={isLight}
          />
        </MobileSectionShell>

        <MobileSectionShell
          eyebrow="Sound"
          title="Sound controls"
          description="Control answer feedback and timer warnings for this phone."
          accent="amber"
        >
          <SoundCard
            soundEffectsEnabled={soundEffectsEnabled}
            timerWarningsEnabled={timerWarningsEnabled}
            setSoundEffectsEnabled={setSoundEffectsEnabled}
            setTimerWarningsEnabled={setTimerWarningsEnabled}
            isLight={isLight}
          />
        </MobileSectionShell>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="hidden">
              <SectionTitle
                eyebrow="Status"
                title="Set your DM status"
                description="This is the short line people see in direct messages."
              />

              <Panel>
                {isLoadingProfile ? (
                  <div className="text-sm text-neutral-500">Loading profile...</div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                        DM status
                      </label>
                      <textarea
                        value={statusMessage}
                        onChange={(event) => setStatusMessage(event.target.value.slice(0, 120))}
                        rows={3}
                        placeholder="Available for late-night trivia smoke."
                        className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                      />
                      <div className="mt-1 text-[11px] text-neutral-500">
                        Keep it short, clear, and easy to spot.
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full rounded-[16px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                    >
                      {isSavingProfile ? "Saving..." : "Save status"}
                    </button>
                  </form>
                )}
              </Panel>
            </section>

            <section className="hidden sm:block">
              <SectionTitle
                eyebrow="Edit"
                title="Account details"
                description="Change the core details attached to your account."
              />

              <Panel>
                {isLoadingProfile ? (
                  <div className="text-sm text-neutral-500">Loading profile...</div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                          Username
                        </label>
                        <input
                          value={profile?.username || authUser?.username || ""}
                          disabled
                          className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                          Email
                        </label>
                        <input
                          value={profile?.email || authUser?.email || ""}
                          disabled
                          className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                          Display name
                        </label>
                        <input
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                          Phone number
                        </label>
                        <input
                          value={phoneNumber}
                          onChange={(event) => setPhoneNumber(event.target.value)}
                          className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                        />
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                        DM status
                      </label>
                      <textarea
                        value={statusMessage}
                        onChange={(event) => setStatusMessage(event.target.value.slice(0, 120))}
                        rows={3}
                        placeholder="Available for late-night trivia smoke."
                        className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                      />
                      <div className="mt-1 text-[11px] text-neutral-500">
                        This only shows in direct messages and the DM profile page.
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                        Profile picture
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName || profile?.username || authUser?.username || "Profile"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                              {getInitials(displayName || profile?.username || authUser?.username || "P")}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <label
                            className="inline-flex cursor-pointer items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                            aria-label="Upload and frame profile photo"
                            title="Upload and frame profile photo"
                          >
                            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                              <path
                                d="M10 13.5V6.5M6.75 9.75L10 6.5L13.25 9.75M5.5 14.75H14.5"
                                className="stroke-current"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>Upload and frame photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarFileChange}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={!avatarUrl || isRemovingAvatar}
                            className="inline-flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                            aria-label="Remove profile photo"
                            title="Remove profile photo"
                          >
                            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                              <path
                                d="M7.75 5.75H12.25M5.75 7.25L6.4 14.08C6.5 15.1 7.36 15.88 8.39 15.88H11.61C12.64 15.88 13.5 15.1 13.6 14.08L14.25 7.25M8.5 8.75V12.5M11.5 8.75V12.5M7.25 5.75L7.7 4.87C7.95 4.37 8.46 4.05 9.02 4.05H10.98C11.54 4.05 12.05 4.37 12.3 4.87L12.75 5.75"
                                className="stroke-current"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>{isRemovingAvatar ? "Removing..." : "Remove photo"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-neutral-500">
                        Photos open in a quick square cropper first so the DM avatar stays clean.
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full rounded-[16px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60 sm:w-auto"
                      >
                        {isSavingProfile ? "Saving..." : "Save profile"}
                      </button>
                    </div>
                  </form>
                )}
              </Panel>
            </section>

            <section className="hidden sm:block">
              <SectionTitle
                eyebrow="Notifications"
                title="Browser notifications"
                description="Keep direct-message notifications on for this device when the browser allows them."
              />

              <NotificationCard
                pushStatus={pushStatus}
                isPushConfigured={isPushConfigured}
                pushError={pushError}
                isUpdatingPush={isUpdatingPush}
                onTogglePush={handleTogglePush}
                isLight={isLight}
              />
            </section>

            <section className="hidden sm:block">
              <SectionTitle
                eyebrow="Theme"
                title="Theme"
                description="Dark is the default for everyone, but you can still switch it here."
              />

              <ThemeCard
                themePreference={themePreference}
                setThemePreference={setThemePreference}
                isLight={isLight}
              />
            </section>

            <section className="hidden sm:block">
              <SectionTitle
                eyebrow="Sound"
                title="Sound controls"
                description="Control answer feedback and timer warning sounds on this device."
              />

              <SoundCard
                soundEffectsEnabled={soundEffectsEnabled}
                timerWarningsEnabled={timerWarningsEnabled}
                setSoundEffectsEnabled={setSoundEffectsEnabled}
                setTimerWarningsEnabled={setTimerWarningsEnabled}
                isLight={isLight}
              />
            </section>

            <section className="hidden sm:block">
              <SectionTitle
                eyebrow="Access"
                title="Sign-in and security"
                description="Manage how you sign in and update your password when needed."
              />

              <div className="space-y-4">
                {isLocalAccount ? (
                  <Panel>
                    <div className="mb-4 text-sm font-semibold text-white">Change password</div>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Current password"
                        className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="New password"
                        className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm new password"
                        className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                      />
                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="rounded-[16px] bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60"
                      >
                        {isSavingPassword ? "Updating..." : "Update password"}
                      </button>
                    </form>
                  </Panel>
                ) : (
                  <SignInMethodCard authProvider={authProvider} />
                )}

              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <div className="hidden sm:block" />

              <MobileSectionShell
                eyebrow="Notifications"
                title="Browser notifications"
                description="Keep direct-message notifications on for this device when the browser allows them."
                accent="blue"
              >
                <NotificationCard
                  pushStatus={pushStatus}
                  isPushConfigured={isPushConfigured}
                  pushError={pushError}
                  isUpdatingPush={isUpdatingPush}
                  onTogglePush={handleTogglePush}
                  isLight={isLight}
                />
              </MobileSectionShell>
            </section>

            <section>
              <SectionTitle
                eyebrow="Achievements"
                title="Achievements"
                description="Unlocked moments first, with your longer-term progress just underneath."
              />

              <div className="grid gap-4">
                <ProfileAchievementsCard progression={progression} loading={isLoadingProgression} />
                <ProfileProgressCard progression={progression} loading={isLoadingProgression} />
              </div>
            </section>

            <section>
              <div className="hidden sm:block">
                <SectionTitle
                  eyebrow="History"
                  title="Recent Battle Trivia results"
                  description="Your latest finishes without needing to open the full activity page."
                />
              </div>

              <MobileSectionShell
                eyebrow="History"
                title="Recent results"
                description="Your latest Battle Trivia finishes in a cleaner mobile stack."
                accent="blue"
              >
                <Panel>
                  {isLoadingHistory ? (
                    <div className="text-sm text-neutral-500">Loading history...</div>
                  ) : history.length === 0 ? (
                    <div className="text-sm text-neutral-500">No history yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {history.map((item) => (
                        <HistoryItem key={item.id} item={item} />
                      ))}

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                        >
                          Previous
                        </button>

                        <div className="text-center text-sm text-neutral-400">
                          Page {page} of {totalPages}
                        </div>

                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                          className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </Panel>
              </MobileSectionShell>

              <div className="hidden sm:block">
                <Panel>
                  {isLoadingHistory ? (
                    <div className="text-sm text-neutral-500">Loading history...</div>
                  ) : history.length === 0 ? (
                    <div className="text-sm text-neutral-500">No history yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {history.map((item) => (
                        <HistoryItem key={item.id} item={item} />
                      ))}

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                        >
                          Previous
                        </button>

                        <div className="text-sm text-neutral-400">
                          Page {page} of {totalPages}
                        </div>

                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                          className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </Panel>
              </div>
            </section>
          </div>
        </div>

        <section className="mt-6">
          <div className="hidden sm:block">
            <SectionTitle
              eyebrow="Missions"
              title="Daily and weekly goals"
              description="Short goals that tell you what to do next."
            />
          </div>
          <MobileSectionShell
            eyebrow="Missions"
            title="Daily and weekly goals"
            description="Short goals that tell you what to do next."
            accent="amber"
          >
            <ProfileMissionsCard missions={missions} loading={isLoadingMissions} />
          </MobileSectionShell>
          <div className="hidden sm:block">
            <ProfileMissionsCard missions={missions} loading={isLoadingMissions} />
          </div>
        </section>

        <section className="mt-6">
          <div className="hidden sm:block">
            <SectionTitle
              eyebrow="Friends"
              title="People you compete with"
              description="Search, add, and manage the people you want on your board."
            />
          </div>
          <MobileSectionShell
            eyebrow="Friends"
            title="Friends and rivals"
            description="Search, add, and manage the people you want on your board."
            accent="violet"
          >
            <ProfileFriendsCard
              searchQuery={friendSearchQuery}
              onSearchQueryChange={setFriendSearchQuery}
              onSearch={handleFriendSearch}
              searchResults={friendSearchResults}
              network={friendNetwork}
              loading={isLoadingFriends}
              onSendRequest={handleSendFriendRequest}
              onAcceptRequest={handleAcceptFriendRequest}
              onDeclineRequest={handleDeclineFriendRequest}
            />
            {friendMessage ? <div className="mt-3 text-sm text-neutral-400">{friendMessage}</div> : null}
          </MobileSectionShell>
          <div className="hidden sm:block">
            <ProfileFriendsCard
              searchQuery={friendSearchQuery}
              onSearchQueryChange={setFriendSearchQuery}
              onSearch={handleFriendSearch}
              searchResults={friendSearchResults}
              network={friendNetwork}
              loading={isLoadingFriends}
              onSendRequest={handleSendFriendRequest}
              onAcceptRequest={handleAcceptFriendRequest}
              onDeclineRequest={handleDeclineFriendRequest}
            />
            {friendMessage ? <div className="mt-3 text-sm text-neutral-400">{friendMessage}</div> : null}
          </div>
        </section>

        <section className="mt-6">
          <SectionTitle
            eyebrow="Share"
            title="Invite and flex"
            description="Share your page, your cards, and your weekly recap from one simpler block."
          />

          <Panel>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Share views" value={growth?.shareViews ?? 0} />
              <StatCard label="Join clicks" value={growth?.joinClicks ?? 0} />
              <StatCard label="Sign-ups" value={growth?.referredSignups ?? 0} />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleCopyInvite}
                className="rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
              >
                Copy invite link
              </button>
              <button
                type="button"
                onClick={handleShareInvite}
                className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
              >
                Share invite page
              </button>
              <button
                type="button"
                onClick={handleDownloadGrowthCard}
                className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Download rank card
              </button>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleShareWeeklyRecap}
                className="rounded-[16px] border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/15"
              >
                Share weekly recap
              </button>
              <button
                type="button"
                onClick={handleDownloadWeeklyRecap}
                className="rounded-[16px] border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/15"
              >
                Download weekly recap
              </button>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleDownloadStreakCard}
                className="rounded-[16px] border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-100 transition hover:bg-orange-500/15"
              >
                Download streak card
              </button>
              <button
                type="button"
                onClick={handleDownloadTopTenCard}
                disabled={!currentCombinedStanding || currentCombinedStanding.rank > 10}
                className="rounded-[16px] border border-cyan-300/18 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {currentCombinedStanding && currentCombinedStanding.rank <= 10
                  ? "Download top 10 card"
                  : "Top 10 card locked"}
              </button>
            </div>

            {growthMessage ? <div className="mt-3 text-sm text-neutral-400">{growthMessage}</div> : null}
          </Panel>
        </section>
      </div>

      <AvatarCropModal
        pendingAvatar={pendingAvatar}
        crop={avatarCrop}
        onCropChange={setAvatarCrop}
        onCancel={handleCancelAvatarCrop}
        onApply={handleApplyAvatarCrop}
        isApplying={isApplyingAvatarCrop}
      />
    </div>
  );
}
