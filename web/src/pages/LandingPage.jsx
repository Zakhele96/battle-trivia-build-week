import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

const PREVIEW_ROUNDS = [
  {
    stage: "Round 07",
    timer: 12,
    question:
      "Which planet is known as the Red Planet?",
    leaderboard: [
      { name: "Nova", score: 1240, tone: "blue" },
      { name: "Quinn", score: 1190, tone: "amber" },
      { name: "Ari", score: 1140, tone: "emerald" },
    ],
    messages: [
      {
        id: "r1m1",
        name: "Nova",
        text: "Lock in A. Mars all day.",
        mine: false,
      },
      {
        id: "r1m2",
        name: "You",
        text: "Sent. Timer pressure is crazy.",
        mine: true,
      },
      {
        id: "r1m3",
        name: "Ari",
        text: "Chat is moving fast today.",
        mine: false,
      },
    ],
  },
  {
    stage: "Round 08",
    timer: 9,
    question:
      "Which ocean is the largest on Earth?",
    leaderboard: [
      { name: "Quinn", score: 1360, tone: "blue" },
      { name: "Nova", score: 1340, tone: "amber" },
      { name: "You", score: 1290, tone: "emerald" },
    ],
    messages: [
      {
        id: "r2m1",
        name: "Quinn",
        text: "B is free points if you stay calm.",
        mine: false,
      },
      {
        id: "r2m2",
        name: "You",
        text: "Need this one for the climb.",
        mine: true,
      },
      {
        id: "r2m3",
        name: "Nova",
        text: "Leaderboard is tightening up.",
        mine: false,
      },
    ],
  },
  {
    stage: "Round 09",
    timer: 6,
    question:
      "Who painted the Mona Lisa?",
    leaderboard: [
      { name: "You", score: 1510, tone: "blue" },
      { name: "Quinn", score: 1490, tone: "amber" },
      { name: "Nova", score: 1470, tone: "emerald" },
    ],
    messages: [
      {
        id: "r3m1",
        name: "Ari",
        text: "This room is alive right now.",
        mine: false,
      },
      {
        id: "r3m2",
        name: "You",
        text: "C locked. Push for first.",
        mine: true,
      },
      {
        id: "r3m3",
        name: "Quinn",
        text: "Final seconds. No panic taps.",
        mine: false,
      },
    ],
  },
];

function MetricPill({ label, value, tone = "blue" }) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-300/18 bg-amber-400/10 text-amber-100"
      : tone === "emerald"
        ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-100"
        : "border-blue-300/18 bg-blue-400/10 text-blue-100";

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016))] px-3.5 py-3 shadow-[0_14px_28px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          {label}
        </div>
        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${toneClassName}`}
        >
          Live
        </div>
      </div>
      <div className="mt-2 text-[20px] font-semibold tracking-[-0.05em] text-white">
        {value}
      </div>
    </div>
  );
}

function FeatureCard({ eyebrow, title, description, accent }) {
  return (
    <div className="landing-float-card rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-[0_20px_44px_rgba(0,0,0,0.18)]">
      <div
        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${accent}`}
      >
        {eyebrow}
      </div>
      <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.05em] text-white">
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-7 text-neutral-300">
        {description}
      </p>
    </div>
  );
}

function PreviewMessage({ item }) {
  return (
    <div
      className={`max-w-[88%] rounded-[16px] px-2.5 py-2 shadow-[0_10px_22px_rgba(0,0,0,0.1)] ${
        item.mine
          ? "ml-auto rounded-br-md border border-blue-300/18 bg-blue-500/12 text-blue-50"
          : "rounded-bl-md border border-white/8 bg-white/[0.04] text-white"
      }`}
    >
      <div
        className={`text-[10px] uppercase tracking-[0.14em] ${
          item.mine ? "text-blue-100/75" : "text-neutral-500"
        }`}
      >
        {item.name}
      </div>
      <div className="mt-1 text-[11px] leading-4">{item.text}</div>
    </div>
  );
}

