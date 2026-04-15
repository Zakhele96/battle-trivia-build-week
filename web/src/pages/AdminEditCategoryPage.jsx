import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";
import AdminNotice from "../components/AdminNotice";
import { getAdminCategoryById, updateCategory } from "../api/categoriesApi";

export default function AdminEditCategoryPage() {
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [category, setCategory] = useState(null);

  useEffect(() => {
    loadCategory();
  }, [id]);

  async function loadCategory() {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const data = await getAdminCategoryById(id);
      setCategory(data);
      setForm({
        name: data?.name || "",
        description: data?.description || "",
        sortOrder: data?.sortOrder ?? 0,
        isActive: !!data?.isActive,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load category.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const updated = await updateCategory(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: !!form.isActive,
      });

      setCategory(updated);
      setSuccessMessage("Category updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update category.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminPageShell
      title="Edit Category"
      description="Update category details used across the newsroom and public site."
      actions={
        <Link
          to="/admin/categories"
          className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          Back to Categories
        </Link>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {error ? <AdminNotice type="error">{error}</AdminNotice> : null}
        {successMessage ? <AdminNotice type="success">{successMessage}</AdminNotice> : null}

        <AdminCard>
          {loading ? (
            <div className="text-sm text-neutral-600">Loading category...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {category?.slug ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                  <strong>Slug:</strong> {category.slug}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
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

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  value={form.sortOrder}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

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

              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </AdminCard>
      </div>
    </AdminPageShell>
  );
}