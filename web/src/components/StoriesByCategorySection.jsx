import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedStories } from "../api/storiesApi";
import SponsoredBadge from "../components/SponsoredBadge";

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

export default function StoriesByCategorySection() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    try {
      setLoading(true);
      setError("");

      const data = await getPublishedStories();
      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load grouped stories."
      );
    } finally {
      setLoading(false);
    }
  }

  const groupedCategories = useMemo(() => {
    const grouped = stories.reduce((acc, story) => {
      const category = normalizeCategory(story.category);

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push(story);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([category, items]) => ({
        category,
        slug: slugifyCategory(category),
        items: items.slice(0, 4),
        totalCount: items.length,
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [stories]);

  if (loading) {
    return (
      <section
        id="stories-by-category"
        className="mt-10 border-t border-slate-200 pt-8"
      >
        <div className="text-sm text-slate-600">Loading stories by category...</div>
      </section>
    );
  }

  if (error || groupedCategories.length === 0) {
    return null;
  }

  return (
    <section
      id="stories-by-category"
      className="mt-10 border-t border-slate-200 pt-8"
    >
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Browse Sections
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Stories by Category
          </h2>
        </div>

        <Link
          to="/stories"
          className="text-sm font-semibold text-slate-900 transition hover:text-slate-700"
        >
          View all stories →
        </Link>
      </div>

      <div className="space-y-10">
        {groupedCategories.map((group) => {
          const featured = group.items[0];
          const rest = group.items.slice(1);

          return (
            <div
              key={group.category}
              id={`section-${group.slug}`}
              className="scroll-mt-56 border-t border-slate-200 pt-8 first:border-t-0 first:pt-0"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                  {group.category}
                </h3>

                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {group.totalCount} {group.totalCount === 1 ? "story" : "stories"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {featured ? (
                  <Link
                    to={`/stories/${featured.slug}`}
                    className="group overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300 lg:col-span-6"
                  >
                    {featured.heroImageUrl ? (
                      <div className="aspect-[16/9] overflow-hidden bg-slate-200">
                        <img
                          src={getAssetUrl(featured.heroImageUrl)}
                          alt={featured.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-slate-100 text-sm text-slate-400">
                        No image
                      </div>
                    )}

                    <div className="p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        <span>{group.category}</span>
                        {featured.isSponsored ? (
                          <SponsoredBadge label={featured.sponsorLabel || "Sponsored"} />
                        ) : null}
                        {featured.publishDate ? (
                          <span>• {formatDate(featured.publishDate)}</span>
                        ) : null}
                      </div>

                      <h4 className="text-2xl font-bold leading-8 tracking-tight text-slate-900 transition group-hover:text-slate-700">
                        {featured.title}
                      </h4>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {featured.summary ||
                          stripHtml(featured.bodyHtml).slice(0, 180)}
                      </p>

                      <div className="mt-4 text-sm font-semibold text-slate-900">
                        Read story →
                      </div>
                    </div>
                  </Link>
                ) : null}

                <div className="grid grid-cols-1 gap-4 lg:col-span-6">
                  {rest.map((story) => {
                    const backgroundImage = story.heroImageUrl
                      ? getAssetUrl(story.heroImageUrl)
                      : "";

                    return (
                      <Link
                        key={story.id}
                        to={`/stories/${story.slug}`}
                        className="group relative min-h-[190px] overflow-hidden border border-slate-200 bg-slate-900 transition hover:border-slate-300"
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
                            <span>{group.category}</span>
                            {story.isSponsored ? (
                              <SponsoredBadge label={story.sponsorLabel || "Sponsored"} />
                            ) : null}
                            {story.publishDate ? (
                              <span>• {formatDate(story.publishDate)}</span>
                            ) : null}
                          </div>

                          <h4 className="text-lg font-bold leading-7 text-white transition group-hover:text-white/90">
                            {story.title}
                          </h4>

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
          );
        })}
      </div>
    </section>
  );
}