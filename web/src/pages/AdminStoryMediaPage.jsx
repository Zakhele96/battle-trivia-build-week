import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  cleanupOrphanStoryImages,
  deleteStoryImage,
  getStoryImages,
  uploadStoryImage,
} from "../api/storiesApi";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

export default function AdminStoryMediaPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    try {
      setLoading(true);
      setError("");

      const data = await getStoryImages();
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load media library."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");
      setMessage("");

      await uploadStoryImage(file);
      setMessage("Image uploaded successfully.");
      await loadImages();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to upload image."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(image) {
    const confirmed = window.confirm(
      `Delete "${image.originalFileName}"?\n\nThis only works if the image is not used by any story.`
    );

    if (!confirmed) return;

    try {
      setBusyId(image.id);
      setError("");
      setMessage("");

      await deleteStoryImage(image.id);
      setMessage("Image deleted successfully.");
      setImages((prev) => prev.filter((item) => item.id !== image.id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to delete image."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleCleanupOrphans() {
    try {
      setCleaning(true);
      setError("");
      setMessage("");

      const result = await cleanupOrphanStoryImages(12);
      setMessage(`Cleanup finished. Deleted ${result?.deletedCount ?? 0} orphan image(s).`);
      await loadImages();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to cleanup orphan images."
      );
    } finally {
      setCleaning(false);
    }
  }

  async function handleCopyUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Image URL copied.");
    } catch {
      setMessage("");
    }
  }

  const filteredImages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return images.filter((image) => {
      const matchesSearch =
        !term ||
        image.originalFileName?.toLowerCase().includes(term) ||
        image.imageUrl?.toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" ||
        (filter === "used" && image.inUseCount > 0) ||
        (filter === "orphans" && image.inUseCount === 0);

      return matchesSearch && matchesFilter;
    });
  }, [images, searchTerm, filter]);

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Story Media Library</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Upload processed hero images, manage your library, and cleanup unused files.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/stories"
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Back to Stories
            </Link>

            <button
              type="button"
              onClick={handleCleanupOrphans}
              disabled={cleaning}
              className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cleaning ? "Cleaning..." : "Cleanup Orphans"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search filename or URL"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Filter
              </label>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              >
                <option value="all">All</option>
                <option value="used">Used</option>
                <option value="orphans">Orphans</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Upload
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUpload}
                disabled={uploading}
                className="block w-full text-sm text-neutral-700 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
            Loading media library...
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
            No images found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredImages.map((image) => {
              const previewSrc = getAssetUrl(image.thumbUrl || image.imageUrl);
              const isBusy = busyId === image.id;
              const isInUse = image.inUseCount > 0;

              return (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                >
                  <div className="aspect-[16/10] bg-neutral-200">
                    <img
                      src={previewSrc}
                      alt={image.originalFileName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                        #{image.id}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isInUse
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isInUse ? `Used (${image.inUseCount})` : "Orphan"}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-neutral-900">
                      {image.originalFileName}
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-neutral-500">
                      <div>{image.width} × {image.height}</div>
                      <div>{formatBytes(image.fileSizeBytes)}</div>
                      <div>{formatDate(image.createdAt)}</div>
                    </div>

                    <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600 break-all">
                      {image.imageUrl}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(image.imageUrl)}
                        className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Copy URL
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(image)}
                        disabled={isBusy || isInUse}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? "Deleting..." : "Delete"}
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