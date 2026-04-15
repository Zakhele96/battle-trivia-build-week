import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";
import AdminNotice from "../components/AdminNotice";
import {
  deactivateCategory,
  getAdminCategories,
  reactivateCategory,
} from "../api/categoriesApi";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadCategories();
  }, [statusFilter]);

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminCategories(searchTerm.trim(), statusFilter);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    await loadCategories();
  }

  async function handleDeactivate(category) {
    const confirmed = window.confirm(`Deactivate "${category.name}"?`);
    if (!confirmed) return;

    try {
      setBusyId(category.id);
      setError("");
      setSuccessMessage("");
      const result = await deactivateCategory(category.id);
      setSuccessMessage(result?.message || "Category deactivated successfully.");
      await loadCategories();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to deactivate category.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReactivate(category) {
    try {
      setBusyId(category.id);
      setError("");
      setSuccessMessage("");
      const result = await reactivateCategory(category.id);
      setSuccessMessage(result?.message || "Category reactivated successfully.");
      await loadCategories();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to reactivate category.");
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = useMemo(
    () => categories.filter((item) => item.isActive).length,
    [categories]
  );

  const inactiveCount = categories.length - activeCount;

  return (
    <AdminPageShell
      title="Categories"
      description="Manage story categories from admin instead of hardcoded lists."
      actions={
        <>
          <Link
            to="/admin/categories/create"
            className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Create Category
          </Link>

          <button
            type="button"
            onClick={loadCategories}
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
        {successMessage ? <AdminNotice type="success">{successMessage}</AdminNotice> : null}

        <AdminCard>
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_auto]"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, slug, or description"
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
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              >
                <option value="all">All</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <div className="rounded-full bg-neutral-100 px-4 py-2 text-neutral-700">
              Total: <span className="font-semibold">{categories.length}</span>
            </div>
            <div className="rounded-full bg-green-50 px-4 py-2 text-green-700">
              Active: <span className="font-semibold">{activeCount}</span>
            </div>
            <div className="rounded-full bg-amber-50 px-4 py-2 text-amber-800">
              Inactive: <span className="font-semibold">{inactiveCount}</span>
            </div>
          </div>
        </AdminCard>

        {loading ? (
          <AdminCard>
            <div className="p-4 text-center text-sm text-neutral-600">Loading categories...</div>
          </AdminCard>
        ) : categories.length === 0 ? (
          <AdminCard>
            <div className="p-4 text-center text-sm text-neutral-600">No categories found.</div>
          </AdminCard>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const isBusy = busyId === category.id;

              return (
                <AdminCard key={category.id}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                          #{category.id}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            category.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>

                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                          {category.slug}
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-neutral-900">{category.name}</h2>

                      {category.description ? (
                        <p className="mt-3 text-sm leading-6 text-neutral-600">
                          {category.description}
                        </p>
                      ) : null}

                      <div className="mt-3 text-sm text-neutral-500">
                        Sort order: {category.sortOrder}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[180px]">
                      <Link
                        to={`/admin/categories/${category.id}/edit`}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Edit
                      </Link>

                      {category.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(category)}
                          disabled={isBusy}
                          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy ? "Working..." : "Deactivate"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(category)}
                          disabled={isBusy}
                          className="rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy ? "Working..." : "Reactivate"}
                        </button>
                      )}
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