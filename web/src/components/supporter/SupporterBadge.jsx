export default function SupporterBadge({
  label = "Supporter",
  isLight = false,
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
        isLight
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-amber-300/18 bg-amber-400/10 text-amber-100"
      } ${className}`}
    >
      {label}
    </span>
  );
}
