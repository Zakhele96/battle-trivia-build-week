import { NavLink, useLocation } from "react-router-dom";
import { useMentions } from "../../context/MentionContext";

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

function MentionBadge({ count, mobile = false }) {
  if (!count || count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-amber-300/18 bg-amber-300/12 font-medium text-amber-100 ${
        mobile
          ? "min-w-[1.1rem] px-1 py-0.5 text-[9px]"
          : "min-w-[1.2rem] px-1.5 py-0.5 text-[10px]"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AppSectionNav() {
  const location = useLocation();
  const { totalUnreadMentions } = useMentions();

  return (
    <>
      <div className="mb-5 hidden sm:block sm:mb-6">
        <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] p-2 shadow-[0_14px_34px_rgba(0,0,0,0.14)]">
          <div className="flex gap-2 overflow-x-auto">
            {DESKTOP_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item, location.pathname);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-[16px] px-3.5 py-2.5 text-[12px] font-medium transition sm:px-4 sm:text-sm ${
                    active
                      ? "border border-blue-400/20 bg-blue-500/10 text-white shadow-[0_8px_24px_rgba(37,99,235,0.14)]"
                      : "border border-transparent bg-white/[0.03] text-neutral-300 hover:border-white/10 hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {item.showMentionBadge ? (
                    <MentionBadge count={totalUnreadMentions} />
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:hidden [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
        <div className="pointer-events-auto border-t border-white/10 bg-neutral-950/96 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-14px_34px_rgba(0,0,0,0.3)] backdrop-blur-xl supports-[backdrop-filter]:bg-neutral-950/88">
          <div className="mx-auto max-w-[38rem]">
            <div className="grid grid-cols-5 gap-1">
              {MOBILE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item, location.pathname);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={`relative flex min-h-[4rem] touch-manipulation flex-col items-center justify-center gap-1 rounded-[16px] px-2 py-2 text-[10px] font-medium transition ${
                      active
                        ? "bg-blue-500/10 text-white"
                        : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <div className="relative">
                      <Icon />
                      {item.showMentionBadge ? (
                        <div className="absolute -right-3 -top-2">
                          <MentionBadge count={totalUnreadMentions} mobile />
                        </div>
                      ) : null}
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}