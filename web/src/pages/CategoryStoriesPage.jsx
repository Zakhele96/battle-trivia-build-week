import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublishedStories } from "../api/storiesApi";
import HomeWeatherWidget from "../components/HomeWeatherWidget";
import SiteFooter from "../components/SiteFooter";
import sivubelaLogo from "../assets/sivubela-logo.webp";
import {
  getCategoryFromSlug,
  normalizeCategory,
  slugifyCategory,
} from "../constants/storyCategories";
import Seo from "../components/Seo";
import { trackOncePerSession } from "../api/analyticsApi";

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

export default function CategoryStoriesPage() {
  const { categorySlug } = useParams();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_INITIAL_COUNT);

  const categoryName = useMemo(
    () => getCategoryFromSlug(categorySlug) || normalizeCategory(categorySlug),
    [categorySlug]
  );


useEffect(() => {
  if (!categorySlug) return;

  trackOncePerSession(`category_open:${categorySlug}`, {
    eventName: "category_open",
    pageType: "category",
    pageSlug: categorySlug,
    category: categoryName || categorySlug,
    label: categoryName || categorySlug,
  });
}, [categorySlug, categoryName]);

  useEffect(() => {
    loadStories();
  }, [categorySlug]);

  async function loadStories() {
    try {
      setLoading(true);
      setError("");

      const data = await getPublishedStories();
      setStories(Array.isArray(data) ? data : []);
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

  const filteredStories = useMemo(() => {
    return stories.filter(
      (story) => slugifyCategory(story.category) === categorySlug
    );
  }, [stories, categorySlug]);

  const featuredStory = filteredStories[0] || null;
  const remainingStories = filteredStories.slice(1);

  const mobileStories = useMemo(
    () => filteredStories.slice(0, mobileVisibleCount),
    [filteredStories, mobileVisibleCount]
  );

  const hasMoreMobileStories = mobileVisibleCount < filteredStories.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
          Loading category stories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (filteredStories.length === 0) {
    return (

      <div className="min-h-screen bg-slate-50">
        {/* Mobile compact masthead */}
        <div className="border-b border-slate-200 bg-white lg:hidden">
          <div className="px-3 py-2">
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

              <span className="justify-self-end text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                {categoryName}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <Link to="/stories" className="transition hover:text-slate-900">
                All Stories
              </Link>
              <span className="text-slate-400">•</span>
              <span className="text-slate-900">{categoryName}</span>
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden border-b border-slate-200 bg-white lg:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link
              to="/"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
            >
              ← back home
            </Link>

            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Sivubela Intuthuko
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Category
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {categoryName}
            </h1>
          </div>

          <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            No stories found in this category.
          </div>

          <HomeWeatherWidget />
        </div>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title={`${categoryName} Stories`}
        description={`Read the latest ${categoryName.toLowerCase()} stories from Sivubela Intuthuko.`}
        path={`/stories/category/${categorySlug}`}
        image="/social-share-default.jpg"
        type="website"
        keywords={[categoryName, "stories", "Sivubela Intuthuko"]}
      />


      {/* Mobile compact masthead */}
      <div className="border-b border-slate-200 bg-white lg:hidden">
        <div className="px-3 py-2">
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

            <span className="justify-self-end text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              {categoryName}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <Link to="/stories" className="transition hover:text-slate-900">
              All Stories
            </Link>
            <span className="text-slate-400">•</span>
            <span className="text-slate-900">{categoryName}</span>
          </div>
        </div>
      </div>

      {/* Desktop header */}
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
            Category
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            {categoryName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            Browse the latest stories from the {categoryName} section.
          </p>
        </div>

        {/* Mobile */}
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
                  index !== mobileStories.length - 1
                    ? "border-b border-slate-200"
                    : ""
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
                    <span>{categoryName}</span>
                    {story.publishDate ? (
                      <span>• {formatDate(story.publishDate)}</span>
                    ) : null}
                  </div>

                  <h3 className="line-clamp-2 text-[15px] font-black leading-5 tracking-tight text-slate-900">
                    {story.title}
                  </h3>

                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600">
                    {story.summary || stripHtml(story.bodyHtml).slice(0, 110)}
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
                    Math.min(prev + MOBILE_LOAD_MORE_COUNT, filteredStories.length)
                  )
                }
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Load more stories
              </button>
            </div>
          ) : null}
        </div>

        <HomeWeatherWidget />

        {/* Desktop */}
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
                  <span>{categoryName}</span>
                  {featuredStory.publishDate ? (
                    <span>• {formatDate(featuredStory.publishDate)}</span>
                  ) : null}
                </div>

                <h3 className="text-2xl font-black leading-tight tracking-tight text-slate-900 transition group-hover:text-slate-700 md:text-4xl">
                  {featuredStory.title}
                </h3>

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

          <div className="grid grid-cols-1 gap-4 lg:col-span-5">
            {remainingStories.map((story) => {
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
                      <span>{categoryName}</span>
                      {story.publishDate ? (
                        <span>• {formatDate(story.publishDate)}</span>
                      ) : null}
                    </div>

                    <h3 className="text-lg font-bold leading-7 text-white transition group-hover:text-white/90">
                      {story.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">
                      {story.summary ||
                        stripHtml(story.bodyHtml).slice(0, 110)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}