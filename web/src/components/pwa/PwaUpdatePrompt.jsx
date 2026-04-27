import { useEffect, useState } from "react";
import { usePwa } from "../../context/PwaContext";

export default function PwaUpdatePrompt() {
  const { hasUpdateReady, updateRegistration, setUpdateRegistration } = usePwa();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    function handleControllerChange() {
      window.location.reload();
    }

    navigator.serviceWorker?.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  if (!hasUpdateReady || isRefreshing) {
    return null;
  }

  function handleDismiss() {
    setUpdateRegistration(null);
  }

  function handleRefresh() {
    if (!updateRegistration?.waiting) return;

    setIsRefreshing(true);
    updateRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-[24rem] rounded-[22px] border border-emerald-300/18 bg-[linear-gradient(180deg,rgba(10,31,24,0.96),rgba(7,18,14,0.96))] p-4 text-white shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">
          Update ready
        </div>
        <div className="mt-2 text-[17px] font-semibold tracking-[-0.03em] text-white">
          A newer BTS version is waiting
        </div>
        <div className="mt-2 text-[13px] leading-6 text-neutral-300">
          Refresh once to load the latest rooms, profile, leaderboard, and app updates.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-[16px] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
          >
            Refresh now
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
