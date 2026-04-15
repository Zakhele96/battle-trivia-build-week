import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPublishedStories, searchStories } from "../api/storiesApi";
import SiteFooter from "../components/SiteFooter";
import SubscribeUpdatesBlock from "../components/SubscribeUpdatesBlock";
import sivubelaLogo from "../assets/sivubela-logo.webp";
import Seo from "../components/Seo";
import { trackEvent } from "../api/analyticsApi";
import SafeImage from "../components/SafeImage";
import SponsoredBadge from "../components/SponsoredBadge";
import { highlightText } from "../utils/highlightText";

const INITIAL_LIST_COUNT = 8;
const LOAD_MORE_COUNT = 6;
const SEARCH_PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getAssetUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  try {
    const apiUrl = new URL(apiBaseUrl);
    return path.startsWith("/")
      ? `${apiUrl.origin}${path}`
      : `${apiUrl.origin}/${path}`;
  } catch {
    return path;
  }
}

export default function StoriesIndexPage() {
  const [stories, setStories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIST_COUNT);
  const [searchParams, setSearchParams] = useSearchParams();

  const query = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    loadStories();
  }, [query, page]);

  async function loadStories() {
    try {
      setLoading(true);
      setError("");

      if (query) {
        const result = await searchStories(query, page, SEARCH_PAGE_SIZE);
        setStories(Array.isArray(result.items) ? result.items : []);
        setTotalCount(Number(result.totalCount || 0));
      } else {
        const data = await getPublishedStories();
        const normalized = Array.isArray(data) ? data : [];
        setStories(normalized);
        setTotalCount(normalized.length);
        setVisibleCount(INITIAL_LIST_COUNT);
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Failed to load stories."
      );
      setStories([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const trimmed = searchInput.trim();

    if (!trimmed) {
      setSearchParams({});
      return;
    }

    void trackEvent({
      eventName: "search_submit",
      pageType: "search",
      label: trimmed,
      metadata: {
        source: "stories_index",
      },
    });

    setSearchParams({ q: trimmed, page: "1" });
  }

  function goToPage(nextPage) {
    const trimmed = query.trim();

    if (!trimmed) return;

    setSearchParams({
      q: trimmed,
      page: String(nextPage),
    });
  }

  const featuredStory = useMemo(() => {
    if (query) return null;
    return stories[0] || null;
  }, [stories, query]);

  const remainingStories = useMemo(() => {
    if (query) return stories;
    return stories.slice(1);
  }, [stories, query]);

  const visibleStories = useMemo(() => {
    if (query) return remainingStories;
    return remainingStories.slice(0, visibleCount);
  }, [remainingStories, visibleCount, query]);

  const hasMoreStories = !query && visibleCount < remainingStories.length;
  const totalPages = query ? Math.max(1, Math.ceil(totalCount / SEARCH_PAGE_SIZE)) : 1;

  const seoTitle = query ? `Search: ${query}` : "All Stories";
  const seoDescription = query
    ? `Browse search results for "${query}" on Sivubela Intuthuko.`
    : "Browse the latest published stories from Sivubela Intuthuko.";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Seo
          title={seoTitle}
          description={seoDescription}
          path={query ? `/stories?q=${encodeURIComponent(query)}&page=${page}` : "/stories"}
          image="/social-share-default.jpg"
          type="website"
          robots={query ? "noindex,follow" : "index,follow"}
          keywords={["stories", "news", "Sivubela Intuthuko", query].filter(Boolean)}
        />

        <div className="border-b border-slate-200 bg-white lg:hidden">
          <div className="px-3 py-2">
            <div className="grid grid-cols-3 items-center">
              <Link
                to="/"
                className="justify-self-start text-[11px] font-semibold uppercase tracking-wide text-slate-700"
              >
                Home
              </Link>

              <Link to="/" className="justify-self-center">
                <img
                  src={sivubelaLogo}
                  alt="Sivubela Intuthuko"
                  className="mx-auto h-9 w-auto object-contain"
                />
              </Link>

              <span className="justify-self-end text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                Stories
              </span>
            </div>
          </div>
        </div>

        <div className="hidden border-b border-slate-200 bg-white lg:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link
              to="/"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
            >
              ← Back home
            </Link>

            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Sivubela Intuthuko
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            Loading latest published stories...
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Seo
          title={seoTitle}
          description={seoDescription}
          path={query ? `/stories?q=${encodeURIComponent(query)}&page=${page}` : "/stories"}
          image="/social-share-default.jpg"
          type="website"
          robots={query ? "noindex,follow" : "index,follow"}
          keywords={["stories", "news", "Sivubela Intuthuko", query].filter(Boolean)}
        />

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={query ? `/stories?q=${encodeURIComponent(query)}&page=${page}` : "/stories"}
        image="/social-share-default.jpg"
        type="website"
        robots={query ? "noindex,follow" : "index,follow"}
        keywords={["stories", "news", "Sivubela Intuthuko", query].filter(Boolean)}
      />

      <div className="border-b border-slate-200 bg-white lg:hidden">
        <div className="px-3 py-2">
          <div className="grid grid-cols-3 items-center">
            <Link
              to="/"
              className="justify-self-start text-[11px] font-semibold uppercase tracking-wide text-slate-700"
            >
              Home
            </Link>

            <Link to="/" className="justify-self-center">
              <img
                src={sivubelaLogo}
                alt="Sivubela Intuthuko"
                className="mx-auto h-9 w-auto object-contain"
              />
            </Link>

            <span className="justify-self-end text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              Stories
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <Link to="/" className="transition hover:text-slate-900">
              Home
            </Link>
            <span className="text-slate-400">•</span>
            <span className="text-slate-900">Latest Published Stories</span>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
          >
            ← Back home
          </Link>

          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Sivubela Intuthuko
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Latest Published Stories
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            {query ? `Search: ${query}` : "All Stories"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            {query
              ? `Showing ${totalCount} result${totalCount === 1 ? "" : "s"} for “${query}”.`
              : "Browse the latest published stories from Sivubela Intuthuko."}
          </p>

          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search stories, categories, or authors..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Search
            </button>
          </form>
        </div>

        {!query && !featuredStory ? (
          <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            No stories available.
          </div>
        ) : query && visibleStories.length === 0 ? (
          <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            No stories matched your search.
          </div>
        ) : (
          <>
            {!query && featuredStory ? (
              <Link
                to={`/stories/${featuredStory.slug}`}
                className="group mb-8 block overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300"
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-200">
                  <SafeImage
                    src={getAssetUrl(featuredStory.heroImageUrl)}
                    alt={featuredStory.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    fallbackClassName="h-full w-full"
                    fallbackLabel="No image"
                  />
                </div>

                <div className="p-5 md:p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {featuredStory.category ? <span>{featuredStory.category}</span> : null}
                    {featuredStory.isSponsored ? (
                      <SponsoredBadge label={featuredStory.sponsorLabel || "Sponsored"} />
                    ) : null}
                    {featuredStory.publishDate ? (
                      <span>• {formatDate(featuredStory.publishDate)}</span>
                    ) : null}
                  </div>

                  <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900 transition group-hover:text-slate-700 md:text-4xl">
                    {featuredStory.title}
                  </h2>

                  <p className="mt-4 line-clamp-2 text-sm leading-7 text-slate-600 md:text-base">
                    {featuredStory.summary ||
                      stripHtml(featuredStory.bodyHtml).slice(0, 220)}
                  </p>

                  <div className="mt-5 text-sm font-semibold text-slate-900">
                    Read story →
                  </div>
                </div>
              </Link>
            ) : null}

            <div className="border border-slate-200 bg-white">
              {visibleStories.map((story, index) => {
                const imageUrl = story.heroImageUrl
                  ? getAssetUrl(story.heroImageUrl)
                  : "";

                const isLastItem = index === visibleStories.length - 1;
                const shouldShowBorder =
                  query ? !isLastItem : index !== visibleStories.length - 1 || hasMoreStories;

                return (
                  <Link
                    key={story.id}
                    to={`/stories/${story.slug}`}
                    className={`grid grid-cols-[96px_1fr] gap-3 p-3 transition hover:bg-slate-50 md:grid-cols-[132px_1fr] md:gap-4 md:p-4 ${
                      shouldShowBorder ? "border-b border-slate-200" : ""
                    }`}
                  >
                    <div className="h-[76px] w-[96px] shrink-0 overflow-hidden bg-slate-100 md:h-[92px] md:w-[132px]">
                      <SafeImage
                        src={imageUrl}
                        alt={story.title}
                        className="h-full w-full object-cover"
                        fallbackClassName="h-full w-full"
                        fallbackLabel="No image"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-500 md:mb-1.5 md:text-[11px]">
                        {story.category ? <span>{story.category}</span> : null}
                        {story.isSponsored ? (
                          <SponsoredBadge label={story.sponsorLabel || "Sponsored"} />
                        ) : null}
                        {story.publishDate ? (
                          <span>• {formatDate(story.publishDate)}</span>
                        ) : null}
                      </div>

                      <h3 className="line-clamp-2 text-[15px] font-black leading-5 tracking-tight text-slate-900 md:text-lg md:leading-6">
                        {query ? highlightText(story.title, query) : story.title}
                      </h3>

                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600 md:text-sm md:leading-6">
                        {query
                          ? highlightText(
                              story.summary || stripHtml(story.bodyHtml).slice(0, 130),
                              query
                            )
                          : story.summary || stripHtml(story.bodyHtml).slice(0, 130)}
                      </p>
                    </div>
                  </Link>
                );
              })}

              {!query && hasMoreStories ? (
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + LOAD_MORE_COUNT, remainingStories.length)
                      )
                    }
                    className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Load more stories
                  </button>
                </div>
              ) : null}
            </div>

            {query && totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="text-sm text-slate-600">
                  Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
                  <span className="font-semibold text-slate-900">{totalPages}</span>
                </div>

                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}

        <SubscribeUpdatesBlock />
      </div>

      <SiteFooter />
    </div>
  );
}