function MobileBattlePreview() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [previewMessages, setPreviewMessages] = useState(
    PREVIEW_ROUNDS[0].messages
  );

  useEffect(() => {
    const roundTimer = window.setInterval(() => {
      setRoundIndex((previous) => (previous + 1) % PREVIEW_ROUNDS.length);
    }, 3200);

    return () => window.clearInterval(roundTimer);
  }, []);

  const round = PREVIEW_ROUNDS[roundIndex];

  useEffect(() => {
    const timers = round.messages.map((message, index) =>
      window.setTimeout(() => {
        setPreviewMessages((previous) => {
          const next = previous.filter((item) => item.id !== message.id);
          return [...next, message].slice(-3);
        });
      }, 180 + index * 260)
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [round]);

  return (
    <div className="relative mx-auto w-full max-w-[17.5rem] sm:max-w-[18.25rem]">
      <div className="landing-phone-glow absolute inset-x-[14%] top-[10%] h-[12rem] rounded-full bg-blue-500/16 blur-3xl" />
      <div className="landing-phone-glow landing-phone-glow--alt absolute bottom-[12%] left-[22%] h-[9rem] w-[56%] rounded-full bg-amber-400/12 blur-3xl" />

      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,#090b12_0%,#0d1320_46%,#090b12_100%)] p-2 shadow-[0_24px_56px_rgba(0,0,0,0.34)]">
        <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_30%),linear-gradient(180deg,rgba(10,10,11,1),rgba(16,23,36,0.96),rgba(10,10,11,1))]">
          <div className="flex justify-center pt-2">
            <div className="h-1.5 w-16 rounded-full bg-white/12" />
          </div>

          <div className="px-3 pb-2.5 pt-2">
            <div className="flex items-center justify-between gap-2 rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-blue-300/70">
                  Battle Trivia
                </div>
                <div className="mt-1 text-[13px] font-semibold tracking-[-0.03em] text-white">
                  {round.stage}
                </div>
              </div>

              <div className="rounded-full border border-orange-300/20 bg-orange-400/10 px-2.5 py-1 text-[10px] font-semibold text-orange-100">
                {round.timer}s
              </div>
            </div>

            <div className="mt-2.5 rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
                  Live question
                </div>
                <div className="text-[11px] text-neutral-400">124 players</div>
              </div>

              <div className="mt-2 text-[13px] font-semibold leading-5 tracking-[-0.02em] text-white">
                {round.question}
              </div>

              <div className="mt-2 rounded-[15px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-semibold text-neutral-400">
                    ?
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-full rounded-full bg-white/[0.08]" />
                    <div className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                      Type your answer...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Room chat
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.52)]" />
              </div>
              <div className="mt-2 flex min-h-[7.4rem] flex-col gap-1.5">
                {previewMessages.map((message) => (
                  <PreviewMessage key={message.id} item={message} />
                ))}
              </div>
            </div>

            <div className="mt-2 rounded-[16px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.014))] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-neutral-300">
                  Answer fast. Chat hard. Climb weekly.
                </div>
                <div className="rounded-full border border-blue-300/18 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-100">
                  Send
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const [activeMetric, setActiveMetric] = useState(0);
  const isLight = resolvedTheme === "light";

  const rotatingWords = useMemo(
    () => ["compete", "climb", "trash-talk", "lock in"],
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveMetric((previous) => (previous + 1) % rotatingWords.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [rotatingWords.length]);

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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-aurora absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/18 blur-3xl" />
        <div className="landing-aurora landing-aurora--slow absolute right-[-4rem] top-28 h-80 w-80 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="landing-aurora landing-aurora--alt absolute left-[28%] top-[48%] h-72 w-72 rounded-full bg-amber-400/12 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[84rem] px-4 py-[max(1rem,env(safe-area-inset-top))] pb-10 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-blue-300/70">
              BTS
            </div>
            <div className="mt-1 text-[12px] text-neutral-500">
              A live competition room with actual pressure.
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

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(34,211,238,0.14),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] sm:p-6 lg:p-6">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/80">
              Alternate landing concept
            </div>

            <h1 className="mt-4 max-w-[10ch] text-[44px] font-semibold leading-[0.92] tracking-[-0.08em] text-white sm:text-[54px] lg:text-[64px]">
              Come here to play, not just browse.
            </h1>

            <p className="mt-4 max-w-[34rem] text-[15px] leading-7 text-neutral-300 sm:text-[16px]">
              BTS throws players straight into a moving room: live questions,
              visible countdowns, a weekly climb, fast chat, and just enough
              chaos to make the competition feel addictive.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-300/18 bg-blue-500/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-100">
              Players come to
              <span className="min-w-[5.5rem] text-left text-white">
                {rotatingWords[activeMetric]}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex min-h-[54px] items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#62b0ff_0%,#2376c6_100%)] px-4.5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(35,118,198,0.3)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Launch Game
              </Link>
              <Link
                to="/register"
                className="inline-flex min-h-[54px] items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.05] px-4.5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Create your player account
              </Link>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <MetricPill label="Mode" value="Battle Trivia" tone="blue" />
              <MetricPill label="Energy" value="Room chat" tone="amber" />
              <MetricPill label="Goal" value="Weekly climb" tone="emerald" />
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="landing-grid absolute inset-[10%] rounded-[36px] opacity-20" />
            <MobileBattlePreview />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <FeatureCard
            eyebrow="Live pressure"
            title="Every round looks alive"
            description="Timers, score changes, question cards, and chat movement make the experience feel active before the player even taps launch."
            accent="border-blue-300/18 bg-blue-400/10 text-blue-100"
          />
          <FeatureCard
            eyebrow="Room identity"
            title="It feels like a proper competition room"
            description="Instead of a flat marketing block, the phone preview sells the real product: a mobile-first room where the match is already in motion."
            accent="border-amber-300/18 bg-amber-400/10 text-amber-100"
          />
          <FeatureCard
            eyebrow="Launch flow"
            title="One click still hands off to what we have"
            description="This page is only the attract layer. Launch Game still routes people into login first and then into the current BTS app."
            accent="border-emerald-300/18 bg-emerald-400/10 text-emerald-100"
          />
        </section>

        <section className="mt-8 rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016))] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.22)] sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                What this alternate version says
              </div>
              <h2 className="mt-3 text-[30px] font-semibold leading-[0.96] tracking-[-0.06em] text-white sm:text-[40px]">
                You are not joining a website. You are stepping into a live room.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Question flow
                </div>
                <div className="mt-2 text-[14px] leading-6 text-neutral-300">
                  Fast, timed, clean, and easy to read on mobile.
                </div>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Social movement
                </div>
                <div className="mt-2 text-[14px] leading-6 text-neutral-300">
                  DMs, squads, reactions, and chat all support the competition.
                </div>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Launch CTA
                </div>
                <div className="mt-2 text-[14px] leading-6 text-neutral-300">
                  A welcoming screen that still hands off to the real app flow.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
