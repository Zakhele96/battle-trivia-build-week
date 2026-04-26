function getInitials(name) {
  if (!name) return "SP";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function hasSponsorPlacement(sponsor, placementKey) {
  return !!sponsor?.placements?.some(
    (item) => item?.placementKey === placementKey && item?.isActive !== false
  );
}

export default function SponsorSpotlightCard({
  sponsor,
  compact = false,
  className = "",
}) {
  if (!sponsor?.name) return null;

  const copy =
    sponsor.sponsorText || "This week's competition is sponsored by";
  const ctaLabel = sponsor.callToActionLabel || "Visit sponsor";
  const wrapperClassName = compact
    ? "rounded-[18px] border border-amber-300/18 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-3"
    : "rounded-[24px] border border-amber-300/18 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-4 sm:p-5";

  return (
    <div className={`${wrapperClassName} ${className}`.trim()}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {sponsor.badgeImageUrl ? (
            <img
              src={sponsor.badgeImageUrl}
              alt={sponsor.name}
              className={`shrink-0 rounded-[16px] border border-white/10 bg-white p-2 object-contain ${
                compact ? "h-14 w-14" : "h-16 w-16 sm:h-20 sm:w-20"
              }`}
            />
          ) : (
            <div
              className={`flex shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.08] font-semibold text-amber-100 ${
                compact ? "h-14 w-14 text-sm" : "h-16 w-16 text-base sm:h-20 sm:w-20"
              }`}
            >
              {getInitials(sponsor.name)}
            </div>
          )}

          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80">
              Sponsored this week
            </div>
            <div className="mt-1 text-[12px] leading-5 text-neutral-300">
              {copy}
            </div>
            <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.03em] text-white">
              {sponsor.name}
            </div>
            {sponsor.description ? (
              <div className="mt-1 text-[12px] leading-5 text-neutral-400">
                {sponsor.description}
              </div>
            ) : null}
          </div>
        </div>

        {sponsor.websiteUrl ? (
          <a
            href={sponsor.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-400/15"
          >
            {ctaLabel}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
