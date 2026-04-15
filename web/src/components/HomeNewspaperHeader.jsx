import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublishedStories } from "../api/storiesApi";
import { useAdminAuth } from "../context/AdminAuthContext";
import sivubelaLogo from "../assets/sivubela-logo.webp";
import { SITE_CONFIG } from "../config/siteConfig";
import { trackEvent } from "../api/analyticsApi";


function normalizeCategory(category) {
  return category?.trim() || "General";
}

function slugifyCategory(category) {
  return normalizeCategory(category)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: SITE_CONFIG.social.facebook,
    hoverClass:
      "hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M13.5 8.5V6.8c0-.8.5-1.3 1.4-1.3H16V2.5h-2.4C10.9 2.5 9.5 4.1 9.5 6.7v1.8H7v3h2.5v10H13v-10h2.6l.4-3h-3.5Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: SITE_CONFIG.social.instagram,
    hoverClass:
      "hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-6.5L6.5 22H3.4l7.3-8.3L1 2h6.2l4.4 6 5.3-6Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M23 8.2a3 3 0 0 0-2.1-2.1C19 5.5 12 5.5 12 5.5s-7 0-8.9.6A3 3 0 0 0 1 8.2 31.8 31.8 0 0 0 .5 12c0 1.3.1 2.5.5 3.8a3 3 0 0 0 2.1 2.1c1.9.6 8.9.6 8.9.6s7 0 8.9-.6a3 3 0 0 0 2.1-2.1c.4-1.3.5-2.5.5-3.8 0-1.3-.1-2.5-.5-3.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
      </svg>
    ),
  },
].filter((item) => item.href);
export default function HomeNewspaperHeader() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    try {
      setLoading(true);
      const data = await getPublishedStories();
      setStories(Array.isArray(data) ? data : []);
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = search.trim();

    if (!query) {
      navigate("/stories");
      return;
    }

    void trackEvent({
      eventName: "search_submit",
      pageType: "search",
      label: query,
      metadata: {
        source: "header",
      },
    });

    navigate(`/stories?q=${encodeURIComponent(query)}`);
  }

  const categories = useMemo(() => {
    const seen = new Set();
    const unique = [];

    for (const story of stories) {
      const category = normalizeCategory(story.category);
      const key = category.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(category);
      }
    }

    return unique.slice(0, 8);
  }, [stories]);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="rounded-[18px] bg-slate-50/90 sm:rounded-[24px]">
        <header className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm sm:rounded-[24px]">
          {/* MOBILE HEADER */}
          <div className="sm:hidden">
            <div className="border-b border-slate-200 px-3 py-2">
              <div className="grid grid-cols-3 items-center">
                <Link
                  to="/stories"
                  className="justify-self-start text-[11px] font-semibold uppercase tracking-wide text-slate-700"
                >
                  Stories
                </Link>

                <Link to="/" className="justify-self-center">
                  <img
                    src={sivubelaLogo}
                    alt="Sivubela Intuthuko"
                    className="mx-auto h-9 w-auto object-contain"
                  />
                </Link>

                <a
                  href="#latest-stories"
                  className="justify-self-end text-[11px] font-semibold uppercase tracking-wide text-slate-700"
                >
                  Latest
                </a>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
              <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                <a href="#latest-stories" className="transition hover:text-slate-900">
                  Front Stories
                </a>

                <a href="#stories-by-category" className="transition hover:text-slate-900">
                  Categories
                </a>

                <Link to="/stories" className="transition hover:text-slate-900">
                  All Stories
                </Link>
              </nav>
            </div>

            <div className="border-b border-slate-200 px-3 py-2.5">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search stories..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden sm:block">
            <div className="border-b border-slate-200 px-4 py-2.5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Independent Digital Publication
                </div>

                <div className="flex items-center gap-3 text-slate-500">
                  <span className="text-xs font-medium">KwaZulu-Natal</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium">Stories & Editions</span>

                  <div className="ml-3 flex items-center gap-2 border-l border-slate-200 pl-3">
                    {SOCIAL_LINKS.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                      >
                        {item.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
              <div className="grid gap-6 xl:grid-cols-[1fr_420px] xl:items-end">
                <div className="flex items-start gap-5">
                  <Link to="/" className="shrink-0">
                    <img
                      src={sivubelaLogo}
                      alt="Sivubela Intuthuko"
                      className="h-20 w-auto object-contain"
                    />
                  </Link>

                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                      Sivubela Intuthuko
                    </div>

                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                      Sivubela Intuthuko
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      The latest issue, current stories, and category-led reading in one place.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search stories, topics, or categories..."
                      className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Search
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/stories"
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                    >
                      All Stories
                    </Link>
                    <Link
                      to="/issues"
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                    >
                      All Issues
                    </Link>

                    {isAuthenticated ? (
                      <Link
                        to="/admin"
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Admin
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
              <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-700">
                <a href="#latest-issue" className="transition hover:text-slate-900">
                  Latest Issue
                </a>

                <a href="#more-issues" className="transition hover:text-slate-900">
                  More Issues
                </a>

                <a href="#latest-stories" className="transition hover:text-slate-900">
                  Latest Stories
                </a>

                <a href="#stories-by-category" className="transition hover:text-slate-900">
                  Categories
                </a>

                <Link to="/stories" className="transition hover:text-slate-900">
                  All Stories
                </Link>
              </nav>
            </div>

            <div className="px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-3 text-sm text-slate-600">
                <span className="mr-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Sections
                </span>

                {!loading &&
                  categories.map((category) => (
                    <a
                      key={category}
                      href={`#section-${slugifyCategory(category)}`}
                      className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
                    >
                      {category}
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}