import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";
import AdminNotice from "../components/AdminNotice";
import StoryImagePickerModal from "../components/StoryImagePickerModal";
import { createPlacement, uploadPlacementImage } from "../api/placementsApi";

const PLACEMENT_KEYS = [
  { value: "homepage_hero_promo", label: "Homepage Hero Promo" },
  { value: "homepage_inline_banner", label: "Homepage Inline Banner" },
  { value: "story_sidebar_partner", label: "Story Sidebar Partner" },
  { value: "issue_sponsor_strip", label: "Issue Sponsor Strip" },
];

const initialForm = {
  title: "",
  placementKey: "homepage_hero_promo",
  imageUrl: "",
  targetUrl: "",
  label: "Sponsored",
  description: "",
  sponsorName: "",
  isSponsored: true,
  isActive: true,
  startsAt: "",
  endsAt: "",
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

export default function AdminCreatePlacementPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

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

      const result = await uploadPlacementImage(file);

      setForm((prev) => ({
        ...prev,
        imageUrl: result.imageUrl || "",
      }));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to upload placement image."
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const created = await createPlacement({
        title: form.title.trim(),
        placementKey: form.placementKey,
        imageUrl: form.imageUrl.trim() || null,
        targetUrl: form.targetUrl.trim() || null,
        label: form.label.trim() || null,
        description: form.description.trim() || null,
        sponsorName: form.sponsorName.trim() || null,
        isSponsored: !!form.isSponsored,
        isActive: !!form.isActive,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      });

      navigate(`/admin/placements/${created.id}/edit`, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create placement."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AdminPageShell
        title="Create Placement"
        description="Create a homepage promo, ad slot, or partner placement."
        actions={
          <Link
            to="/admin/placements"
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Back to Placements
          </Link>
        }
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {error ? <AdminNotice type="error">{error}</AdminNotice> : null}

          <AdminCard>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Placement Key
                </label>
                <select
                  name="placementKey"
                  value={form.placementKey}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                >
                  {PLACEMENT_KEYS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-neutral-800">
                    Placement Image
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

                  {form.imageUrl ? (
                    <div className="mt-4">
                      <div className="mb-2 text-xs font-medium text-neutral-600">
                        Current image
                      </div>
                      <img
                        src={getAssetUrl(form.imageUrl)}
                        alt="Placement preview"
                        className="h-48 w-full rounded-2xl object-cover ring-1 ring-black/5"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            imageUrl: "",
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

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Image URL
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  value={form.imageUrl}
                  readOnly
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Target URL
                </label>
                <input
                  type="text"
                  name="targetUrl"
                  value={form.targetUrl}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Label
                  </label>
                  <input
                    type="text"
                    name="label"
                    value={form.label}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Sponsor Name
                  </label>
                  <input
                    type="text"
                    name="sponsorName"
                    value={form.sponsorName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    name="startsAt"
                    value={form.startsAt}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-800">
                    Ends At
                  </label>
                  <input
                    type="datetime-local"
                    name="endsAt"
                    value={form.endsAt}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                  <input
                    type="checkbox"
                    name="isSponsored"
                    checked={form.isSponsored}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  Sponsored
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  Active
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Placement"}
              </button>
            </form>
          </AdminCard>
        </div>
      </AdminPageShell>

      <StoryImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        selectedImageUrl={form.imageUrl}
        onSelect={(image) =>
          setForm((prev) => ({
            ...prev,
            imageUrl: image.imageUrl || "",
          }))
        }
      />
    </>
  );
}