import { useEffect, useRef } from "react";

export default function GoogleAuthButton({ onCredential, disabled = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (disabled) return;

    let cancelled = false;
    let scriptEl = null;

    const renderButton = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;

      containerRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (cancelled) return;
          if (response?.credential) {
            onCredential(response.credential);
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      scriptEl = document.createElement("script");
      scriptEl.src = "https://accounts.google.com/gsi/client";
      scriptEl.async = true;
      scriptEl.defer = true;
      scriptEl.onload = renderButton;
      document.head.appendChild(scriptEl);
    }

    return () => {
      cancelled = true;
    };
  }, [onCredential, disabled]);

  return <div ref={containerRef} className="flex justify-center" />;
}