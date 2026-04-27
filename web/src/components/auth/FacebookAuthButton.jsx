import { useEffect, useRef, useState } from "react";

let facebookScriptPromise = null;
let facebookSdkInitialized = false;

function loadFacebookScript() {
  if (window.FB) {
    return Promise.resolve();
  }

  if (facebookScriptPromise) {
    return facebookScriptPromise;
  }

  facebookScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://connect.facebook.net/en_US/sdk.js"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Facebook SDK.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Facebook SDK."));
    document.head.appendChild(script);
  });

  return facebookScriptPromise;
}

function initializeFacebookSdk(appId) {
  if (!window.FB || facebookSdkInitialized) {
    return;
  }

  window.FB.init({
    appId,
    cookie: false,
    xfbml: false,
    version: import.meta.env.VITE_FACEBOOK_GRAPH_VERSION || "v22.0",
  });

  facebookSdkInitialized = true;
}

export default function FacebookAuthButton({
  onAccessToken,
  disabled = false,
  label = "Continue with Facebook",
}) {
  const helperRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

    async function prepare() {
      if (!appId) {
        if (helperRef.current) {
          helperRef.current.textContent =
            "Facebook sign-in needs VITE_FACEBOOK_APP_ID before it can go live here.";
        }
        return;
      }

      try {
        await loadFacebookScript();
        initializeFacebookSdk(appId);

        if (!cancelled) {
          setIsReady(Boolean(window.FB));
          if (helperRef.current) {
            helperRef.current.textContent = "";
          }
        }
      } catch {
        if (!cancelled && helperRef.current) {
          helperRef.current.textContent =
            "Facebook sign-in could not load right now. BTS login is still available below.";
        }
      }
    }

    prepare();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = () => {
    if (disabled || !window.FB) return;

    window.FB.login(
      (response) => {
        const token = response?.authResponse?.accessToken;
        if (!token) return;
        onAccessToken?.(token);
      },
      { scope: "public_profile,email" }
    );
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || !isReady}
        className="inline-flex w-full items-center justify-center gap-3 rounded-[18px] border border-[#2b4b8a] bg-[linear-gradient(180deg,rgba(33,92,198,0.95),rgba(23,76,173,0.95))] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(24,72,161,0.22)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(24,72,161,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[15px] font-black text-[#1877F2]"
        >
          f
        </span>
        <span>{label}</span>
      </button>

      <div
        ref={helperRef}
        className="min-h-[1.25rem] px-1 text-[11px] leading-5 text-neutral-500"
      />
    </div>
  );
}
