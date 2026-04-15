import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const CONTENT_LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/issues", label: "Issues" },
  { to: "/admin/upload", label: "Upload Issue" },
  { to: "/admin/stories", label: "Stories" },
  { to: "/admin/stories/create", label: "Create Story" },
  { to: "/admin/stories/media", label: "Media Library" },
  { to: "/admin/subscribers", label: "Subscribers" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/placements", label: "Placements" },
];

function navLinkClass(isActive) {
  return [
    "block rounded-xl px-4 py-3 text-sm font-medium transition",
    isActive
      ? "bg-neutral-900 text-white"
      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
  ].join(" ");
}

function getPageTitle(pathname) {
  if (pathname === "/admin") return "Dashboard";
  if (pathname === "/admin/issues") return "Manage Issues";
  if (pathname.startsWith("/admin/issues/")) return "Edit Issue";
  if (pathname === "/admin/upload") return "Upload Issue";
  if (pathname === "/admin/stories") return "Manage Stories";
  if (pathname === "/admin/stories/create") return "Create Story";
  if (pathname.startsWith("/admin/stories/") && pathname.endsWith("/edit")) {
    return "Edit Story";
  }
  if (pathname === "/admin/categories") return "Categories";
if (pathname === "/admin/categories/create") return "Create Category";
if (pathname.startsWith("/admin/categories/") && pathname.endsWith("/edit")) {
  return "Edit Category";
}
  if (pathname === "/admin/stories/media") return "Media Library";
  if (pathname === "/admin/subscribers") return "Subscribers";
  if (pathname === "/admin/analytics") return "Analytics";
  if (pathname === "/admin/placements") return "Placements";
  if (pathname === "/admin/placements/create") return "Create Placement";
  if (pathname.startsWith("/admin/placements/") && pathname.endsWith("/edit")) {
    return "Edit Placement";
  }
  return "Admin Workspace";
}

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Mobile top bar */}
      <div className="border-b border-neutral-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Admin
            </div>
            <div className="text-lg font-bold text-neutral-900">{pageTitle}</div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              View Site
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-neutral-200 px-4 py-3">
          <div className="flex gap-2">
            {CONTENT_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px]">
        {/* Desktop sidebar */}
        <aside className="hidden min-h-screen w-72 shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-neutral-200 px-6 py-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Admin Panel
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
              Sivubela Intuthuko
            </h1>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Manage issues, stories, uploads, media, and analytics from one place.
            </p>
          </div>

          <div className="flex-1 px-4 py-6">
            <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Content
            </div>

            <nav className="space-y-2">
              {CONTENT_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="border-t border-neutral-200 px-4 py-4">
            <div className="mb-3 px-1 text-sm text-neutral-600">
              Signed in as{" "}
              <span className="font-medium text-neutral-900">
                {user?.displayName || user?.username || "Admin"}
              </span>
            </div>

            <div className="flex gap-2">
              <Link
                to="/"
                className="block flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                View Site
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="block flex-1 rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="hidden border-b border-neutral-200 bg-white px-6 py-4 lg:block">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Content Management
                </div>
                <div className="mt-1 text-lg font-semibold text-neutral-900">
                  {pageTitle}
                </div>
              </div>

              <Link
                to="/"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Open Public Site
              </Link>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}