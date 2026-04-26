import { NavLink, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAlerts } from "../../context/AlertsContext";
import { useMentions } from "../../context/MentionContext";
import { useTheme } from "../../hooks/useTheme";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H10.5C11.33 4 12 4.67 12 5.5V10.5C12 11.33 11.33 12 10.5 12H5.5C4.67 12 4 11.33 4 10.5V5.5ZM12 13.5C12 12.67 12.67 12 13.5 12H18.5C19.33 12 20 12.67 20 13.5V18.5C20 19.33 19.33 20 18.5 20H13.5C12.67 20 12 19.33 12 18.5V13.5ZM4 13.5C4 12.67 4.67 12 5.5 12H10.5C11.33 12 12 12.67 12 13.5V18.5C12 19.33 11.33 20 10.5 20H5.5C4.67 20 4 19.33 4 18.5V13.5ZM12 5.5C12 4.67 12.67 4 13.5 4H18.5C19.33 4 20 4.67 20 5.5V10.5C20 11.33 19.33 12 18.5 12H13.5C12.67 12 12 11.33 12 10.5V5.5Z"
        className="stroke-current"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RoomsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 7.5C4 6.67 4.67 6 5.5 6H18.5C19.33 6 20 6.67 20 7.5V16.5C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5V7.5Z"
        className="stroke-current"
        strokeWidth="1.5"
      />
      <path
        d="M8 10H16M8 14H13"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M8.5 11C10.16 11 11.5 9.66 11.5 8C11.5 6.34 10.16 5 8.5 5C6.84 5 5.5 6.34 5.5 8C5.5 9.66 6.84 11 8.5 11ZM15.5 12.5C16.88 12.5 18 11.38 18 10C18 8.62 16.88 7.5 15.5 7.5C14.12 7.5 13 8.62 13 10C13 11.38 14.12 12.5 15.5 12.5Z"
        className="stroke-current"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 18C4.5 15.79 6.74 14 9.5 14C12.26 14 14.5 15.79 14.5 18M13.5 18C13.5 16.56 15.07 15.36 17 15.07"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SquadsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M8 11C9.66 11 11 9.66 11 8C11 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM16 12.5C17.38 12.5 18.5 11.38 18.5 10C18.5 8.62 17.38 7.5 16 7.5C14.62 7.5 13.5 8.62 13.5 10C13.5 11.38 14.62 12.5 16 12.5Z"
        className="stroke-current"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 18C4.5 15.79 6.52 14 9 14C11.48 14 13.5 15.79 13.5 18M13.5 17C13.79 15.87 14.87 15 16.25 15C17.91 15 19.25 16.25 19.5 18"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StandingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6 18V11M12 18V7M18 18V13"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 20H20"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 12H8L10.2 7.5L13.8 16.5L16 12H19"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4H20V20H4V4Z"
        className="stroke-current"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function AlertsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 5C9.79 5 8 6.79 8 9V11.3C8 12.03 7.79 12.75 7.4 13.36L6.2 15.2C5.75 15.89 6.24 16.8 7.06 16.8H16.94C17.76 16.8 18.25 15.89 17.8 15.2L16.6 13.36C16.21 12.75 16 12.03 16 11.3V9C16 6.79 14.21 5 12 5Z"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 18.2C10.53 19.02 11.2 19.5 12 19.5C12.8 19.5 13.47 19.02 13.8 18.2"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 6.5C5 5.67 5.67 5 6.5 5H17.5C18.33 5 19 5.67 19 6.5V13.5C19 14.33 18.33 15 17.5 15H11.6L8.25 18.1C7.28 19 5.75 18.31 5.75 16.99V15H6.5C5.67 15 5 14.33 5 13.5V6.5Z"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 9.5H16M8 12H13.5"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 12C13.93 12 15.5 10.43 15.5 8.5C15.5 6.57 13.93 5 12 5C10.07 5 8.5 6.57 8.5 8.5C8.5 10.43 10.07 12 12 12Z"
        className="stroke-current"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 19C5.5 16.24 8.41 14 12 14C15.59 14 18.5 16.24 18.5 19"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const DESKTOP_ITEMS = [
  { to: "/", label: "Dashboard", exact: true, icon: DashboardIcon },
  { to: "/rooms", label: "Rooms", icon: RoomsIcon },
  { to: "/messages", label: "Messages", icon: MessagesIcon },
  { to: "/alerts", label: "Alerts", icon: AlertsIcon },
  { to: "/squads", label: "Squads", icon: SquadsIcon },
  {
    to: "/community",
    label: "Community",
    icon: CommunityIcon,
    showMentionBadge: true,
  },
  {
    to: "/leaderboards?mode=combined&period=current",
    pathMatch: "/leaderboards",
    label: "Standings",
    icon: StandingsIcon,
  },
  { to: "/activity", label: "Activity", icon: ActivityIcon },
  { to: "/profile", label: "Profile", icon: ProfileIcon },
];

