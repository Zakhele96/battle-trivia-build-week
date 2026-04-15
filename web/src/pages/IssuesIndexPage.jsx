import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getIssues } from "../api/issuesApi";
import { getPlacementsByKey } from "../api/placementsApi";
import SiteFooter from "../components/SiteFooter";
import sivubelaLogo from "../assets/sivubela-logo.webp";
import Seo from "../components/Seo";
import PromoBlock from "../components/PromoBlock";

const INITIAL_GRID_COUNT = 8;
const LOAD_MORE_COUNT = 6;

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

function getIssueNumber(issue) {
  return issue?.issueNumber || issue?.issue_number || "";
}

function getIssueDescription(issue) {
  return issue?.description || "Open the digital edition and read the full issue.";
}

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

export default function IssuesIndexPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_GRID_COUNT);
  const [issueSponsorStrip, setIssueSponsorStrip] = useState(null);

  useEffect(() => {
    loadIssues();
    loadIssueSponsorStrip();
  }, []);

  async function loadIssues() {
    try {
      setLoading(true);
      setError("");

      const response = await getIssues();
      const normalized = normalizeArray(response);

      setIssues(normalized);
      setVisibleCount(INITIAL_GRID_COUNT);
    } catch (err) {
      console.error("Failed to load issues:", err);
      setError("Failed to load issues.");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadIssueSponsorStrip() {
    try {
      const placements = await getPlacementsByKey("issue_sponsor_strip");
      setIssueSponsorStrip(placements[0] || null);
    } catch {
      setIssueSponsorStrip(null);
    }
  }

  const featuredIssue = useMemo(() => issues[0] || null, [issues]);
  const archiveIssues = useMemo(() => issues.slice(1), [issues]);

  const visibleArchiveIssues = useMemo(
    () => archiveIssues.slice(0, visibleCount),
    [archiveIssues, visibleCount]
  );

  const hasMoreIssues = visibleCount < archiveIssues.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Seo
          title="All Issues"
          description="Browse the published digital editions archive from Sivubela Intuthuko."
          path="/issues"
          image="/social-share-default.jpg"
          type="website"
          keywords={["issues", "digital editions", "newspaper archive", "Sivubela Intuthuko"]}
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
                Issues
              </span>
            </div>
          </div>
        </div>

        <div className="hidden border-b border-slate-200 bg-white lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
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

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            Loading digital editions...
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
          title="All Issues"
          description="Browse the published digital editions archive from Sivubela Intuthuko."
          path="/issues"
          image="/social-share-default.jpg"
          type="website"
          keywords={["issues", "digital editions", "newspaper archive", "Sivubela Intuthuko"]}
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
                Issues
              </span>
            </div>
          </div>
        </div>

        <div className="hidden border-b border-slate-200 bg-white lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
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

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Seo
          title="All Issues"
          description="Browse the published digital editions archive from Sivubela Intuthuko."
          path="/issues"
          image="/social-share-default.jpg"
          type="website"
          keywords={["issues", "digital editions", "newspaper archive", "Sivubela Intuthuko"]}
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
                Issues
              </span>
            </div>
          </div>
        </div>

        <div className="hidden border-b border-slate-200 bg-white lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
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

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            No published issues found.
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="All Issues"
        description="Browse the published digital editions archive from Sivubela Intuthuko."
        path="/issues"
        image="/social-share-default.jpg"
        type="website"
        keywords={["issues", "digital editions", "newspaper archive", "Sivubela Intuthuko"]}
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
              Issues
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <Link to="/" className="transition hover:text-slate-900">
              Home
            </Link>
            <span className="text-slate-400">•</span>
            <span className="text-slate-900">Issues Archive</span>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
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

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 border border-slate-200 bg-white p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Digital Editions Archive
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
                All Issues
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Browse the published Sivubela Intuthuko editions, open the latest
                newspaper, and explore the archive by cover.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Published
                </div>
                <div className="mt-1 text-xl font-black text-slate-900">
                  {issues.length}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Current Edition
                </div>
                <div className="mt-1 text-xl font-black text-slate-900">
                  {getIssueNumber(featuredIssue) || "Latest"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {featuredIssue ? (
          <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Link
              to={`/issues/${featuredIssue.slug}`}
              className="group overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300 lg:col-span-8"
            >
              <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_1fr]">
                <div className="bg-slate-100">
                  {getIssueThumbnailUrl(featuredIssue) ? (
                    <img
                      src={getAssetUrl(getIssueThumbnailUrl(featuredIssue))}
                      alt={featuredIssue.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center bg-slate-100 text-sm text-slate-400">
                      No cover
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center p-5 md:p-7">
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-white">
                      Current Edition
                    </span>

                    {getIssueNumber(featuredIssue) ? (
                      <span>Issue {getIssueNumber(featuredIssue)}</span>
                    ) : null}

                    {getIssueDate(featuredIssue) ? (
                      <span>• {formatDate(getIssueDate(featuredIssue))}</span>
                    ) : null}
                  </div>

                  <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900 transition group-hover:text-slate-700 md:text-4xl">
                    {featuredIssue.title}
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                    {getIssueDescription(featuredIssue)}
                  </p>

                  <div className="mt-6 inline-flex items-center text-sm font-semibold text-slate-900">
                    Open digital edition →
                  </div>
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-1 gap-4 lg:col-span-4">
              <div className="border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  This Edition
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
              </div>

              <div className="border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Archive
                </div>

                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  Cover-first edition shelf
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Every issue below is shown like an edition cover, so readers
                  immediately understand they are browsing newspapers, not stories.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Archive Shelf
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Past Editions
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {visibleArchiveIssues.map((issue) => {
              const imageUrl = getIssueThumbnailUrl(issue);

              return (
                <Link
                  key={issue.id}
                  to={`/issues/${issue.slug}`}
                  className="group overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="relative bg-slate-100">
                    {imageUrl ? (
                      <img
                        src={getAssetUrl(imageUrl)}
                        alt={issue.title}
                        className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] items-center justify-center bg-slate-100 text-sm text-slate-400">
                        No cover
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
                      <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                        {getIssueNumber(issue)
                          ? `Issue ${getIssueNumber(issue)}`
                          : "Edition"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {getIssueDate(issue) ? (
                        <span>{formatDate(getIssueDate(issue))}</span>
                      ) : null}
                    </div>

                    <h3 className="line-clamp-2 text-base font-black leading-6 tracking-tight text-slate-900 transition group-hover:text-slate-700 md:text-lg">
                      {issue.title}
                    </h3>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                        Digital Edition
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        Open →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {hasMoreIssues ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((prev) =>
                    Math.min(prev + LOAD_MORE_COUNT, archiveIssues.length)
                  )
                }
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 md:w-auto"
              >
                Load more issues
              </button>
            </div>
          ) : null}
        </section>
      </div>

      {issueSponsorStrip ? (
        <section className="pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="border-t border-slate-200 pt-8">
              <div className="mx-auto max-w-5xl">
                <PromoBlock placement={issueSponsorStrip} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </div>
  );
}