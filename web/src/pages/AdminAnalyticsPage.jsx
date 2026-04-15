import { useEffect, useState } from "react";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";
import AdminNotice from "../components/AdminNotice";
import { getAnalyticsSummary } from "../api/analyticsApi";

const DAY_OPTIONS = [7, 14, 30, 90];

function CountList({
  loading,
  items,
  emptyMessage,
  loadingMessage,
}) {
  if (loading) {
    return <div className="text-sm text-neutral-600">{loadingMessage}</div>;
  }

  if (!items.length) {
    return <div className="text-sm text-neutral-600">{emptyMessage}</div>;
  }

  return items.map((item, index) => (
    <div
      key={`${item.key}-${index}`}
      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
    >
      <div className="min-w-0 flex-1 pr-4">
        <div className="truncate text-sm font-medium text-neutral-800">
          {item.key}
        </div>
      </div>
      <div className="text-sm font-semibold text-neutral-900">
        {item.count}
      </div>
    </div>
  ));
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSummary(days);
  }, [days]);

  async function loadSummary(selectedDays = days) {
    try {
      setLoading(true);
      setError("");

      const data = await getAnalyticsSummary(selectedDays);
      setSummary(data);
    } catch (err) {
      setError(err?.message || "Failed to load analytics summary.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  const totalEvents = summary?.totalEvents || 0;
  const eventCounts = Array.isArray(summary?.eventCounts)
    ? summary.eventCounts
    : [];
  const topStories = Array.isArray(summary?.topStories)
    ? summary.topStories
    : [];
  const topIssues = Array.isArray(summary?.topIssues)
    ? summary.topIssues
    : [];
  const topPlacements = Array.isArray(summary?.topPlacementTitles)
    ? summary.topPlacementTitles
    : [];
  const topSponsors = Array.isArray(summary?.topSponsors)
    ? summary.topSponsors
    : [];
  const sponsoredStoryOpens = Array.isArray(summary?.sponsoredStoryOpens)
    ? summary.sponsoredStoryOpens
    : [];

  function getEventCount(eventName) {
    return eventCounts.find((item) => item.key === eventName)?.count || 0;
  }

  return (
    <AdminPageShell
      title="Analytics"
      description="Track content performance, search behaviour, WhatsApp clicks, subscriptions, and monetization activity."
      actions={
        <>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 outline-none transition focus:border-neutral-500"
          >
            {DAY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Last {option} days
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadSummary(days)}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <AdminCard>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Total Events
            </div>
            <div className="mt-3 text-3xl font-bold text-neutral-900">
              {loading ? "—" : totalEvents}
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              All tracked activity in the selected time range.
            </div>
          </AdminCard>

          <AdminCard>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Story Opens
            </div>
            <div className="mt-3 text-3xl font-bold text-neutral-900">
              {loading ? "—" : getEventCount("story_open")}
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              Readers opening individual story pages.
            </div>
          </AdminCard>

          <AdminCard>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Issue Opens
            </div>
            <div className="mt-3 text-3xl font-bold text-neutral-900">
              {loading ? "—" : getEventCount("issue_open")}
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              Opens of digital issue reader pages.
            </div>
          </AdminCard>

          <AdminCard>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Subscriptions
            </div>
            <div className="mt-3 text-3xl font-bold text-neutral-900">
              {loading ? "—" : getEventCount("subscribe_submit")}
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              Successful “Get updates” signups.
            </div>
          </AdminCard>

          <AdminCard>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Placement Clicks
            </div>
            <div className="mt-3 text-3xl font-bold text-neutral-900">
              {loading ? "—" : getEventCount("placement_click")}
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              Clicks on homepage promos, ad slots, and partner placements.
            </div>
          </AdminCard>

          <AdminCard>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Sponsored Story Opens
            </div>
            <div className="mt-3 text-3xl font-bold text-neutral-900">
              {loading ? "—" : getEventCount("sponsored_story_open")}
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              Opens of sponsored stories only.
            </div>
          </AdminCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <AdminCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Event Breakdown
                </div>
                <h2 className="mt-2 text-xl font-bold text-neutral-900">
                  Tracked Events
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <CountList
                loading={loading}
                items={eventCounts}
                loadingMessage="Loading analytics..."
                emptyMessage="No analytics events found yet."
              />
            </div>
          </AdminCard>

          <AdminCard>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Content Performance
              </div>
              <h2 className="mt-2 text-xl font-bold text-neutral-900">
                Top Stories
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <CountList
                loading={loading}
                items={topStories}
                loadingMessage="Loading stories..."
                emptyMessage="No story opens recorded yet."
              />
            </div>
          </AdminCard>

          <AdminCard>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Edition Performance
              </div>
              <h2 className="mt-2 text-xl font-bold text-neutral-900">
                Top Issues
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <CountList
                loading={loading}
                items={topIssues}
                loadingMessage="Loading issues..."
                emptyMessage="No issue opens recorded yet."
              />
            </div>
          </AdminCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <AdminCard>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Monetization
              </div>
              <h2 className="mt-2 text-xl font-bold text-neutral-900">
                Top Placements
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <CountList
                loading={loading}
                items={topPlacements}
                loadingMessage="Loading placements..."
                emptyMessage="No placement clicks recorded yet."
              />
            </div>
          </AdminCard>

          <AdminCard>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Sponsor Performance
              </div>
              <h2 className="mt-2 text-xl font-bold text-neutral-900">
                Top Sponsors
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <CountList
                loading={loading}
                items={topSponsors}
                loadingMessage="Loading sponsors..."
                emptyMessage="No sponsor activity recorded yet."
              />
            </div>
          </AdminCard>

          <AdminCard>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Sponsored Content
              </div>
              <h2 className="mt-2 text-xl font-bold text-neutral-900">
                Sponsored Story Opens
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <CountList
                loading={loading}
                items={sponsoredStoryOpens}
                loadingMessage="Loading sponsored stories..."
                emptyMessage="No sponsored story opens recorded yet."
              />
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPageShell>
  );
}