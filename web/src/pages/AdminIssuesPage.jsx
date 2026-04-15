import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllIssues,
  publishIssue,
  unpublishIssue,
  deleteIssue,
} from "../api/issuesApi";
import { getFileUrl } from "../api/fileUrl";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";
import AdminNotice from "../components/AdminNotice";

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function loadIssues() {
    try {
      setLoading(true);
      setError("");
      const data = await getAllIssues();
      setIssues(normalizeArray(data));
    } catch (err) {
      console.error(err);
      setError("Failed to load issues.");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return issues.filter((issue) => {
      const issueNumber = String(issue.issueNumber ?? "").toLowerCase();

      const matchesSearch =
        !term ||
        issue.title?.toLowerCase().includes(term) ||
        issueNumber.includes(term) ||
        issue.slug?.toLowerCase().includes(term) ||
        issue.description?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && issue.isPublished) ||
        (statusFilter === "unpublished" && !issue.isPublished);

      return matchesSearch && matchesStatus;
    });
  }, [issues, searchTerm, statusFilter]);

  const publishedCount = useMemo(
    () => issues.filter((issue) => !!issue.isPublished).length,
    [issues]
  );

  const draftCount = issues.length - publishedCount;

  async function handlePublish(id) {
    try {
      setActionLoadingId(id);
      setActionMessage("");
      setError("");
      await publishIssue(id);
      await loadIssues();
      setActionMessage("Issue published successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to publish issue.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleUnpublish(id) {
    try {
      setActionLoadingId(id);
      setActionMessage("");
      setError("");
      await unpublishIssue(id);
      await loadIssues();
      setActionMessage("Issue unpublished successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to unpublish issue.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this issue?");
    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      setActionMessage("");
      setError("");
      await deleteIssue(id);
      await loadIssues();
      setActionMessage("Issue deleted successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to delete issue.");
    } finally {
      setActionLoadingId("");
    }
  }

  return (
    <AdminPageShell
      title="Manage Issues"
      description="Search, filter, publish, and maintain digital editions from one place."
      actions={
        <>
          <Link
            to="/admin/upload"
            className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Upload New
          </Link>

          <button
            type="button"
            onClick={loadIssues}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Refresh
          </button>
        </>
      }
      maxWidth="max-w-7xl"
    >
      <div className="space-y-4">
        {error ? <AdminNotice type="error">{error}</AdminNotice> : null}
        {actionMessage ? (
          <AdminNotice type="success">{actionMessage}</AdminNotice>
        ) : null}

        <AdminCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, issue number, slug, or description"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-500"
              >
                <option value="all">All issues</option>
                <option value="published">Published only</option>
                <option value="unpublished">Unpublished only</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <div className="rounded-full bg-neutral-100 px-4 py-2 text-neutral-700">
              Total: <span className="font-semibold">{issues.length}</span>
            </div>
            <div className="rounded-full bg-green-50 px-4 py-2 text-green-700">
              Published: <span className="font-semibold">{publishedCount}</span>
            </div>
            <div className="rounded-full bg-amber-50 px-4 py-2 text-amber-800">
              Drafts: <span className="font-semibold">{draftCount}</span>
            </div>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">
              Showing: <span className="font-semibold">{filteredIssues.length}</span>
            </div>
          </div>
        </AdminCard>

        {loading ? (
          <AdminCard>
            <div className="p-4 text-center text-sm text-neutral-600">
              Loading issues...
            </div>
          </AdminCard>
        ) : filteredIssues.length === 0 ? (
          <AdminCard>
            <div className="p-4 text-center text-sm text-neutral-600">
              No issues match your search or filter.
            </div>
          </AdminCard>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => {
              const isBusy = actionLoadingId === issue.id;

              return (
                <AdminCard key={issue.id}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="hidden shrink-0 overflow-hidden rounded-2xl bg-neutral-100 sm:block">
                        {issue.thumbnailUrl ? (
                          <img
                            src={getFileUrl(issue.thumbnailUrl)}
                            alt={issue.title}
                            className="h-24 w-20 bg-white object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-24 w-20 items-center justify-center text-xs text-neutral-400">
                            No thumb
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                            #{issue.id}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              issue.isPublished
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {issue.isPublished ? "Published" : "Draft"}
                          </span>

                          {issue.status ? (
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                              {issue.status}
                            </span>
                          ) : null}
                        </div>

                        <h2 className="text-xl font-bold text-neutral-900">
                          {issue.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600">
                          <span>
                            <strong>Slug:</strong> {issue.slug || "—"}
                          </span>
                          <span>
                            <strong>Issue:</strong> {issue.issueNumber || "—"}
                          </span>
                          <span>
                            <strong>Pages:</strong> {issue.pageCount ?? "—"}
                          </span>
                          <span>
                            <strong>Published:</strong> {formatDate(issue.publishDate)}
                          </span>
                        </div>

                        {issue.description ? (
                          <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-700">
                            {issue.description}
                          </p>
                        ) : null}

                        {issue.thumbnailUrl ? (
                          <div className="mt-3 text-xs text-neutral-500">
                            <strong>Thumbnail:</strong> {issue.thumbnailUrl}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[180px]">
                      <Link
                        to={`/admin/issues/${issue.id}/edit`}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Edit
                      </Link>

                      {issue.slug ? (
                        <Link
                          to={`/issues/${issue.slug}`}
                          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Open Public
                        </Link>
                      ) : null}

                      {issue.isPublished ? (
                        <button
                          onClick={() => handleUnpublish(issue.id)}
                          disabled={isBusy}
                          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Working..." : "Unpublish"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublish(issue.id)}
                          disabled={isBusy}
                          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Working..." : "Publish"}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(issue.id)}
                        disabled={isBusy}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? "Working..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </AdminCard>
              );
            })}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}