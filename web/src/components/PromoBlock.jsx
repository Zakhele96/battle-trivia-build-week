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

export default function PromoBlock({ placement }) {
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
      className="group block overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300"
    >
      <div className="aspect-[16/8] overflow-hidden bg-slate-100">
        <SafeImage
          src={imageSrc}
          alt={placement.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          fallbackClassName="h-full w-full"
          fallbackLabel="Promo"
        />
      </div>

      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {placement.isSponsored ? (
            <SponsoredBadge label={placement.label || "Sponsored"} />
          ) : null}

          {placement.sponsorName ? (
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {placement.sponsorName}
            </span>
          ) : null}
        </div>

        <h3 className="text-xl font-black tracking-tight text-slate-900 transition group-hover:text-slate-700">
          {placement.title}
        </h3>

        {placement.description ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {placement.description}
          </p>
        ) : null}
      </div>
    </a>
  );
}