import { useEffect, useState } from "react";
import { createStory, uploadStoryImage } from "../api/storiesApi";
import { Link } from "react-router-dom";
import StoryImagePickerModal from "../components/StoryImagePickerModal";
import { validateStoryForPublish } from "../utils/contentValidation";
import { getPublicCategories } from "../api/categoriesApi";

const initialForm = {
  title: "",
  summary: "",
  bodyHtml: "",
  heroImageUrl: "",
  authorName: "",
  category: "",
  publishDate: "",
  isPublished: false,
  isSponsored: false,
  sponsorName: "",
  sponsorLabel: "",
};

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

export default function AdminCreateStoryPage() {
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdStory, setCreatedStory] = useState(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      const data = await getPublicCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }

  const checklistItems = [
    { label: "Title", done: !!form.title?.trim() },
    { label: "Summary", done: !!form.summary?.trim() },
    { label: "Body content", done: !!form.bodyHtml?.trim() },
    { label: "Hero image", done: !!form.heroImageUrl?.trim() },
    { label: "Author", done: !!form.authorName?.trim() },
    { label: "Category", done: !!form.category?.trim() },
    { label: "Publish date", done: !!form.publishDate?.trim() },
  ];

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleImageSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError("");
      setSuccessMessage("");

      const result = await uploadStoryImage(file);

      setForm((prev) => ({
        ...prev,
        heroImageUrl: result.imageUrl || "",
      }));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to upload image."
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setCreatedStory(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!form.bodyHtml.trim()) {
      setError("Body HTML is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    const storyErrors = form.isPublished ? validateStoryForPublish(form) : [];

    if (storyErrors.length > 0) {
      setError(storyErrors[0]);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        bodyHtml: form.bodyHtml.trim(),
        heroImageUrl: form.heroImageUrl.trim() || null,
        authorName: form.authorName.trim() || null,
        category: form.category.trim(),
        publishDate: form.publishDate
          ? new Date(form.publishDate).toISOString()
          : null,
        isPublished: form.isPublished,
        isSponsored: !!form.isSponsored,
        sponsorName: form.sponsorName.trim() || null,
        sponsorLabel: form.sponsorLabel.trim() || null,
      };

      const created = await createStory(payload);

      setCreatedStory(created);
      setSuccessMessage("Story created successfully.");
      setForm(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to create story."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Create Story
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Add a new story and upload a hero image before publishing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/stories"
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Back to Stories
              </Link>

              <Link
                to="/admin/stories/media"
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Open Media Library
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
              {createdStory ? (
                <div className="mt-2 text-xs text-green-800">
                  <div>
                    <strong>ID:</strong> {createdStory.id}
                  </div>
                  <div>
                    <strong>Slug:</strong> {createdStory.slug}
                  </div>
                </div>
              ) : null}
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
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Story title"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Summary
                  </label>
                  <textarea
                    name="summary"
                    value={form.summary}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Short summary or excerpt"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Body HTML
                  </label>
                  <textarea
                    name="bodyHtml"
                    value={form.bodyHtml}
                    onChange={handleChange}
                    rows={16}
                    placeholder="<p>Your story body...</p>"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-neutral-800">
                      Hero Image
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsImagePickerOpen(true)}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                    >
                      Choose From Library
                    </button>
                  </div>

                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageSelected}
                      disabled={uploadingImage}
                      className="block w-full text-sm text-neutral-700 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
                    />

                    <p className="mt-3 text-xs text-neutral-500">
                      JPG, PNG, or WEBP. Max 5MB.
                    </p>

                    {uploadingImage ? (
                      <div className="mt-3 text-sm text-neutral-600">
                        Uploading image...
                      </div>
                    ) : null}

                    {form.heroImageUrl ? (
                      <div className="mt-4">
                        <div className="mb-2 text-xs font-medium text-neutral-600">
                          Uploaded image
                        </div>
                        <img
                          src={getAssetUrl(form.heroImageUrl)}
                          alt="Hero preview"
                          className="h-48 w-full rounded-2xl object-cover ring-1 ring-black/5"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              heroImageUrl: "",
                            }))
                          }
                          className="mt-3 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Hero Image URL
                  </label>
                  <input
                    type="text"
                    name="heroImageUrl"
                    value={form.heroImageUrl}
                    readOnly
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Author Name
                  </label>
                  <input
                    type="text"
                    name="authorName"
                    value={form.authorName}
                    onChange={handleChange}
                    placeholder="Reporter name"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    disabled={loadingCategories}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500 disabled:bg-neutral-50"
                  >
                    <option value="">
                      {loadingCategories ? "Loading categories..." : "Select category"}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    name="publishDate"
                    value={form.publishDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>

                <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Sponsorship
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <input
                      id="isSponsored"
                      type="checkbox"
                      name="isSponsored"
                      checked={form.isSponsored}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    <label
                      htmlFor="isSponsored"
                      className="text-sm font-medium text-neutral-800"
                    >
                      Mark this story as sponsored
                    </label>
                  </div>

                  {form.isSponsored ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-800">
                          Sponsor Name
                        </label>
                        <input
                          type="text"
                          name="sponsorName"
                          value={form.sponsorName}
                          onChange={handleChange}
                          placeholder="Brand or partner name"
                          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-800">
                          Sponsor Label
                        </label>
                        <input
                          type="text"
                          name="sponsorLabel"
                          value={form.sponsorLabel}
                          onChange={handleChange}
                          placeholder="Sponsored"
                          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <input
                  id="isPublished"
                  type="checkbox"
                  name="isPublished"
                  checked={form.isPublished}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <label
                  htmlFor="isPublished"
                  className="text-sm font-medium text-neutral-800"
                >
                  Publish immediately
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting || uploadingImage || loadingCategories}
                  className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Story"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    setError("");
                    setSuccessMessage("");
                    setCreatedStory(null);
                  }}
                  className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                >
                  Reset
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

      <StoryImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        selectedImageUrl={form.heroImageUrl}
        onSelect={(image) =>
          setForm((prev) => ({
            ...prev,
            heroImageUrl: image.imageUrl || "",
          }))
        }
      />
    </>
  );
}