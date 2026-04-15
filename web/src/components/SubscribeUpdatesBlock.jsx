import { useState } from "react";
import { createSubscriber } from "../api/subscribeApi";
import { trackEvent } from "../api/analyticsApi";

export default function SubscribeUpdatesBlock() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      setSuccessMessage("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const result = await createSubscriber({
        email: trimmedEmail,
        source: "website",
      });

      setSuccessMessage(
        result?.message || "Subscribed successfully."
      );


      void trackEvent({
        eventName: "subscribe_submit",
        pageType: "subscription",
        label: "website_updates",
      });



      setEmail("");
    } catch (err) {
      setError(err?.message || "Failed to subscribe.");
      setSuccessMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-10 border border-slate-200 bg-white p-5 md:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Get Updates
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Get breaking stories from Sivubela Intuthuko
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            Stay close to the latest stories, categories, and new digital editions.
          </p>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
              disabled={submitting}
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Get updates"}
            </button>
          </form>

          {successMessage ? (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}