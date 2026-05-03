export default function EmailVerificationPanel({
  email,
  otp,
  onOtpChange,
  onVerify,
  onResend,
  onBack,
  isSubmitting = false,
  message = "",
  error = "",
  title = "Verify your email",
  description = "We sent a 6-digit code to your inbox.",
  submitLabel = "Verify email",
}) {
  return (
    <div className="rounded-[22px] border border-blue-400/18 bg-blue-500/8 p-4 sm:p-5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
        Email check
      </div>
      <div className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-white">
        {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-neutral-300">
        {description}
      </div>
      <div className="mt-2 break-all text-sm font-medium text-blue-100">{email}</div>

      <form onSubmit={onVerify} autoComplete="off" className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
            Verification code
          </label>
          <input
            name="otp"
            value={otp}
            onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Enter 6-digit code"
            disabled={isSubmitting}
            className="block w-full min-w-0 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm tracking-[0.3em] text-white outline-none transition focus:border-blue-400/20 disabled:opacity-60"
          />
        </div>

        {message ? (
          <div className="rounded-[16px] border border-emerald-900/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-300/90">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[16px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_34px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Checking..." : submitLabel}
          </button>

          <button
            type="button"
            onClick={onResend}
            disabled={isSubmitting}
            className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
          >
            Resend code
          </button>

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-white/[0.08] disabled:opacity-60"
            >
              Back
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
