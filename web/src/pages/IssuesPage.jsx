import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getIssues } from "../api/issuesApi";
import { getPlacementsByKey } from "../api/placementsApi";
import IssueCard from "../components/IssueCard";
import HomeNewspaperHeader from "../components/HomeNewspaperHeader";
import BreakingLatestStrip from "../components/BreakingLatestStrip";
import HomeStoriesSection from "../components/HomeStoriesSection";
import HomeWeatherWidget from "../components/HomeWeatherWidget";
import StoriesByCategorySection from "../components/StoriesByCategorySection";
import SubscribeUpdatesBlock from "../components/SubscribeUpdatesBlock";
import SiteFooter from "../components/SiteFooter";
import Seo from "../components/Seo";
import PromoBlock from "../components/PromoBlock";
import AdSlot from "../components/AdSlot";

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
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

function getIssueThumbnailUrl(issue) {
  return (
    issue?.thumbnailUrl ||
    issue?.thumbnail_url ||
    issue?.thumbnail ||
    issue?.coverImageUrl ||
    issue?.cover_image_url ||
    ""
  );
}

function getIssueDate(issue) {
  return (
    issue?.publishDate ||
    issue?.publish_date ||
    issue?.createdAt ||
    issue?.created_at ||
    ""
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getIssueNumber(issue) {
  return issue?.issueNumber || issue?.issue_number || "";
}

function getIssueDescription(issue) {
  return issue?.description || "Open the latest edition in the digital reader.";
}

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [heroPromo, setHeroPromo] = useState(null);
  const [inlineAd, setInlineAd] = useState(null);

  useEffect(() => {
    loadPlacements();
  }, []);

  async function loadPlacements() {
    try {
      const [heroPromos, inlineAds] = await Promise.all([
        getPlacementsByKey("homepage_hero_promo"),
        getPlacementsByKey("homepage_inline_banner"),
      ]);

      setHeroPromo(heroPromos[0] || null);
      setInlineAd(inlineAds[0] || null);
    } catch {
      setHeroPromo(null);
      setInlineAd(null);
    }
  }

  useEffect(() => {
    async function loadIssues() {
      try {
        setLoading(true);
        setError("");

        const response = await getIssues();
        const normalizedIssues = normalizeArray(response);

        setIssues(normalizedIssues);
      } catch (err) {
        console.error("Failed to load issues:", err);
        setError("Failed to load issues.");
        setIssues([]);
      } finally {
        setLoading(false);
      }
    }

    loadIssues();
  }, []);

  const featuredIssue = useMemo(() => issues[0] || null, [issues]);
  const moreIssues = useMemo(() => issues.slice(1, 5), [issues]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="Home"
        description="Read the latest Sivubela Intuthuko stories, browse current categories, and open the newest digital edition."
        path="/"
        image="/social-share-default.jpg"
        type="website"
        keywords={[
          "Sivubela Intuthuko",
          "news",
          "digital newspaper",
          "Durban",
          "KwaZulu-Natal",
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <HomeNewspaperHeader />
        <BreakingLatestStrip />

        {heroPromo ? (
          <section className="mt-6">
            <PromoBlock placement={heroPromo} />
          </section>
        ) : null}

        {loading && (
          <div className="hidden border border-slate-200 bg-white p-6 lg:block">
            Loading latest edition...
          </div>
        )}

        {!loading && error && (
          <div className="hidden border border-red-200 bg-red-50 p-6 text-red-700 lg:block">
            {error}
          </div>
        )}

        {!loading && !error && issues.length === 0 && (
          <div className="hidden border border-slate-200 bg-white p-6 lg:block">
            No published issues found.
          </div>
        )}

        {!loading && !error && featuredIssue && (
          <section
            id="latest-issue"
            className="hidden scroll-mt-56 grid-cols-1 gap-6 border-t border-slate-200 pt-8 lg:grid lg:grid-cols-12"
          >
            <Link
              to={`/issues/${featuredIssue.slug}`}
              className="group overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300 lg:col-span-8"
            >
              <div className="grid h-full grid-cols-1 lg:grid-cols-12">
                <div className="bg-slate-100 lg:col-span-5">
                  {getIssueThumbnailUrl(featuredIssue) ? (
                    <img
                      src={getAssetUrl(getIssueThumbnailUrl(featuredIssue))}
                      alt={featuredIssue.title}
                      className="h-full w-full object-contain bg-white"
                    />
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center bg-slate-100 text-sm text-slate-400">
                      No thumbnail
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center p-6 md:p-8 lg:col-span-7">
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
                      Latest Issue
                    </span>

                    {getIssueNumber(featuredIssue) ? (
                      <span>Issue {getIssueNumber(featuredIssue)}</span>
                    ) : null}

                    {getIssueDate(featuredIssue) ? (
                      <span>• {formatDate(getIssueDate(featuredIssue))}</span>
                    ) : null}
                  </div>

                  <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 transition group-hover:text-slate-700 md:text-5xl">
                    {featuredIssue.title}
                  </h2>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                    {getIssueDescription(featuredIssue)}
                  </p>

                  <div className="mt-6 inline-flex items-center text-sm font-semibold text-slate-900">
                    Open digital reader →
                  </div>
                </div>
              </div>
            </Link>

            <aside className="space-y-6 lg:col-span-4">
              <div className="border border-slate-200 bg-white p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  This edition
                </div>

                <div className="mt-5 space-y-4 text-sm text-slate-700">
                  <div>
                    <div className="font-semibold text-slate-900">Title</div>
                    <div>{featuredIssue.title}</div>
                  </div>

                  {getIssueNumber(featuredIssue) ? (
                    <div>
                      <div className="font-semibold text-slate-900">Issue Number</div>
                      <div>{getIssueNumber(featuredIssue)}</div>
                    </div>
                  ) : null}

                  {getIssueDate(featuredIssue) ? (
                    <div>
                      <div className="font-semibold text-slate-900">Published</div>
                      <div>{formatDate(getIssueDate(featuredIssue))}</div>
                    </div>
                  ) : null}
                </div>

                <Link
                  to={`/issues/${featuredIssue.slug}`}
                  className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Read latest issue
                </Link>
              </div>

              <div className="border border-slate-200 bg-white p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Publication
                </div>

                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  Stories and editions together
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Follow current stories on the website, then dive deeper into
                  the publication through the full digital issue.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/stories"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    View stories
                  </Link>

                  <Link
                    to={`/issues/${featuredIssue.slug}`}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    View issue
                  </Link>
                </div>
              </div>
            </aside>
          </section>
        )}

        <HomeStoriesSection />
        <HomeWeatherWidget />

        {inlineAd ? (
          <section className="mt-8">
            <AdSlot placement={inlineAd} />
          </section>
        ) : null}

        {!loading && !error && featuredIssue && moreIssues.length > 0 ? (
          <section
            id="more-issues"
            className="mt-10 hidden scroll-mt-56 border-t border-slate-200 pt-8 lg:block"
          >
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Editions Archive
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  More Issues
                </h2>
              </div>

              <Link
                to="/issues"
                className="text-sm font-semibold text-slate-900 transition hover:text-slate-700"
              >
                View all issues →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {moreIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="hidden lg:block">
          <StoriesByCategorySection />
        </div>

        <SubscribeUpdatesBlock />
      </main>

      <SiteFooter />
    </div>
  );
}