import { useEffect, useRef } from "react";
import {
  ADSENSE_CLIENT,
  ADSENSE_SUPPORT_SLOT as ADSENSE_SLOT,
  ensureAdsenseScript,
} from "./adsense";

export default function AdsenseSupportCard() {
  const adRef = useRef(null);

  const hasClientId = Boolean(ADSENSE_CLIENT);
  const hasSlotId = Boolean(ADSENSE_SLOT);
  const isReady = hasClientId && hasSlotId;

  useEffect(() => {
    if (!isReady) return;

    ensureAdsenseScript();

    try {
      if (adRef.current?.dataset.loaded === "true") return;

      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});

      if (adRef.current) {
        adRef.current.dataset.loaded = "true";
      }
    } catch {
      // AdSense can fail silently before account approval,
      // on localhost, or when blocked by browser extensions.
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <div className="rounded-[22px] border border-dashed border-white/12 bg-black/20 p-4">
        <div className="text-sm font-semibold text-white">Ad space reserved</div>

        <div className="mt-2 text-sm leading-6 text-neutral-400">
          {hasClientId
            ? "AdSense publisher ID is configured. Add a support-page ad slot ID when you create the ad unit."
            : "Add your AdSense publisher ID and support-page ad slot ID to show a live Google ad unit here."}
        </div>

        <div className="mt-3 rounded-[16px] bg-white/[0.03] p-3 text-xs leading-5 text-neutral-500">
          Current status: client ID {hasClientId ? "found" : "missing"}, slot ID{" "}
          {hasSlotId ? "found" : "missing"}.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Advertisement
      </div>

      <ins
        ref={adRef}
        className="adsbygoogle block min-h-[180px] w-full overflow-hidden rounded-[18px] bg-white/[0.03]"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}