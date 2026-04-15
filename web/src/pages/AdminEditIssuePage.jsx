import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAdminIssueById, updateIssue } from "../api/issuesApi";
import { validateIssueForPublish } from "../utils/contentValidation";

function toDateTimeLocalString(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

export default function AdminEditIssuePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [description, setDescription] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const checklistItems = [
    { label: "Title", done: !!title.trim() },
    { label: "Issue number", done: !!String(issueNumber).trim() },
    { label: "Description", done: !!description.trim() },
    { label: "Publish date", done: !!publishDate.trim() },
    { label: "Cover / thumbnail", done: !!thumbnailUrl.trim() },
  ];

  useEffect(() => {
    async function loadIssue() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const data = await getAdminIssueById(id);

        setIssue(data);
        setTitle(data?.title || "");
        setIssueNumber(data?.issueNumber || data?.issue_number || "");
        setDescription(data?.description || "");
        setPublishDate(toDateTimeLocalString(data?.publishDate || data?.publish_date));
        setIsPublished(!!data?.isPublished);
        setThumbnailUrl(getIssueThumbnailUrl(data));
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            "Failed to load issue."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadIssue();
    }
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!String(issueNumber).trim()) {
      setError("Issue number is required.");
      return;
    }

    const issueErrors = isPublished
      ? validateIssueForPublish({
          title,
          issueNumber,
          description,
          publishDate,
          thumbnailUrl,
        })
      : [];

    if (issueErrors.length > 0) {
      setError(issueErrors[0]);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        issueNumber: String(issueNumber).trim(),
        description: description.trim() || null,
        publishDate: publishDate ? new Date(publishDate).toISOString() : null,
        isPublished,
      };

      const updated = await updateIssue(id, payload);

      setIssue(updated);
      setThumbnailUrl(getIssueThumbnailUrl(updated) || thumbnailUrl);
      setSuccess("Issue updated successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to update issue."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-10 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
          Loading issue...
        </div>
      </div>
    );
  }

  if (error && !issue) {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Edit Issue</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Update issue details, publish settings, and preview the generated cover.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/issues"
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Back to Issues
            </Link>

            {issue?.slug ? (
              <button
                type="button"
                onClick={() => navigate(`/issues/${issue.slug}`)}
                className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Open Public Issue
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Issue title"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Issue Number
                </label>
                <input
                  type="text"
                  value={issueNumber}
                  onChange={(event) => setIssueNumber(event.target.value)}
                  placeholder="e.g. 171"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  value={publishDate}
                  onChange={(event) => setPublishDate(event.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  placeholder="Short description for this issue"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Cover / Thumbnail Preview
                </label>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  {thumbnailUrl ? (
                    <img
                      src={getAssetUrl(thumbnailUrl)}
                      alt={title || "Issue thumbnail"}
                      className="h-64 w-full rounded-2xl bg-white object-contain p-2 ring-1 ring-black/5"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-sm text-neutral-500">
                      No generated cover available yet
                    </div>
                  )}

                  <div className="mt-3 text-xs text-neutral-500">
                    The cover is usually generated from the uploaded PDF and is not edited from this screen.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <input
                id="isPublished"
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label
                htmlFor="isPublished"
                className="text-sm font-medium text-neutral-800"
              >
                Published
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/issues")}
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Publish Checklist
            </div>

            <div className="mt-4 space-y-2 text-sm text-neutral-700">
              {checklistItems.map((item) => (
                <div key={item.label}>
                  {item.done ? "✓" : "•"} {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}