import { Link } from "react-router-dom";
import AppSectionNav from "../components/layout/AppSectionNav";
import AppTopBar from "../components/layout/AppTopBar";
import AdsenseSupportCard from "../components/support/AdsenseSupportCard";
import { createPayFastSupporterCheckout } from "../api/supportApi";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useState } from "react";

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-[26px] border border-white/10 bg-white/[0.03] p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function StatusPill({ active, label }) {
  return (
    <div
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
        active
          ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-100"
          : "border-amber-300/18 bg-amber-400/10 text-amber-100"
      }`}
    >
      {label}
    </div>
  );
}

export default function SupportPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [checkoutError, setCheckoutError] = useState("");
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  const isSupporter = user?.isSupporter === true;
  const supporterBadge = user?.supporterBadgeLabel || "Supporter";

  async function handleStartCheckout() {
    setCheckoutError("");
    setIsStartingCheckout(true);

    try {
      const checkout = await createPayFastSupporterCheckout();
      const form = document.createElement("form");
      form.method = checkout.method || "POST";
      form.action = checkout.checkoutUrl;
      form.style.display = "none";

      for (const field of checkout.fields || []) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = field.name;
        input.value = field.value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      setCheckoutError(
        error?.response?.data?.message || "Could not start supporter checkout right now."
      );
      setIsStartingCheckout(false);
    }
  }

  return (
    <div
      className={`support-page min-h-screen bg-neutral-950 text-white ${isLight ? "support-page--light" : ""}`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Support BTS"
          title="Keep the app growing"
          description="Two safe ways to help: a low-cost supporter plan and a simple ad-backed support page."
          actions={[{ label: "Open profile", to: "/profile" }]}
        />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Panel className="bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-amber-200/75">
                  BTS Supporter
                </div>
                <div className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">
                  R18 / month
                </div>
                <div className="mt-2 max-w-[34rem] text-sm leading-6 text-neutral-300">
                  A low-cost supporter tier built for cosmetics and community support, not pay-to-win access.
                </div>
              </div>
              <StatusPill
                active={isSupporter}
                label={isSupporter ? `${supporterBadge} active` : "Payments coming soon"}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">What it unlocks</div>
                <div className="mt-3 space-y-2 text-sm text-neutral-300">
                  <div>All chat packs and premium emoji access once the pack catalog goes live.</div>
                  <div>A supporter badge beside your name in DMs and room chat.</div>
                  <div>Supporter messages render with a more distinct highlighted treatment.</div>
                  <div>Future cosmetic-only supporter perks without gameplay advantage.</div>
                </div>
              </div>

              <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">What is wired today</div>
                <div className="mt-3 space-y-2 text-sm text-neutral-300">
                  <div>The account model now understands supporter status and supporter badges.</div>
                  <div>Room chat and DMs are ready to render supporter badges when an account is marked active.</div>
                  <div>The purchase flow stays disabled until your recurring billing provider is connected.</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={isStartingCheckout}
                className="rounded-[16px] bg-amber-400 px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300 disabled:opacity-60"
              >
                {isStartingCheckout ? "Opening PayFast..." : "Subscribe with PayFast"}
              </button>
              <Link
                to="/messages"
                className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                See chat styling
              </Link>
            </div>
            {checkoutError ? (
              <div className="mt-3 text-sm text-red-300/90">{checkoutError}</div>
            ) : null}
          </Panel>

          <Panel>
            <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
              Please support us
            </div>
            <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-white">
              Neutral ad support area
            </div>
            <div className="mt-2 text-sm leading-6 text-neutral-400">
              This page is safe for AdSense because it does not ask people to click ads. The copy simply explains that ads help cover BTS costs.
            </div>

            <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-neutral-300">
              Ads help keep BTS running. If something here is relevant to you, you can explore it naturally. Thanks for helping us keep the app online.
            </div>

            <div className="mt-4">
              <AdsenseSupportCard />
            </div>

            <div className="mt-4 rounded-[20px] border border-dashed border-white/12 bg-white/[0.02] p-4">
              <div className="text-sm font-semibold text-white">What you still need later</div>
              <div className="mt-2 space-y-2 text-sm text-neutral-400">
                <div>Your approved AdSense publisher ID.</div>
                <div>A live support-page ad slot ID.</div>
                <div>A recurring billing provider like PayFast or Peach Payments for the R18/month plan.</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
