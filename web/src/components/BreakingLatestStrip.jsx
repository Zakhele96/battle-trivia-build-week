import { useEffect, useMemo, useState } from "react";
import { getJseNews } from "../api/marketApi";

export default function BreakingLatestStrip() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      const data = await getJseNews(8);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const desktopItems = useMemo(() => [...items, ...items], [items]);

  if (loading || items.length === 0) {
    return null;
  }

  function renderItem(item, index, total, desktop = false) {
    const baseClass = desktop
      ? "group flex w-[320px] shrink-0 flex-col justify-center border-r border-slate-200 px-4 py-3 transition hover:bg-slate-50"
      : `group flex min-w-[260px] max-w-[260px] flex-col justify-center px-4 py-3 transition hover:bg-slate-50 sm:min-w-[320px] sm:max-w-[320px] ${
          index !== total - 1 ? "border-r border-slate-200" : ""
        }`;

    return (
      <a
        key={`${item.url}-${index}`}
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className={baseClass}
      >
        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
          <span>JSE News</span>
          <span>• {item.source || "Official JSE"}</span>
        </div>

        <div className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900 transition group-hover:text-emerald-700">
          {item.title}
        </div>

        <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 transition group-hover:text-slate-600">
          Open source →
        </div>
      </a>
    );
  }

  return (
    <section className="relative mb-8 overflow-hidden border border-slate-200 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr]">
        <div className="border-b border-slate-200 bg-slate-900 px-4 py-3 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
              JSE News
            </span>
          </div>

          <div className="mt-1 text-xs text-white/70">
            Official Johannesburg Stock Exchange updates
          </div>
        </div>

        {/* Mobile */}
        <div className="relative lg:hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />

          <div className="overflow-x-auto scrollbar-none touch-pan-x">
            <div className="flex min-w-max items-stretch">
              {items.map((item, index) => renderItem(item, index, items.length, false))}
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="breaking-strip-desktop relative hidden overflow-hidden lg:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />

          <div className="breaking-strip-track">
            {desktopItems.map((item, index) =>
              renderItem(item, index, desktopItems.length, true)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}