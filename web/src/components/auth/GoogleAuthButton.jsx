import { useEffect, useRef } from "react";

let googleScriptPromise = null;
let googleAccountsInitialized = false;
let activeCredentialHandler = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity Services.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export default function GoogleAuthButton({
  onCredential,
  disabled = false,
  label = "Continue with Google",
}) {
  const shellRef = useRef(null);
  const buttonHostRef = useRef(null);

  useEffect(() => {
    const localCredentialHandler = (credential) => {
      onCredential?.(credential);
    };

    activeCredentialHandler = localCredentialHandler;

    if (disabled) {
      if (buttonHostRef.current) {
        buttonHostRef.current.innerHTML = "";
      }

      return () => {
        if (activeCredentialHandler === localCredentialHandler) {
          activeCredentialHandler = null;
        }
      };
    }

    let cancelled = false;
    let resizeObserver = null;

    const renderFallbackButton = () => {
      if (!buttonHostRef.current) return;

      buttonHostRef.current.innerHTML = `
        <button
          type="button"
          class="bts-google-fallback-btn"
          aria-label="${label}"
        >
          <span class="bts-google-fallback-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 3.6 14.6 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12S6.9 21.3 12 21.3c6.9 0 8.6-4.8 8.6-7.3 0-.5 0-.9-.1-1.3H12z"/>
              <path fill="#34A853" d="M3.8 7l3.2 2.3c.9-1.8 2.7-3.1 5-3.1 1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 3.6 14.6 2.7 12 2.7 8 2.7 4.6 4.9 3 8.2L3.8 7z"/>
              <path fill="#FBBC05" d="M12 21.3c2.5 0 4.6-.8 6.2-2.3l-2.9-2.4c-.8.6-1.8 1.1-3.3 1.1-3.7 0-4.9-2.5-5.3-3.8l-3.2 2.5c1.6 3.3 5 4.9 8.5 4.9z"/>
              <path fill="#4285F4" d="M3 8.2A9.3 9.3 0 0 0 2.2 12c0 1.3.3 2.5.8 3.6l3.7-2.8c-.2-.5-.3-1-.3-1.6s.1-1.1.3-1.6L3 8.2z"/>
            </svg>
          </span>
          <span>${label}</span>
        </button>
      `;

      const button = buttonHostRef.current.querySelector(".bts-google-fallback-btn");
      if (!button) return;

      button.onclick = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.prompt();
        }
      };
    };

    const getButtonWidth = () => {
      const shellWidth = shellRef.current?.clientWidth || 0;
      if (!shellWidth) return 320;

      return Math.max(220, Math.min(shellWidth, 380));
    };

    const renderGoogleButton = async () => {
      try {
        await loadGoogleScript();

        if (
          cancelled ||
          !window.google?.accounts?.id ||
          !buttonHostRef.current ||
          !import.meta.env.VITE_GOOGLE_CLIENT_ID
        ) {
          renderFallbackButton();
          return;
        }

        if (!googleAccountsInitialized) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: (response) => {
              const credential = response?.credential;
              if (!credential) return;

              activeCredentialHandler?.(credential);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          googleAccountsInitialized = true;
        }

        const width = getButtonWidth();

        buttonHostRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(buttonHostRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width,
          logo_alignment: "left",
        });
      } catch {
        renderFallbackButton();
      }
    };

    renderGoogleButton();

    if (typeof ResizeObserver !== "undefined" && shellRef.current) {
      resizeObserver = new ResizeObserver(() => {
        renderGoogleButton();
      });

      resizeObserver.observe(shellRef.current);
    }

    return () => {
      cancelled = true;

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (buttonHostRef.current) {
        buttonHostRef.current.innerHTML = "";
      }

      if (activeCredentialHandler === localCredentialHandler) {
        activeCredentialHandler = null;
      }
    };
  }, [onCredential, disabled, label]);

  return (
    <div className="space-y-3">
      <div
        ref={shellRef}
        className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-2.5 shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
      >
        <div
          ref={buttonHostRef}
          className="google-auth-button-shell flex justify-center"
        />
      </div>

      <style>{`
        .google-auth-button-shell,
        .google-auth-button-shell > div {
          width: 100%;
        }

        .google-auth-button-shell > div {
          display: flex;
          justify-content: center;
        }

        .google-auth-button-shell iframe {
          max-width: 100% !important;
        }

        .bts-google-fallback-btn {
          width: 100%;
          max-width: 380px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: white;
          font-size: 14px;
          font-weight: 600;
          padding: 14px 18px;
          cursor: pointer;
          transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
        }

        .bts-google-fallback-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-1px);
        }

        .bts-google-fallback-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
}