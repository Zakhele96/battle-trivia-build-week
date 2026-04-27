import { useEffect, useState } from "react";

const DISMISS_KEY = "bts_pwa_prompt_dismissed";

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      setIsDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    } catch {
      setIsDismissed(false);
    }

    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator?.standalone === true;

    setIsInstalled(Boolean(standalone));

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallEvent(event);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallEvent(null);
      try {
        localStorage.setItem(DISMISS_KEY, "true");
      } catch {
        // ignore storage issues
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!installEvent || isInstalled || isDismissed) {
    return null;
  }

  async function handleInstall() {
    installEvent.prompt();
    const result = await installEvent.userChoice.catch(() => null);
    if (result?.outcome === "accepted") {
      setInstallEvent(null);
    }
  }

  function handleDismiss() {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore storage issues
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bts-mobile-nav-height,5.5rem)+0.5rem)] z-40 flex justify-center px-4 sm:bottom-4 sm:justify-end">
      <div className="pointer-events-auto w-full max-w-[22rem] rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,26,39,0.96),rgba(10,13,20,0.96))] p-4 text-white shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/75">
          Install BTS
        </div>
        <div className="mt-2 text-[17px] font-semibold tracking-[-0.03em] text-white">
          Keep BTS on your home screen
        </div>
        <div className="mt-2 text-[13px] leading-6 text-neutral-300">
          Launch faster, keep the app feel, and jump back into rooms, leaderboards,
          and messages in one tap.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-[16px] bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
          >
            Install app
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
