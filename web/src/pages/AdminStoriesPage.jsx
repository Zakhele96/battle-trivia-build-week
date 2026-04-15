import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteStory,
  getAdminStories,
  publishStory,
  unpublishStory,
} from "../api/storiesApi";

const STORY_CATEGORIES = [
  "News",
  "Politics",
  "Community",
  "Sport",
  "Business",
  "Lifestyle",
  "Entertainment",
  "Opinion",
  "Education",
  "Health",
  "Technology",
  "Travel",
];

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

export default function AdminStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState("");
  const [busyActionId, setBusyActionId] = useState(null);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminStories();
      setStories(Array.isArray(data) ? data : []);
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

  async function handlePublish(storyId) {
    try {
      setBusyActionId(storyId);
      setActionMessage("");
      setError("");
      await publishStory(storyId);
      setActionMessage("Story published successfully.");
      await loadStories();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to publish story."
      );
    } finally {
      setBusyActionId(null);
    }
  }

  async function handleUnpublish(storyId) {
    try {
      setBusyActionId(storyId);
      setActionMessage("");
      setError("");
      await unpublishStory(storyId);
      setActionMessage("Story unpublished successfully.");
      await loadStories();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to unpublish story."
      );
    } finally {
      setBusyActionId(null);
    }
  }

  async function handleDelete(story) {
    const confirmed = window.confirm(
      `Delete "${story.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setBusyActionId(story.id);
      setActionMessage("");
      setError("");
      await deleteStory(story.id);
      setActionMessage("Story deleted successfully.");
      setStories((prev) => prev.filter((item) => item.id !== story.id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to delete story."
      );
    } finally {
      setBusyActionId(null);
    }
  }

  const filteredStories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return stories.filter((story) => {
      const matchesSearch =
        !term ||
        story.title?.toLowerCase().includes(term) ||
        story.slug?.toLowerCase().includes(term) ||
        story.authorName?.toLowerCase().includes(term) ||
        story.category?.toLowerCase().includes(term) ||
        story.summary?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && story.isPublished) ||
        (statusFilter === "draft" && !story.isPublished);

      const matchesCategory =
        categoryFilter === "all" || story.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [stories, searchTerm, statusFilter, categoryFilter]);

  const publishedCount = useMemo(
    () => stories.filter((story) => !!story.isPublished).length,
    [stories]
  );

  const draftCount = stories.length - publishedCount;

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString();
  }

  function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Stories</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Manage stories, publish state, search faster, and clean up content
              from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/stories/create"
              className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Create Story
            </Link>

            <Link
              to="/admin/stories/media"
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Media Library
            </Link>

            <button
              type="button"
              onClick={loadStories}
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {actionMessage}
          </div>
        ) : null}

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_220px_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, slug, author, summary, or category"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft / Unpublished</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              >
                <option value="all">All Categories</option>
                {STORY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <div className="rounded-full bg-neutral-100 px-4 py-2 text-neutral-700">
              Total: <span className="font-semibold">{stories.length}</span>
            </div>
            <div className="rounded-full bg-green-50 px-4 py-2 text-green-700">
              Published: <span className="font-semibold">{publishedCount}</span>
            </div>
            <div className="rounded-full bg-amber-50 px-4 py-2 text-amber-800">
              Drafts: <span className="font-semibold">{draftCount}</span>
            </div>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">
              Showing:{" "}
              <span className="font-semibold">{filteredStories.length}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
            Loading stories...
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
            No stories found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStories.map((story) => {
              const summaryText =
                story.summary?.trim() || stripHtml(story.bodyHtml).slice(0, 180);

              const isBusy = busyActionId === story.id;

              return (
                <div
                  key={story.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="hidden shrink-0 overflow-hidden rounded-2xl bg-neutral-100 sm:block">
                        {story.heroImageUrl ? (
                          <img
                            src={getAssetUrl(story.heroImageUrl)}
                            alt={story.title}
                            className="h-24 w-24 object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center text-xs text-neutral-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                            #{story.id}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              story.isPublished
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {story.isPublished ? "Published" : "Draft"}
                          </span>

                          {story.category ? (
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                              {story.category}
                            </span>
                          ) : null}
                        </div>

                        <h2 className="text-xl font-bold text-neutral-900">
                          {story.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600">
                          <span>
                            <strong>Slug:</strong> {story.slug || "—"}
                          </span>
                          <span>
                            <strong>Author:</strong> {story.authorName || "—"}
                          </span>
                          <span>
                            <strong>Published:</strong> {formatDate(story.publishDate)}
                          </span>
                          <span>
                            <strong>Updated:</strong> {formatDate(story.updatedAt)}
                          </span>
                        </div>

                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-700">
                          {summaryText || "No summary available."}
                        </p>

                        {story.heroImageUrl ? (
                          <div className="mt-3 text-xs text-neutral-500">
                            <strong>Hero image:</strong> {story.heroImageUrl}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[180px]">
                      <Link
                        to={`/admin/stories/${story.id}/edit`}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Edit
                      </Link>

                      {story.slug ? (
                        <Link
                          to={`/stories/${story.slug}`}
                          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Open Public
                        </Link>
                      ) : null}

                      {!story.isPublished ? (
                        <button
                          type="button"
                          onClick={() => handlePublish(story.id)}
                          disabled={isBusy}
                          className="rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy ? "Working..." : "Publish"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUnpublish(story.id)}
                          disabled={isBusy}
                          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy ? "Working..." : "Unpublish"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(story)}
                        disabled={isBusy}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? "Working..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}