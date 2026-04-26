function OAuthPlaceholderButton({ provider, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(provider)}
      className="inline-flex w-full items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
    >
      Continue with {provider}
    </button>
  );
}

export default function OAuthPlaceholderButtons({ onProviderClick }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <OAuthPlaceholderButton provider="Apple" onClick={onProviderClick} />
      <OAuthPlaceholderButton provider="Facebook" onClick={onProviderClick} />
    </div>
  );
}
