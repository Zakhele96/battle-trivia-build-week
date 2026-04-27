export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT_ID || "";
export const ADSENSE_SUPPORT_SLOT =
  import.meta.env.VITE_ADSENSE_SUPPORT_SLOT_ID || "";

export function ensureAdsenseScript() {
  if (typeof document === "undefined" || !ADSENSE_CLIENT) return;
  if (document.querySelector('script[data-bts-adsense="true"]')) return;
  if (
    document.querySelector(
      `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"][src*="${ADSENSE_CLIENT}"]`
    )
  ) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  script.crossOrigin = "anonymous";
  script.dataset.btsAdsense = "true";
  document.head.appendChild(script);
}
