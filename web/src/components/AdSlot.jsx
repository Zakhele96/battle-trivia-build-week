import { trackEvent } from "../api/analyticsApi";
import SafeImage from "./SafeImage";
import SponsoredBadge from "./SponsoredBadge";

function getAssetUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  try {
    const apiUrl = new URL(apiBaseUrl);
    return path.startsWith("/")
      ? `${apiUrl.origin}${path}`
      : `${apiUrl.origin}/${path}`;
  } catch {
    return path;
  }
}

function buildPlacementMetadata(placement) {
  return {
    placementKey: placement?.placementKey || "",
    placementTitle: placement?.title || "",
    sponsorName: placement?.sponsorName || "",
    targetUrl: placement?.targetUrl || "",
    label: placement?.label || "",
    isSponsored: placement?.isSponsored ? "true" : "false",
  };
}

export default function AdSlot({ placement }) {
  if (!placement) return null;

  async function handleClick(event) {
    if (!placement.targetUrl) return;

    event.preventDefault();

    await trackEvent({
      eventName: "placement_click",
      pageType: "placement",
      pageSlug: placement?.placementKey || "",
      label: placement?.title || "",
      metadata: buildPlacementMetadata(placement),
    });

    window.open(placement.targetUrl, "_blank", "noopener,noreferrer");
  }

  const imageSrc = getAssetUrl(placement.imageUrl);

  return (
    <a
      href={placement.targetUrl || "#"}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className="block overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300"
    >
      <div className="aspect-[16/6] overflow-hidden bg-slate-100">
        <SafeImage
          src={imageSrc}
          alt={placement.title}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full"
          fallbackLabel="Ad"
        />
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <SponsoredBadge label={placement.label || "Sponsored"} />
        </div>

        <div className="text-sm font-semibold text-slate-900">
          {placement.title}
        </div>
      </div>
    </a>
  );
}