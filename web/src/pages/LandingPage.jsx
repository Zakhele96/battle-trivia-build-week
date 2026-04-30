import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

function StatCard({ label, value, detail, tone = "blue" }) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-300/18 bg-amber-400/10 text-amber-100"
      : tone === "emerald"
        ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-100"
        : "border-blue-300/18 bg-blue-400/10 text-blue-100";

  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          {label}
        </div>
        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${toneClassName}`}
        >
          Live
        </div>
      </div>
      <div className="mt-2 text-[26px] font-semibold tracking-[-0.05em] text-white">
        {value}
      </div>
      <div className="mt-1 text-[13px] leading-6 text-neutral-400">
        {detail}
      </div>
    </div>
  );
}

function ModeCard({ eyebrow, title, description, accentClassName }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div
        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${accentClassName}`}
      >
        {eyebrow}
      </div>
      <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.05em] text-white">
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-7 text-neutral-300">
        {description}
      </p>
    </div>
  );
}

function StepCard({ step, title, description }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
        {step}
      </div>
      <div className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-white">
        {title}
      </div>
      <div className="mt-2 text-[13px] leading-6 text-neutral-400">
        {description}
      </div>
    </div>
  );
}

function LaunchPanel() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_24px_56px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="text-[10px] uppercase tracking-[0.22em] text-blue-300/70">
        Launch flow
      </div>
      <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-white sm:text-[34px]">
        Click once and jump into the game we already built.
      </h2>
      <p className="mt-3 max-w-[38rem] text-[14px] leading-7 text-neutral-300 sm:text-[15px]">
        New players hit sign-in first, then land in the same live app you already
        have now: rooms, standings, alerts, messages, squads, and profile.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/login"
          className="inline-flex min-h-[54px] items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#4ea3ff_0%,#1f6fbd_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(31,111,189,0.28)] transition hover:brightness-105"
        >
          Launch Game
        </Link>
        <Link
          to="/register"
          className="inline-flex min-h-[54px] items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`landing-page auth-page min-h-screen overflow-x-hidden bg-neutral-950 text-white ${
        isLight ? "landing-page--light auth-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[82rem] px-4 py-[max(1rem,env(safe-area-inset-top))] pb-8 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-blue-300/70">
              BTS
            </div>
            <div className="mt-1 text-[12px] text-neutral-500">
              Live competition with room energy.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full border border-blue-400/18 bg-blue-500/10 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-500/15"
            >
              Join now
            </Link>
          </div>
        </div>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6">
          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_75%_18%,rgba(168,85,247,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.24)] sm:p-7">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200/80">
              Battle Trivia. Word Scramble. Squad pressure.
            </div>

            <h1 className="mt-4 max-w-[12ch] text-[44px] font-semibold leading-[0.94] tracking-[-0.07em] text-white sm:text-[58px] lg:text-[72px]">
              Learn the game, then launch straight in.
            </h1>

            <p className="mt-4 max-w-[40rem] text-[15px] leading-7 text-neutral-300 sm:text-[17px]">
              BTS is a live competition app built around quick rooms, weekly
              leaderboards, direct challenges, squads, alerts, and a player
              identity that keeps building every time you play.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex min-h-[56px] items-center justify-center rounded-[20px] bg-[linear-gradient(180deg,#4ea3ff_0%,#1f6fbd_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_38px_rgba(31,111,189,0.32)] transition hover:brightness-105"
              >
                Launch Game
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-[56px] items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Start your account
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Primary mode"
                value="Trivia"
                detail="Fast live questions with weekly movement on the board."
                tone="blue"
              />
              <StatCard
                label="Second mode"
                value="Scramble"
                detail="Word pressure with another route to climb and compete."
                tone="amber"
              />
              <StatCard
                label="Social layer"
                value="DMs"
                detail="Friends, reactions, squads, alerts, and callouts around the game."
                tone="emerald"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <LaunchPanel />

            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.18)] sm:p-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                What players walk into
              </div>
              <div className="mt-3 grid gap-3">
                <StepCard
                  step="01"
                  title="Jump into rooms"
                  description="Battle Trivia stays front and center, with the rest of the game rooms ready the second you enter."
                />
                <StepCard
                  step="02"
                  title="Track your weekly climb"
                  description="Leaderboards show current pressure, winners, and exactly where you sit against the field."
                />
                <StepCard
                  step="03"
                  title="Keep the social energy alive"
                  description="Messages, squads, alerts, and profile growth make the app feel like an active game space, not just a scoreboard."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <ModeCard
            eyebrow="Mode one"
            title="Battle Trivia"
            description="Live-answer competition with the strongest weekly identity in the app. This is where players chase rank, pace, and momentum."
            accentClassName="border-blue-300/18 bg-blue-400/10 text-blue-100"
          />
          <ModeCard
            eyebrow="Mode two"
            title="Word Scramble"
            description="A second lane for fast-score pressure, giving players another way to stay active on the board between trivia runs."
            accentClassName="border-amber-300/18 bg-amber-400/10 text-amber-100"
          />
          <ModeCard
            eyebrow="Mode three"
            title="The player layer"
            description="Direct messages, alerts, squads, supporter identity, and profile history turn the game into a proper ongoing app."
            accentClassName="border-emerald-300/18 bg-emerald-400/10 text-emerald-100"
          />
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_56px_rgba(0,0,0,0.2)] sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                Why this page exists
              </div>
              <h2 className="mt-3 text-[30px] font-semibold leading-[0.98] tracking-[-0.06em] text-white sm:text-[38px]">
                Explain the experience first. Then send players into the real app.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  For first-time users
                </div>
                <div className="mt-2 text-[14px] leading-6 text-neutral-300">
                  They understand what BTS is before login instead of landing cold
                  inside the dashboard.
                </div>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  For returning users
                </div>
                <div className="mt-2 text-[14px] leading-6 text-neutral-300">
                  Once authenticated, the route still takes them straight into the
                  current lobby you already have.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
