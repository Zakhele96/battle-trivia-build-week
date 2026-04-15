import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getPublishedStories } from "../api/storiesApi";
import SponsoredBadge from "../components/SponsoredBadge";

const MOBILE_INITIAL_COUNT = 6;
const MOBILE_LOAD_MORE_COUNT = 4;

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

export default function HomeStoriesSection() {
  const [allStories, setAllStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_INITIAL_COUNT);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    try {
      setLoading(true);
      setError("");

      const data = await getPublishedStories();
      const stories = Array.isArray(data) ? data : [];

      setAllStories(stories);
      setMobileVisibleCount(MOBILE_INITIAL_COUNT);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load stories."
      );
    } finally {
      setLoading(false);
    }
  }

  const desktopStories = useMemo(() => allStories.slice(0, 5), [allStories]);
  const featuredStory = useMemo(() => desktopStories[0] || null, [desktopStories]);
  const sideStories = useMemo(() => desktopStories.slice(1, 5), [desktopStories]);

  const mobileStories = useMemo(
    () => allStories.slice(0, mobileVisibleCount),
    [allStories, mobileVisibleCount]
  );

  const hasMoreMobileStories = mobileVisibleCount < allStories.length;

  if (loading) {
    return (
      <section
        id="latest-stories"
        className="mt-10 border-t border-slate-200 pt-8"
      >
        <div className="text-sm text-slate-600">Loading latest stories...</div>
      </section>
    );
  }

  if (error || allStories.length === 0) {
    return null;
  }

  return (
    <section
      id="latest-stories"
      className="mt-10 border-t border-slate-200 pt-8"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Latest Stories
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Today’s Front Stories
          </h2>
        </div>

        <Link
          to="/stories"
          className="group hidden items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-slate-700 lg:inline-flex"
        >
          <span className="relative">
            View all
            <span className="absolute left-0 top-full h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
          </span>
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>

      <div className="border border-slate-200 bg-white lg:hidden">
        {mobileStories.map((story, index) => {
          const imageUrl = story.heroImageUrl
            ? getAssetUrl(story.heroImageUrl)
            : "";

          return (
            <Link
              key={story.id}
              to={`/stories/${story.slug}`}
              className={`grid grid-cols-[96px_1fr] gap-3 p-3 transition hover:bg-slate-50 ${
                index !== mobileStories.length - 1 ? "border-b border-slate-200" : ""
              }`}
            >
              <div className="h-[76px] w-[96px] shrink-0 overflow-hidden bg-slate-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {story.category ? <span>{story.category}</span> : null}
                  {story.isSponsored ? (
                    <SponsoredBadge label={story.sponsorLabel || "Sponsored"} />
                  ) : null}
                  {story.publishDate ? <span>• {formatDate(story.publishDate)}</span> : null}
                </div>

                <h3 className="line-clamp-2 text-[15px] font-black leading-5 tracking-tight text-slate-900">
                  {story.title}
                </h3>

                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600">
                  {story.summary || stripHtml(story.bodyHtml).slice(0, 100)}
                </p>
              </div>
            </Link>
          );
        })}

        {hasMoreMobileStories ? (
          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={() =>
                setMobileVisibleCount((prev) =>
                  Math.min(prev + MOBILE_LOAD_MORE_COUNT, allStories.length)
                )
              }
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Load more stories
            </button>
          </div>
        ) : null}
      </div>

      <div className="hidden grid-cols-1 gap-6 lg:grid lg:grid-cols-12">
        {featuredStory ? (
          <Link
            to={`/stories/${featuredStory.slug}`}
            className="group overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300 lg:col-span-7"
          >
            {featuredStory.heroImageUrl ? (
              <div className="aspect-[16/9] overflow-hidden bg-slate-200">
                <img
                  src={getAssetUrl(featuredStory.heroImageUrl)}
                  alt={featuredStory.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center bg-slate-100 text-sm text-slate-400">
                No image
              </div>
            )}

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

              <h3 className="text-2xl font-black leading-tight tracking-tight text-slate-900 transition group-hover:text-slate-700 md:text-4xl">
                {featuredStory.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                {featuredStory.summary ||
                  stripHtml(featuredStory.bodyHtml).slice(0, 220)}
              </p>

              <div className="mt-5 text-sm font-semibold text-slate-900">
                Read story →
              </div>
            </div>
          </Link>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:col-span-5">
          {sideStories.map((story) => {
            const backgroundImage = story.heroImageUrl
              ? getAssetUrl(story.heroImageUrl)
              : "";

            return (
              <Link
                key={story.id}
                to={`/stories/${story.slug}`}
                className="group relative min-h-[180px] overflow-hidden border border-slate-200 bg-slate-900 transition hover:border-slate-300"
              >
                {backgroundImage ? (
                  <>
                    <img
                      src={backgroundImage}
                      alt={story.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-slate-700" />
                )}

                <div className="relative flex h-full flex-col justify-end p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-white/80">
                    {story.category ? <span>{story.category}</span> : null}
                    {story.isSponsored ? (
                      <SponsoredBadge label={story.sponsorLabel || "Sponsored"} />
                    ) : null}
                    {story.publishDate ? <span>• {formatDate(story.publishDate)}</span> : null}
                  </div>

                  <h3 className="text-lg font-bold leading-7 text-white transition group-hover:text-white/90">
                    {story.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">
                    {story.summary || stripHtml(story.bodyHtml).slice(0, 110)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}