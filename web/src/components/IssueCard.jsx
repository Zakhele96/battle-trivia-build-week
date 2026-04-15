import { Link } from "react-router-dom";


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
  return issue?.publishDate || issue?.publish_date || issue?.createdAt || issue?.created_at || "";
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

function getIssueNumber(issue) {
  return issue?.issueNumber || issue?.issue_number || "";
}

function getPageCount(issue) {
  return issue?.pageCount || issue?.page_count || "";
}

export default function IssueCard({ issue }) {
  const thumbnailUrl = getIssueThumbnailUrl(issue);
  const issueNumber = getIssueNumber(issue);
  const pageCount = getPageCount(issue);
  const publishDate = getIssueDate(issue);

  return (
    <Link
      to={`/issues/${issue.slug}`}
      className="group block overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="relative bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={getAssetUrl(thumbnailUrl)}
            alt={issue.title}
            className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center bg-slate-100 text-sm text-slate-400">
            No thumbnail
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {issueNumber ? (
            <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
              Issue {issueNumber}
            </span>
          ) : (
            <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
              Edition
            </span>
          )}

          {issue.isLatest ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-900 backdrop-blur">
              Latest
            </span>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {publishDate ? <span>{formatDate(publishDate)}</span> : null}
          {publishDate && pageCount ? <span>•</span> : null}
          {pageCount ? <span>{pageCount} pages</span> : null}
        </div>

        <h3 className="line-clamp-2 text-lg font-black leading-7 tracking-tight text-slate-900 transition group-hover:text-slate-700">
          {issue.title}
        </h3>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Digital Edition
          </span>

          <span className="text-sm font-semibold text-slate-900">
            Open →
          </span>
        </div>
      </div>
    </Link>
  );
}