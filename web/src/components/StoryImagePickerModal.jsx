import { useEffect, useMemo, useRef, useState } from "react";
import { getStoryImages } from "../api/storiesApi";

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

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default function StoryImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedImageUrl,
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const selectedImageRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    loadImages();
  }, [isOpen]);

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

  const filteredImages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = !term
      ? images
      : images.filter((image) => {
          return (
            image.originalFileName?.toLowerCase().includes(term) ||
            image.imageUrl?.toLowerCase().includes(term)
          );
        });

    const selected = filtered.find(
      (image) => image.imageUrl === selectedImageUrl
    );
    const remaining = filtered.filter(
      (image) => image.imageUrl !== selectedImageUrl
    );

    return selected ? [selected, ...remaining] : remaining;
  }, [images, searchTerm, selectedImageUrl]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedImageUrl) return;
    if (loading) return;

    const timer = setTimeout(() => {
      selectedImageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, selectedImageUrl, loading, filteredImages.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Choose From Media Library
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Pick an existing image for the story hero image.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Close
          </button>
        </div>

        <div className="border-b border-neutral-200 px-6 py-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search filename or URL"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="rounded-2xl bg-neutral-50 p-10 text-center text-sm text-neutral-600">
              Loading images...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="rounded-2xl bg-neutral-50 p-10 text-center text-sm text-neutral-600">
              No images found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredImages.map((image) => {
                const previewSrc = getAssetUrl(image.thumbUrl || image.imageUrl);
                const isSelected = image.imageUrl === selectedImageUrl;

                return (
                  <div
                    key={image.id}
                    ref={isSelected ? selectedImageRef : null}
                    className={`overflow-hidden rounded-2xl border bg-white ring-1 transition ${
                      isSelected
                        ? "border-neutral-900 ring-neutral-900/20 sm:col-span-2 xl:col-span-2"
                        : "border-neutral-200 ring-black/5"
                    }`}
                  >
                    <div
                      className={`bg-neutral-200 ${
                        isSelected ? "aspect-[16/9]" : "aspect-[16/10]"
                      }`}
                    >
                      <img
                        src={previewSrc}
                        alt={image.originalFileName}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                          #{image.id}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            image.inUseCount > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {image.inUseCount > 0
                            ? `Used (${image.inUseCount})`
                            : "Unused"}
                        </span>

                        {isSelected ? (
                          <span className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                            Current hero image
                          </span>
                        ) : null}
                      </div>

                      <div className="truncate text-sm font-semibold text-neutral-900">
                        {image.originalFileName}
                      </div>

                      <div className="mt-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            image.inUseCount > 0
                              ? "bg-green-50 text-green-700"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {image.inUseCount > 0
                            ? `Used by ${image.inUseCount} ${
                                image.inUseCount === 1 ? "story" : "stories"
                              }`
                            : "Not currently used"}
                        </span>
                      </div>

                      {image.inUseCount > 0 &&
                      Array.isArray(image.usedByStoryTitles) &&
                      image.usedByStoryTitles.length > 0 ? (
                        <div className="mt-3 rounded-xl bg-neutral-50 p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Used in
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {image.usedByStoryTitles.slice(0, 4).map((title) => (
                              <span
                                key={title}
                                className="rounded-full bg-white px-2.5 py-1 text-[11px] text-neutral-700 ring-1 ring-black/5"
                              >
                                {title}
                              </span>
                            ))}

                            {image.usedByStoryTitles.length > 4 ? (
                              <span className="rounded-full bg-neutral-200 px-2.5 py-1 text-[11px] text-neutral-700">
                                +{image.usedByStoryTitles.length - 4} more
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-2 text-xs text-neutral-500">
                        {image.width} × {image.height} •{" "}
                        {formatDate(image.createdAt)}
                      </div>

                      <div className="mt-3 rounded-xl bg-neutral-50 p-2 text-xs text-neutral-600 break-all">
                        {image.imageUrl}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelect(image);
                          onClose();
                        }}
                        className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium transition ${
                          isSelected
                            ? "bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
                            : "bg-neutral-900 text-white hover:bg-neutral-800"
                        }`}
                      >
                        {isSelected ? "Currently Selected" : "Use This Image"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}