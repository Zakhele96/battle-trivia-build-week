import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";
import AdminNotice from "../components/AdminNotice";
import { createCategory } from "../api/categoriesApi";

const initialForm = {
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminCreateCategoryPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

      const created = await createCategory({
        name: form.name.trim(),
        description: form.description.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: !!form.isActive,
      });

      navigate(`/admin/categories/${created.id}/edit`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminPageShell
      title="Create Category"
      description="Add a new category for stories and public navigation."
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

        <AdminCard>
          <form onSubmit={handleSubmit} className="space-y-5">
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
              {submitting ? "Creating..." : "Create Category"}
            </button>
          </form>
        </AdminCard>
      </div>
    </AdminPageShell>
  );
}