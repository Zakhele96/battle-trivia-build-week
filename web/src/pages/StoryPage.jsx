import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublishedStories, getStoryBySlug } from "../api/storiesApi";
import StoryExchangeRatesWidget from "../components/StoryExchangeRatesWidget";
import StoryWeatherWidget from "../components/storyWeatherWidget";
import Seo, { truncate } from "../components/Seo";
import { trackOncePerSession } from "../api/analyticsApi";
import { getPlacementsByKey } from "../api/placementsApi";
import AdSlot from "../components/AdSlot";
import SponsoredBadge from "../components/SponsoredBadge";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function getReadingTime(html) {
  const text = stripHtml(html);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export default function StoryPage() {
  const { slug } = useParams();

  const [story, setStory] = useState(null);
  const [allStories, setAllStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sidebarPartner, setSidebarPartner] = useState(null);

  useEffect(() => {
    loadSidebarPartner();
  }, []);

  async function loadSidebarPartner() {
    try {
      const placements = await getPlacementsByKey("story_sidebar_partner");
      setSidebarPartner(placements[0] || null);
    } catch {
      setSidebarPartner(null);
    }
  }

  useEffect(() => {
    if (!story?.slug) return;

    trackOncePerSession(`story_open:${story.slug}`, {
      eventName: "story_open",
      pageType: "story",
      pageSlug: story.slug,
      category: story.category || "",
      label: story.title || "",
    });
  }, [story?.slug]);

  useEffect(() => {
  if (!story?.slug || !story?.isSponsored) return;

  trackOncePerSession(`sponsored_story_open:${story.slug}`, {
    eventName: "sponsored_story_open",
    pageType: "story",
    pageSlug: story.slug,
    label: story.title || "",
    metadata: {
      sponsorName: story.sponsorName || "",
      sponsorLabel: story.sponsorLabel || "",
      category: story.category || "",
    },
  });
}, [story?.slug, story?.isSponsored]);

  useEffect(() => {
    loadStoryPage();
  }, [slug]);

  async function loadStoryPage() {
    try {
      setLoading(true);
      setError("");

      const [storyData, storiesData] = await Promise.all([
        getStoryBySlug(slug),
        getPublishedStories(),
      ]);

      setStory(storyData);
      setAllStories(Array.isArray(storiesData) ? storiesData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load story."
      );
    } finally {
      setLoading(false);
    }
  }

  const heroImageSrc = useMemo(
    () => getAssetUrl(story?.heroImageUrl),
    [story?.heroImageUrl]
  );

  const currentUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [slug]);

  const readingTime = useMemo(
    () => getReadingTime(story?.bodyHtml || ""),
    [story?.bodyHtml]
  );

  const relatedStories = useMemo(() => {
    if (!story) return [];

    const otherStories = allStories.filter((item) => item.slug !== story.slug);

    const sameCategory = otherStories.filter(
      (item) =>
        item.category &&
        story.category &&
        item.category.toLowerCase() === story.category.toLowerCase()
    );

    const remaining = otherStories.filter(
      (item) => !sameCategory.some((matched) => matched.slug === item.slug)
    );

    return [...sameCategory, ...remaining].slice(0, 3);
  }, [allStories, story]);

  async function handleCopyLink() {
    try {
      if (!currentUrl) return;
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function shareToFacebook() {
    if (!currentUrl) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareToTwitter() {
    if (!currentUrl || !story?.title) return;
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        currentUrl
      )}&text=${encodeURIComponent(story.title)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-10 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
          Loading story...
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Story not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <Seo
        title={story.title}
        description={truncate(story.summary || stripHtml(story.bodyHtml), 160)}
        path={`/stories/${story.slug}`}
        image={story.heroImageUrl || "/social-share-default.jpg"}
        type="article"
        publishedTime={story.publishDate || ""}
        modifiedTime={story.updatedAt || story.publishDate || ""}
        author={story.authorName || ""}
        section={story.category || ""}
        keywords={[
          story.category,
          story.authorName,
          "Sivubela Intuthuko",
          "news",
        ].filter(Boolean)}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: story.title,
          description: truncate(story.summary || stripHtml(story.bodyHtml), 160),
          image: [story.heroImageUrl ? story.heroImageUrl : "/social-share-default.jpg"],
          datePublished: story.publishDate || undefined,
          dateModified: story.updatedAt || story.publishDate || undefined,
          author: story.authorName
            ? {
                "@type": "Person",
                name: story.authorName,
              }
            : undefined,
          publisher: {
            "@type": "Organization",
            name: "Sivubela Intuthuko",
            logo: {
              "@type": "ImageObject",
              url: "/social-share-default.jpg",
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `/stories/${story.slug}`,
          },
        }}
      />

      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/stories"
            className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900"
          >
            ← Back to stories
          </Link>

          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Sivubela Intuthuko
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <article className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/5">
              {heroImageSrc ? (
                <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-200">
                  <img
                    src={heroImageSrc}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="p-6 md:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
                  <Link to="/" className="transition hover:text-neutral-800">
                    Home
                  </Link>
                  <span>/</span>
                  <Link
                    to="/stories"
                    className="transition hover:text-neutral-800"
                  >
                    Stories
                  </Link>
                  {story.category ? (
                    <>
                      <span>/</span>
                      <span className="text-neutral-700">{story.category}</span>
                    </>
                  ) : null}
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-3">
                  {story.category ? (
                    <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      {story.category}
                    </span>
                  ) : null}

                  {story.isSponsored ? (
                    <SponsoredBadge label={story.sponsorLabel || "Sponsored"} />
                  ) : null}

                  {story.publishDate ? (
                    <span className="text-sm text-neutral-500">
                      {formatDate(story.publishDate)}
                    </span>
                  ) : null}

                  <span className="text-sm text-neutral-500">•</span>
                  <span className="text-sm text-neutral-500">{readingTime}</span>
                </div>

                <h1 className="text-3xl font-bold leading-tight text-neutral-900 md:text-5xl">
                  {story.title}
                </h1>

                {story.summary ? (
                  <p className="mt-5 text-lg leading-8 text-neutral-600">
                    {story.summary}
                  </p>
                ) : null}

                {story.isSponsored && story.sponsorName ? (
                  <div className="mt-4 text-sm font-medium text-neutral-600">
                    In partnership with {story.sponsorName}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-4 border-y border-neutral-200 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-600">
                    <span>
                      <strong className="text-neutral-900">Author:</strong>{" "}
                      {story.authorName || "Editorial Team"}
                    </span>

                    {story.updatedAt ? (
                      <span>
                        <strong className="text-neutral-900">Updated:</strong>{" "}
                        {formatDate(story.updatedAt)}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Share
                    </span>

                    <button
                      type="button"
                      onClick={shareToFacebook}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Facebook
                    </button>

                    <button
                      type="button"
                      onClick={shareToTwitter}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      X
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      {copied ? "Copied" : "Copy link"}
                    </button>
                  </div>
                </div>

                <div
                  className="
                    prose prose-lg mt-8 max-w-none text-neutral-800
                    prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-neutral-900
                    prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-3xl
                    prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-2xl
                    prose-h4:mt-6 prose-h4:mb-2 prose-h4:text-xl
                    prose-p:my-6 prose-p:leading-8 prose-p:text-neutral-800
                    prose-a:font-medium prose-a:text-neutral-900 prose-a:underline prose-a:decoration-neutral-300 hover:prose-a:text-neutral-700
                    prose-strong:text-neutral-900
                    prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
                    prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:my-2 prose-li:marker:text-neutral-500
                    prose-blockquote:my-8 prose-blockquote:border-l-4 prose-blockquote:border-neutral-300 prose-blockquote:bg-neutral-50 prose-blockquote:py-3 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-neutral-700
                    prose-img:my-8 prose-img:rounded-2xl prose-img:shadow-sm
                    prose-figure:my-8
                    prose-figcaption:text-sm prose-figcaption:text-neutral-500
                    prose-hr:my-10 prose-hr:border-neutral-200
                    prose-code:rounded prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:text-neutral-900
                    prose-pre:rounded-2xl prose-pre:bg-neutral-900 prose-pre:text-neutral-100

                    [&>p:first-of-type:first-letter]:float-left
                    [&>p:first-of-type:first-letter]:mr-3
                    [&>p:first-of-type:first-letter]:mt-1
                    [&>p:first-of-type:first-letter]:text-6xl
                    [&>p:first-of-type:first-letter]:font-bold
                    [&>p:first-of-type:first-letter]:leading-[0.85]
                    [&>p:first-of-type:first-letter]:text-neutral-900
                  "
                  dangerouslySetInnerHTML={{ __html: story.bodyHtml }}
                />
              </div>
            </article>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Story Info
              </div>

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div>
                  <div className="font-semibold text-slate-900">Category</div>
                  <div>{story.category || "General"}</div>
                </div>

                <div>
                  <div className="font-semibold text-slate-900">Author</div>
                  <div>{story.authorName || "Editorial Team"}</div>
                </div>

                {story.isSponsored ? (
                  <div>
                    <div className="font-semibold text-slate-900">Sponsorship</div>
                    <div>{story.sponsorName || story.sponsorLabel || "Sponsored"}</div>
                  </div>
                ) : null}

                <div>
                  <div className="font-semibold text-slate-900">Published</div>
                  <div>{story.publishDate ? formatDate(story.publishDate) : "—"}</div>
                </div>

                <div>
                  <div className="font-semibold text-slate-900">Reading Time</div>
                  <div>{readingTime}</div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <Link
                  to="/stories"
                  className="inline-flex text-sm font-semibold text-slate-900 transition hover:text-slate-700"
                >
                  View all stories →
                </Link>
              </div>
            </div>

            <StoryWeatherWidget />
            <StoryExchangeRatesWidget />

            {sidebarPartner ? <AdSlot placement={sidebarPartner} /> : null}
          </aside>
        </div>

        {relatedStories.length > 0 ? (
          <section className="mt-10 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5 md:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Continue Reading
                </div>
                <h2 className="mt-2 text-2xl font-bold text-neutral-900 md:text-3xl">
                  Related Stories
                </h2>
              </div>

              <Link
                to="/stories"
                className="text-sm font-semibold text-neutral-900 transition hover:text-neutral-700"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedStories.map((item) => (
                <Link
                  key={item.id}
                  to={`/stories/${item.slug}`}
                  className="group overflow-hidden rounded-[24px] border border-neutral-200 bg-white transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  {item.heroImageUrl ? (
                    <div className="aspect-[16/10] overflow-hidden bg-neutral-200">
                      <img
                        src={getAssetUrl(item.heroImageUrl)}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : null}

                  <div className="p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      {item.category ? (
                        <span className="font-semibold uppercase tracking-wide text-neutral-800">
                          {item.category}
                        </span>
                      ) : null}

                      {item.isSponsored ? (
                        <SponsoredBadge label={item.sponsorLabel || "Sponsored"} />
                      ) : null}

                      {item.publishDate ? (
                        <span>• {formatDate(item.publishDate)}</span>
                      ) : null}
                    </div>

                    <h3 className="text-xl font-bold leading-8 text-neutral-900 transition group-hover:text-neutral-700">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-neutral-600">
                      {item.summary || stripHtml(item.bodyHtml).slice(0, 140)}
                    </p>

                    <div className="mt-4 text-sm font-semibold text-neutral-900">
                      Read more →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}