const MOBILE_ITEMS = [
  { to: "/", label: "Dashboard", exact: true, icon: DashboardIcon },
  { to: "/rooms", label: "Rooms", icon: RoomsIcon },
  { to: "/messages", label: "Messages", icon: MessagesIcon },
  { to: "/alerts", label: "Alerts", icon: AlertsIcon },
  { to: "/squads", label: "Squads", icon: SquadsIcon },
  {
    to: "/community",
    label: "Community",
    icon: CommunityIcon,
    showMentionBadge: true,
  },
  {
    to: "/leaderboards?mode=combined&period=current",
    pathMatch: "/leaderboards",
    label: "Standings",
    icon: StandingsIcon,
  },
  { to: "/profile", label: "Profile", icon: ProfileIcon },
];

function isItemActive(item, pathname) {
  if (item.exact) return pathname === item.to;
  if (item.pathMatch) return pathname === item.pathMatch;
  return pathname.startsWith(item.to);
}

function MentionBadge({ count, mobile = false, isLight = false }) {
  if (!count || count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-medium ${
        isLight
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-amber-300/18 bg-amber-300/12 text-amber-100"
      } ${
        mobile
          ? "min-w-[1.1rem] px-1 py-0.5 text-[9px]"
          : "min-w-[1.2rem] px-1.5 py-0.5 text-[10px]"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavCountBadge({ count, mobile = false, isLight = false, tone = "amber" }) {
  if (!count || count <= 0) return null;

  const toneClassName =
    tone === "blue"
      ? isLight
        ? "border-sky-300 bg-sky-50 text-sky-800"
        : "border-blue-300/18 bg-blue-300/12 text-blue-100"
      : isLight
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-amber-300/18 bg-amber-300/12 text-amber-100";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-medium ${toneClassName} ${
        mobile
          ? "min-w-[1.1rem] px-1 py-0.5 text-[9px]"
          : "min-w-[1.2rem] px-1.5 py-0.5 text-[10px]"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavIconShell({ children, active = false, isLight = false, mobile = false }) {
  const baseClassName = mobile
    ? "flex h-10 w-10 items-center justify-center rounded-[14px] border transition"
    : "flex h-9 w-9 items-center justify-center rounded-[12px] border transition";

  const toneClassName = active
    ? isLight
      ? "border-sky-300 bg-sky-50 text-sky-800 shadow-[0_8px_18px_rgba(59,130,246,0.12)]"
      : "border-blue-400/25 bg-blue-500/14 text-blue-100 shadow-[0_10px_24px_rgba(37,99,235,0.14)]"
    : isLight
    ? "border-stone-200 bg-white/78 text-stone-700"
    : "border-white/10 bg-white/[0.04] text-neutral-300";

  return <span className={`${baseClassName} ${toneClassName}`}>{children}</span>;
}

export default function AppSectionNav() {
  const location = useLocation();
  const { totalUnreadMentions } = useMentions();
  const { unreadCount } = useAlerts();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const desktopShellClassName = isLight
    ? "rounded-[24px] border border-[#ddc8a8] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,234,216,0.96))] p-2.5 shadow-[0_18px_34px_rgba(114,84,41,0.12)]"
    : "rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-2.5 shadow-[0_18px_36px_rgba(0,0,0,0.16)]";
  const mobileShellClassName = isLight
    ? "pointer-events-auto border-t border-[#d9c7aa] bg-[#f6ebd9] px-2 pt-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(114,84,41,0.16)]"
    : "pointer-events-auto border-t border-white/10 bg-neutral-950/96 px-2 pt-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] shadow-[0_-14px_34px_rgba(0,0,0,0.3)] backdrop-blur-xl supports-[backdrop-filter]:bg-neutral-950/88";

  const mobileNav = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 isolate sm:hidden [backface-visibility:hidden] [contain:paint] [transform:translateZ(0)] [will-change:transform]">
        <div className={mobileShellClassName}>
          <div className="mx-auto max-w-[38rem]">
            <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
              <div className="flex min-w-max gap-1.5">
              {MOBILE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item, location.pathname);
                const itemClassName = active
                  ? isLight
                    ? "border border-sky-300 bg-white text-stone-900 shadow-[0_8px_18px_rgba(59,130,246,0.12)]"
                    : "border border-blue-400/15 bg-[linear-gradient(180deg,rgba(32,63,120,0.46),rgba(18,23,35,0.9))] text-white shadow-[0_8px_22px_rgba(37,99,235,0.12)]"
                  : isLight
                    ? "border border-transparent text-stone-600 hover:bg-white/72 hover:text-stone-900"
                    : "border border-transparent text-neutral-400 hover:bg-white/[0.04] hover:text-white";

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={`relative flex min-h-[4.25rem] min-w-[4.9rem] touch-manipulation flex-col items-center justify-center gap-1.5 rounded-[18px] px-2 py-2 text-[10px] font-medium transition ${itemClassName}`}
                  >
                    <div className="relative">
                      <NavIconShell active={active} isLight={isLight} mobile>
                        <Icon />
                      </NavIconShell>
                      {item.showMentionBadge ? (
                        <div className="absolute -right-2 -top-1.5">
                          <MentionBadge
                            count={totalUnreadMentions}
                            mobile
                            isLight={isLight}
                          />
                        </div>
                      ) : null}
                      {item.to === "/alerts" ? (
                        <div className="absolute -right-2 -top-1.5">
                          <NavCountBadge
                            count={unreadCount}
                            mobile
                            isLight={isLight}
                            tone="blue"
                          />
                        </div>
                      ) : null}
                    </div>
                    <span className="max-w-full truncate px-1 tracking-[0.01em]">{item.label}</span>
                  </NavLink>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  return (
    <>
      <div className="mb-5 hidden sm:block sm:mb-6">
        <div className={desktopShellClassName}>
          <div className="flex gap-2 overflow-x-auto">
            {DESKTOP_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item, location.pathname);
              const itemClassName = active
                ? isLight
                  ? "border border-sky-300 bg-white text-stone-900 shadow-[0_10px_22px_rgba(59,130,246,0.12)]"
                  : "border border-blue-400/20 bg-[linear-gradient(180deg,rgba(32,63,120,0.46),rgba(18,23,35,0.88))] text-white shadow-[0_10px_24px_rgba(37,99,235,0.14)]"
                : isLight
                ? "border border-transparent bg-white/56 text-stone-700 hover:border-stone-200 hover:bg-white"
                : "border border-transparent bg-white/[0.03] text-neutral-300 hover:border-white/10 hover:bg-white/[0.05]";

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={`inline-flex shrink-0 items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-[12px] font-medium transition sm:px-4 sm:text-sm ${itemClassName}`}
                >
                  <NavIconShell active={active} isLight={isLight}>
                    <Icon />
                  </NavIconShell>
                  <span className="tracking-[0.01em]">{item.label}</span>
                  {item.showMentionBadge ? (
                    <MentionBadge count={totalUnreadMentions} isLight={isLight} />
                  ) : null}
                  {item.to === "/alerts" ? (
                    <NavCountBadge count={unreadCount} isLight={isLight} tone="blue" />
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {createPortal(mobileNav, document.body)}
    </>
  );
}
