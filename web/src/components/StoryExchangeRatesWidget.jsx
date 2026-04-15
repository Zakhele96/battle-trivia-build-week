import { useEffect, useMemo, useState } from "react";

const BASE = "ZAR";
const QUOTES = ["USD", "EUR", "GBP"];

function formatRate(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(4);
}

export default function StoryExchangeRatesWidget() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRates();
  }, []);

  async function loadRates() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `https://api.frankfurter.dev/v2/rates?base=${BASE}&quotes=${QUOTES.join(",")}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates.");
      }

      const data = await response.json();

      // Frankfurter v2 returns an array in its examples for rates queries.
      // We still keep a fallback in case the response shape changes.
      let normalizedRows = [];

      if (Array.isArray(data)) {
        normalizedRows = data
          .map((item) => ({
            quote: item.quote || item.symbol || item.currency || "",
            rate:
              typeof item.rate === "number"
                ? item.rate
                : typeof item.value === "number"
                ? item.value
                : null,
          }))
          .filter((item) => item.quote);
      } else if (data && typeof data === "object" && data.rates) {
        normalizedRows = Object.entries(data.rates).map(([quote, rate]) => ({
          quote,
          rate: typeof rate === "number" ? rate : null,
        }));
      }

      // Keep the display order stable.
      const orderedRows = QUOTES.map((quote) => {
        const match = normalizedRows.find((row) => row.quote === quote);
        return {
          quote,
          rate: match?.rate ?? null,
        };
      });

      setRows(orderedRows);
    } catch (err) {
      setError(err?.message || "Failed to load exchange rates.");
    } finally {
      setLoading(false);
    }
  }

  const hasAnyRate = useMemo(
    () => rows.some((row) => typeof row.rate === "number"),
    [rows]
  );

  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Exchange Rates
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-600">Loading rates...</div>
      ) : error ? (
        <div className="mt-4 text-sm text-red-700">{error}</div>
      ) : !hasAnyRate ? (
        <div className="mt-4 text-sm text-slate-600">
          Rates are unavailable right now.
        </div>
      ) : (
        <>
          <div className="mt-4 text-sm text-slate-600">
            Base currency: <span className="font-semibold text-slate-900">{BASE}</span>
          </div>

          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <div
                key={row.quote}
                className="flex items-center justify-between border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {row.quote}
                  </div>
                  <div className="text-xs text-slate-500">1 {BASE}</div>
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {formatRate(row.rate)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}