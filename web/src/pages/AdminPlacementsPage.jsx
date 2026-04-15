import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";
import AdminNotice from "../components/AdminNotice";
import {
  deactivatePlacement,
  getAdminPlacements,
  reactivatePlacement,
} from "../api/placementsApi";

const PLACEMENT_KEYS = [
  { value: "all", label: "All placement keys" },
  { value: "homepage_hero_promo", label: "Homepage Hero Promo" },
  { value: "homepage_inline_banner", label: "Homepage Inline Banner" },
  { value: "story_sidebar_partner", label: "Story Sidebar Partner" },
  { value: "issue_sponsor_strip", label: "Issue Sponsor Strip" },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

export default function AdminPlacementsPage() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [placementKeyFilter, setPlacementKeyFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadPlacements();
  }, [statusFilter, placementKeyFilter]);

  async function loadPlacements() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminPlacements(
        searchTerm.trim(),
        statusFilter,
        placementKeyFilter
      );

      setPlacements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load placements."
      );
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    await loadPlacements();
  }

  async function handleDeactivate(placement) {
    const confirmed = window.confirm(`Deactivate "${placement.title}"?`);
    if (!confirmed) return;

    try {
      setBusyId(placement.id);
      setError("");
      setSuccessMessage("");

      const result = await deactivatePlacement(placement.id);
      setSuccessMessage(result?.message || "Placement deactivated successfully.");
      await loadPlacements();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to deactivate placement."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReactivate(placement) {
    try {
      setBusyId(placement.id);
      setError("");
      setSuccessMessage("");

      const result = await reactivatePlacement(placement.id);
      setSuccessMessage(result?.message || "Placement reactivated successfully.");
      await loadPlacements();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reactivate placement."
      );
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = useMemo(
    () => placements.filter((item) => item.isActive).length,
    [placements]
  );

  const inactiveCount = placements.length - activeCount;

  return (
    <AdminPageShell
      title="Placements"
      description="Manage homepage promos, ad slots, and reusable partner placements."
      actions={
        <>
          <Link
            to="/admin/placements/create"
            className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Create Placement
          </Link>

          <button
            type="button"
            onClick={loadPlacements}
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
            className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_260px_auto]"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, placement key, or sponsor"
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

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                Placement Key
              </label>
              <select
                value={placementKeyFilter}
                onChange={(event) => setPlacementKeyFilter(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
              >
                {PLACEMENT_KEYS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
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
              Total: <span className="font-semibold">{placements.length}</span>
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
            <div className="p-4 text-center text-sm text-neutral-600">
              Loading placements...
            </div>
          </AdminCard>
        ) : placements.length === 0 ? (
          <AdminCard>
            <div className="p-4 text-center text-sm text-neutral-600">
              No placements found.
            </div>
          </AdminCard>
        ) : (
          <div className="space-y-4">
            {placements.map((placement) => {
              const isBusy = busyId === placement.id;

              return (
                <AdminCard key={placement.id}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                          #{placement.id}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            placement.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {placement.isActive ? "Active" : "Inactive"}
                        </span>

                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                          {placement.placementKey}
                        </span>

                        {placement.isSponsored ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {placement.label || "Sponsored"}
                          </span>
                        ) : null}
                      </div>

                      <h2 className="text-xl font-bold text-neutral-900">
                        {placement.title}
                      </h2>

                      {placement.description ? (
                        <p className="mt-3 text-sm leading-6 text-neutral-600">
                          {placement.description}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-500">
                        <span>
                          <strong>Starts:</strong> {formatDate(placement.startsAt)}
                        </span>
                        <span>
                          <strong>Ends:</strong> {formatDate(placement.endsAt)}
                        </span>
                        <span>
                          <strong>Sponsor:</strong> {placement.sponsorName || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[180px]">
                      <Link
                        to={`/admin/placements/${placement.id}/edit`}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Edit
                      </Link>

                      {placement.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(placement)}
                          disabled={isBusy}
                          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy ? "Working..." : "Deactivate"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(placement)}
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