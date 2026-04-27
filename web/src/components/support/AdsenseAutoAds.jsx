import { useEffect } from "react";
import { ADSENSE_CLIENT, ensureAdsenseScript } from "./adsense";

export default function AdsenseAutoAds() {
  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    ensureAdsenseScript();
  }, []);

  return null;
}
