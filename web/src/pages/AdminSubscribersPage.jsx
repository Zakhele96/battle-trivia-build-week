import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";
import AdminNotice from "../components/AdminNotice";
import {
  deactivateSubscriber,
  getSubscribers,
  getSubscribersExportUrl,
  reactivateSubscriber,
} from "../api/subscribersAdminApi";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busySubscriberId, setBusySubscriberId] = useState(null);

  useEffect(() => {
    loadSubscribers();
  }, [statusFilter]);

  async function loadSubscribers() {
    try {
      setLoading(true);
      setError("");

      const data = await getSubscribers(searchTerm.trim(), statusFilter);
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load subscribers."
      );
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    await loadSubscribers();
  }

  async function handleDeactivate(subscriber) {
    const confirmed = window.confirm(
      `Deactivate ${subscriber.email}?`
    );

    if (!confirmed) return;

    try {
      setBusySubscriberId(subscriber.subscriberId);
      setError("");
      setSuccessMessage("");

      const result = await deactivateSubscriber(subscriber.subscriberId);
      setSuccessMessage(result?.message || "Subscriber deactivated successfully.");
      await loadSubscribers();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to deactivate subscriber."
      );
    } finally {
      setBusySubscriberId(null);
    }
  }

  async function handleReactivate(subscriber) {
    try {
      setBusySubscriberId(subscriber.subscriberId);
      setError("");
      setSuccessMessage("");

      const result = await reactivateSubscriber(subscriber.subscriberId);
      setSuccessMessage(result?.message || "Subscriber reactivated successfully.");
      await loadSubscribers();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reactivate subscriber."
      );
    } finally {
      setBusySubscriberId(null);
    }
  }

  const activeCount = useMemo(
    () => subscribers.filter((item) => item.isActive).length,
    [subscribers]
  );

  const inactiveCount = subscribers.length - activeCount;

  const exportUrl = getSubscribersExportUrl(searchTerm.trim(), statusFilter);

  return (
    <AdminPageShell
      title="Subscribers"
      description="View, search, export, and manage newsletter subscribers."
      actions={
        <>
          <a
            href={exportUrl}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Export CSV
          </a>

          <button
            type="button"
            onClick={loadSubscribers}
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
        {successMessage ? (
          <AdminNotice type="success">{successMessage}</AdminNotice>
        ) : null}

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
                placeholder="Search by email or source"
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

            <div className="flex items-end gap-3">
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
              Total: <span className="font-semibold">{subscribers.length}</span>
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
              Loading subscribers...
            </div>
          </AdminCard>
        ) : subscribers.length === 0 ? (
          <AdminCard>
            <div className="p-4 text-center text-sm text-neutral-600">
              No subscribers found.
            </div>
          </AdminCard>
        ) : (
          <div className="space-y-4">
            {subscribers.map((subscriber) => {
              const isBusy = busySubscriberId === subscriber.subscriberId;

              return (
                <AdminCard key={subscriber.subscriberId}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                          #{subscriber.subscriberId}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            subscriber.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {subscriber.isActive ? "Active" : "Inactive"}
                        </span>

                        {subscriber.source ? (
                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                            {subscriber.source}
                          </span>
                        ) : null}
                      </div>

                      <h2 className="text-xl font-bold text-neutral-900">
                        {subscriber.email}
                      </h2>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600">
                        <span>
                          <strong>Created:</strong> {formatDate(subscriber.createdAtUtc)}
                        </span>
                        <span>
                          <strong>Updated:</strong> {formatDate(subscriber.updatedAtUtc)}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[180px]">
                      {subscriber.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(subscriber)}
                          disabled={isBusy}
                          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy ? "Working..." : "Deactivate"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(subscriber)}
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