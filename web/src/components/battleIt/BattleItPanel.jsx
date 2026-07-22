import { useEffect, useMemo, useState } from "react";
import {
  generateBattleItPack,
  getPublicBattleItSessions,
  joinBattleIt,
  joinPublicBattleIt,
  openBattleItLobby,
  replayBattleIt,
  startBattleIt,
  updateBattleItDraft,
} from "../../api/battleItApi";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-300/40 focus:bg-black/35";

function apiMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    fallback
  );
}

function StatusBadge({ children, tone = "cyan" }) {
  const classes =
    tone === "green"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : tone === "amber"
      ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
      : tone === "violet"
      ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
      : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${classes}`}
    >
      {children}
    </span>
  );
}

function Podium({ rows = [] }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-5 text-sm text-neutral-500">
        No scores were recorded in this battle.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {rows.slice(0, 3).map((row) => (
        <div
          key={row.userId}
          className={`rounded-2xl border p-3 ${
            row.rank === 1
              ? "border-amber-300/25 bg-amber-500/10"
              : "border-white/8 bg-black/20"
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Place #{row.rank}
          </div>
          <div className="mt-2 truncate text-sm font-semibold text-white">
            {row.displayName || row.username}
          </div>
          <div className="mt-1 text-xs text-neutral-400">{row.score} points</div>
        </div>
      ))}
    </div>
  );
}

function CreateBattleForm({ roomId, onStateChange, previousBattle }) {
  const [step, setStep] = useState(1);
  const [sourceText, setSourceText] = useState("");
  const [images, setImages] = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [answerMode, setAnswerMode] = useState("text");
  const [visibility, setVisibility] = useState("code-only");
  const [questionDurationSeconds, setQuestionDurationSeconds] = useState(20);
  const [revealDelaySeconds, setRevealDelaySeconds] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replaying, setReplaying] = useState(false);

  const handleImages = (event) => {
    const next = Array.from(event.target.files || []).slice(0, 2);
    const invalid = next.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
    );

    if (invalid) {
      setError("Use up to two JPEG, PNG, or WebP images, maximum 5 MB each.");
      event.target.value = "";
      setImages([]);
      return;
    }

    setError("");
    setImages(next);
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!sourceText.trim() && images.length === 0) {
      setError("Paste your notes or upload at least one image.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const next = await generateBattleItPack(roomId, {
        sourceText,
        images,
        difficulty,
        answerMode,
        visibility,
        questionDurationSeconds,
        revealDelaySeconds,
      });
      onStateChange(next);
    } catch (requestError) {
      setError(apiMessage(requestError, "Could not generate this Battle It pack."));
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = () => {
    if (!sourceText.trim() && images.length === 0) {
      setError("Paste your notes or upload at least one image.");
      return;
    }
    if (sourceText.length > 12000) {
      setError("Pasted notes must be 12,000 characters or fewer.");
      return;
    }

    setError("");
    setStep(2);
  };

  const handleReplay = async () => {
    if (!previousBattle?.sessionId) return;
    setReplaying(true);
    setError("");
    try {
      onStateChange(await replayBattleIt(roomId, previousBattle.sessionId));
    } catch (requestError) {
      setError(apiMessage(requestError, "Could not prepare the replay."));
    } finally {
      setReplaying(false);
    }
  };

  return (
    <div className="space-y-4">
      {previousBattle ? (
        <div className="rounded-2xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <StatusBadge tone="amber">Battle complete</StatusBadge>
              <h3 className="mt-2 text-lg font-semibold text-white">{previousBattle.title}</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Final podium — the creator can replay this exact pack without another AI request.
              </p>
            </div>
            {previousBattle.isCreator ? (
              <button
                type="button"
                onClick={handleReplay}
                disabled={replaying}
                className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-60"
              >
                {replaying ? "Preparing..." : "Replay free"}
              </button>
            ) : null}
          </div>
          <div className="mt-4">
            <Podium rows={previousBattle.podium} />
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_36%),rgba(10,10,11,0.88)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <StatusBadge>Create a battle</StatusBadge>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
              {step === 1
                ? "What should players be tested on?"
                : "How should this battle play?"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-400">
              {step === 1
                ? "Add notes or clear note images. You will review every generated question before anyone plays."
                : "Choose the answer style and pace for the whole battle."}
            </p>
          </div>
          <StatusBadge tone="green">Step {step} of 3</StatusBadge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Create battle progress">
          {["Source", "Game setup", "Review"].map((label, index) => {
            const number = index + 1;
            const isCurrent = step === number;
            const isComplete = step > number;
            return (
              <div
                key={label}
                className={`rounded-xl border px-2.5 py-2 ${
                  isCurrent
                    ? "border-cyan-300/35 bg-cyan-300/10"
                    : isComplete
                    ? "border-emerald-300/20 bg-emerald-400/[0.07]"
                    : "border-white/8 bg-white/[0.025]"
                }`}
              >
                <div className={`text-[10px] font-semibold ${isCurrent ? "text-cyan-100" : isComplete ? "text-emerald-200" : "text-neutral-600"}`}>
                  {isComplete ? "Done" : `0${number}`}
                </div>
                <div className={`mt-0.5 truncate text-[11px] ${isCurrent ? "text-white" : "text-neutral-500"}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`mt-4 grid gap-4 ${step === 1 ? "lg:grid-cols-[1fr_0.72fr]" : "mx-auto max-w-2xl"}`}>
          <label className={step === 1 ? "block" : "hidden"}>
            <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-neutral-300">
              <span>Paste notes</span>
              <span className={sourceText.length > 12000 ? "text-red-300" : "text-neutral-600"}>
                {sourceText.length.toLocaleString()}/12,000
              </span>
            </span>
            <textarea
              rows="10"
              maxLength="12000"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste a lesson, study notes, training material, or revision summary..."
              className={`${fieldClass} min-h-[14rem] resize-y`}
            />
          </label>

          <div className="space-y-3">
            <label className={`${step === 1 ? "block" : "hidden"} rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-center transition hover:border-cyan-300/30`}>
              <span className="block text-sm font-semibold text-white">Upload note images</span>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">
                Up to two JPEG, PNG, or WebP pages. Maximum 5 MB each.
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImages}
                className="mt-3 block w-full min-w-0 max-w-full overflow-hidden text-xs text-neutral-400 file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-neutral-950"
              />
              {images.length ? (
                <div className="mt-3 space-y-1 text-left text-xs text-cyan-100">
                  {images.map((image) => (
                    <div key={`${image.name}-${image.size}`} className="truncate">
                      {image.name}
                    </div>
                  ))}
                </div>
              ) : null}
            </label>

            {step === 2 ? (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 p-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Source ready</div>
                  <div className="mt-1 text-sm font-medium text-white">
                    {sourceText.trim()
                      ? `${sourceText.length.toLocaleString()} characters of notes`
                      : `${images.length} note image${images.length === 1 ? "" : "s"}`}
                  </div>
                </div>
                <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-300">
                  Edit
                </button>
              </div>
            ) : null}

            <div className={`${step === 2 ? "grid" : "hidden"} grid-cols-1 gap-2 min-[420px]:grid-cols-2`}>
              <label>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Difficulty
                </span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className={fieldClass}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Answer time
                </span>
                <select
                  value={questionDurationSeconds}
                  onChange={(event) => setQuestionDurationSeconds(Number(event.target.value))}
                  className={fieldClass}
                >
                  <option value="15">15 seconds</option>
                  <option value="20">20 seconds</option>
                  <option value="30">30 seconds</option>
                </select>
              </label>
              <fieldset className="min-[420px]:col-span-2">
                <legend className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Answer mode
                </legend>
                <div className="grid gap-2 min-[420px]:grid-cols-2">
                  {[
                    {
                      value: "text",
                      title: "Type the answer",
                      description: "Players can retry while the timer is running.",
                    },
                    {
                      value: "multiple-choice",
                      title: "Choose from four",
                      description: "One final choice per player and question.",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAnswerMode(option.value)}
                      aria-pressed={answerMode === option.value}
                      className={`rounded-xl border p-3 text-left transition ${
                        answerMode === option.value
                          ? "border-cyan-300/40 bg-cyan-300/10"
                          : "border-white/8 bg-black/20 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{option.title}</span>
                        <span className={`h-4 w-4 shrink-0 rounded-full border-4 ${answerMode === option.value ? "border-cyan-300 bg-cyan-300" : "border-neutral-600"}`} />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="min-[420px]:col-span-2">
                <legend className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Who can join?
                </legend>
                <div className="grid gap-2 min-[420px]:grid-cols-2">
                  {[
                    {
                      value: "code-only",
                      title: "Code-only",
                      description: "Only players with your six-digit code can enter.",
                    },
                    {
                      value: "public",
                      title: "Public battle",
                      description: "Listed under Open battles for one-tap joining.",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVisibility(option.value)}
                      aria-pressed={visibility === option.value}
                      className={`rounded-xl border p-3 text-left transition ${
                        visibility === option.value
                          ? "border-blue-300/40 bg-blue-400/10"
                          : "border-white/8 bg-black/20 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{option.title}</span>
                        <span className={`h-4 w-4 shrink-0 rounded-full border-4 ${visibility === option.value ? "border-blue-300 bg-blue-300" : "border-neutral-600"}`} />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Reveal time
                </span>
                <select
                  value={revealDelaySeconds}
                  onChange={(event) => setRevealDelaySeconds(Number(event.target.value))}
                  className={fieldClass}
                >
                  <option value="3">3 seconds</option>
                  <option value="5">5 seconds</option>
                  <option value="8">8 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-xs leading-5 text-neutral-400">
              Your original notes are not saved. Only the reviewed questions and short proof excerpts remain for free replays.
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-neutral-500">
            {step === 1
              ? "Use enough material for at least four clear questions."
              : "You will review and edit every question before opening the lobby."}
          </div>
          {step === 1 ? (
            <button
              type="button"
              onClick={handleContinue}
              disabled={sourceText.length > 12000}
              className="min-h-11 w-full rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-200 disabled:opacity-60 sm:w-auto"
            >
              Continue to game setup
            </button>
          ) : (
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="min-h-11 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "Building battle..." : "Generate questions"}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function JoinBattleForm({ roomId, onStateChange, refreshKey }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [publicBusy, setPublicBusy] = useState("");
  const [publicBattles, setPublicBattles] = useState([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPublicBattleItSessions(roomId)
      .then((sessions) => {
        if (!cancelled) setPublicBattles(sessions);
      })
      .catch(() => {
        if (!cancelled) setPublicBattles([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPublic(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, refreshKey]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedCode = code.replace(/\D/g, "");
    if (normalizedCode.length !== 6) {
      setError("Enter the six-digit battle code.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      onStateChange(await joinBattleIt(roomId, normalizedCode));
    } catch (requestError) {
      setError(apiMessage(requestError, "That battle code is invalid or has expired."));
    } finally {
      setBusy(false);
    }
  };

  const handlePublicJoin = async (sessionId) => {
    setPublicBusy(sessionId);
    setError("");
    try {
      onStateChange(await joinPublicBattleIt(roomId, sessionId));
    } catch (requestError) {
      setError(apiMessage(requestError, "This public battle is no longer open."));
    } finally {
      setPublicBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-400/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.11),transparent_38%),rgba(10,10,11,0.9)] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <StatusBadge tone="green">Open battles</StatusBadge>
            <h2 className="mt-2 text-lg font-semibold text-white">Join instantly</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              Public battles do not need a code. Choose one that is waiting or already live.
            </p>
          </div>
          {publicBattles.length ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-neutral-300">
              {publicBattles.length} open
            </span>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          {loadingPublic ? (
            <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-neutral-500">
              Checking for open battles...
            </div>
          ) : publicBattles.length ? (
            publicBattles.map((battle) => (
              <article key={battle.sessionId} className="flex flex-col gap-3 rounded-xl border border-white/8 bg-black/20 p-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${battle.status === "active" ? "bg-red-500/12 text-red-200" : "bg-emerald-500/12 text-emerald-200"}`}>
                      {battle.status === "active" ? "Live" : "Lobby"}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {battle.playerCount} player{battle.playerCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h3 className="mt-1.5 truncate text-sm font-semibold text-white">{battle.title}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {battle.creatorDisplayName} · {battle.questionCount} questions · {battle.answerMode === "multiple-choice" ? "4 choices" : "typed answers"} · {battle.difficulty}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePublicJoin(battle.sessionId)}
                  disabled={Boolean(publicBusy)}
                  className="min-h-10 shrink-0 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-60"
                >
                  {publicBusy === battle.sessionId ? "Joining..." : battle.status === "active" ? "Join live" : "Join lobby"}
                </button>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/15 px-4 py-5 text-center">
              <div className="text-sm font-medium text-neutral-300">No public battles are open yet</div>
              <div className="mt-1 text-xs text-neutral-500">Use a code below, or create the first public battle.</div>
            </div>
          )}
        </div>
      </section>

    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl rounded-2xl border border-blue-400/15 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_42%),rgba(10,10,11,0.9)] p-5 text-center sm:p-7"
    >
      <StatusBadge>Code-only battles</StatusBadge>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
        Have a private battle code?
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-neutral-400">
        Enter it here. Public battles use the one-tap Join buttons above and never require a code.
      </p>
      <div className="mx-auto mt-5 max-w-sm">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength="6"
          aria-label="Six-digit battle code"
          placeholder="000000"
          className={`${fieldClass} min-h-14 text-center font-mono text-2xl font-semibold tracking-[0.28em]`}
        />
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="mt-3 min-h-12 w-full rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Joining battle..." : "Join battle"}
        </button>
      </div>
      {error ? <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div> : null}
    </form>
    </div>
  );
}

function BattleItEntry({ roomId, state, onStateChange }) {
  const [view, setView] = useState("join");

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_34%),rgba(10,10,11,0.88)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <StatusBadge>Battle It</StatusBadge>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
              Join a battle or build your own
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-400">
              Join public battles instantly, use a code for private ones, or turn your own notes into a reviewed live challenge.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 rounded-xl border border-white/8 bg-black/25 p-1 sm:w-auto sm:min-w-[19rem]" role="tablist" aria-label="Battle It actions">
            <button
              type="button"
              role="tab"
              aria-selected={view === "join"}
              onClick={() => setView("join")}
              className={`min-h-10 rounded-lg px-4 py-2 text-sm font-semibold transition ${view === "join" ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white"}`}
            >
              Join a battle
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "create"}
              onClick={() => setView("create")}
              className={`min-h-10 rounded-lg px-4 py-2 text-sm font-semibold transition ${view === "create" ? "bg-cyan-300 text-neutral-950" : "text-neutral-400 hover:text-white"}`}
            >
              Create a battle
            </button>
          </div>
        </div>
      </div>

      <div className={view === "join" ? "block" : "hidden"} role="tabpanel">
        <JoinBattleForm roomId={roomId} onStateChange={onStateChange} refreshKey={state} />
      </div>
      <div className={view === "create" ? "block" : "hidden"} role="tabpanel">
        <CreateBattleForm
          roomId={roomId}
          onStateChange={onStateChange}
          previousBattle={state?.status === "completed" ? state : null}
        />
      </div>
    </section>
  );
}

function JoinCodeCard({ state, compact = false }) {
  const [copied, setCopied] = useState(false);
  const code = state.joinCode || "";

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (state.visibility === "public") {
    return (
      <div className={`rounded-2xl border border-emerald-300/18 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_42%),rgba(16,185,129,0.06)] ${compact ? "p-3.5" : "p-4"}`}>
        <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/75">
              Public access
            </div>
            <div className="mt-1.5 text-lg font-semibold text-white">
              No code required
            </div>
            <div className="mt-1 text-xs leading-5 text-neutral-400">
              {state.status === "draft"
                ? "This battle becomes discoverable under Open battles when you open the lobby."
                : `${state.playerCount || 1} player${(state.playerCount || 1) === 1 ? "" : "s"} joined · anyone signed in can join instantly.`}
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
            Open to everyone
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-blue-300/18 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_40%),rgba(59,130,246,0.07)] ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/70">
            Code-only join code
          </div>
          {code ? (
            <div className="mt-1.5 font-mono text-3xl font-semibold tracking-[0.2em] text-white">
              {code}
            </div>
          ) : (
            <div className="mt-2 text-sm font-medium text-blue-100">
              Preparing your code automatically...
            </div>
          )}
          <div className="mt-1 text-xs leading-5 text-neutral-400">
            {state.status === "draft"
              ? "Players with this code can enter now and wait while you finish reviewing."
              : `${state.playerCount || 1} player${(state.playerCount || 1) === 1 ? "" : "s"} joined by code.`}
          </div>
        </div>

        {code ? (
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-10 shrink-0 rounded-xl border border-blue-200/20 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-blue-100 transition hover:bg-white/[0.09]"
          >
            {copied ? "Code copied" : "Copy code"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DraftReview({ roomId, state, onStateChange }) {
  const [title, setTitle] = useState(state.title || "Battle It Challenge");
  const [difficulty, setDifficulty] = useState(state.difficulty || "medium");
  const [answerMode, setAnswerMode] = useState(state.answerMode || "text");
  const [visibility, setVisibility] = useState(state.visibility || "code-only");
  const [duration, setDuration] = useState(state.questionDurationSeconds || 20);
  const [revealDelay, setRevealDelay] = useState(state.revealDelaySeconds || 5);
  const [questions, setQuestions] = useState(state.questions || []);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTitle(state.title || "Battle It Challenge");
    setDifficulty(state.difficulty || "medium");
    setAnswerMode(state.answerMode || "text");
    setVisibility(state.visibility || "code-only");
    setDuration(state.questionDurationSeconds || 20);
    setRevealDelay(state.revealDelaySeconds || 5);
    setQuestions(state.questions || []);
  }, [state]);

  const concepts = useMemo(
    () => new Set(questions.map((question) => question.concept.trim().toLowerCase()).filter(Boolean)).size,
    [questions]
  );
  const safeActiveQuestionIndex = Math.min(
    activeQuestionIndex,
    Math.max(questions.length - 1, 0)
  );
  const activeQuestion = questions[safeActiveQuestionIndex] || null;
  const reviewProgress = questions.length
    ? Math.round(((safeActiveQuestionIndex + 1) / questions.length) * 100)
    : 0;

  const updateQuestion = (index, field, value) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question
      )
    );
  };

  const updateCorrectAnswer = (index, value) => {
    setQuestions((current) =>
      current.map((question, questionIndex) => {
        if (questionIndex !== index) return question;
        const previousAnswer = question.correctAnswer || "";
        const answerOptions = (question.answerOptions || []).map((option) =>
          option.trim().toLowerCase() === previousAnswer.trim().toLowerCase()
            ? value
            : option
        );
        return { ...question, correctAnswer: value, answerOptions };
      })
    );
  };

  const handleAnswerModeChange = (value) => {
    setAnswerMode(value);
    if (value !== "multiple-choice") return;

    setQuestions((current) =>
      current.map((question) => {
        const options = [...(question.answerOptions || [])];
        if (
          !options.some(
            (option) =>
              option.trim().toLowerCase() ===
              question.correctAnswer.trim().toLowerCase()
          )
        ) {
          options.unshift(question.correctAnswer);
        }
        return { ...question, answerOptions: options.slice(0, 4) };
      })
    );
  };

  const payload = () => ({
    title,
    difficulty,
    answerMode,
    visibility,
    questionDurationSeconds: duration,
    revealDelaySeconds: revealDelay,
    questions: questions.map((question) => ({
      ...question,
      acceptedAnswers: Array.isArray(question.acceptedAnswers)
        ? question.acceptedAnswers
        : String(question.acceptedAnswers || "")
            .split(/[,\n]/)
            .map((value) => value.trim())
            .filter(Boolean),
    })),
  });

  const save = async () => {
    const next = await updateBattleItDraft(roomId, state.sessionId, payload());
    onStateChange(next);
    return next;
  };

  const handleSave = async () => {
    setBusy("save");
    setMessage("");
    try {
      await save();
      setMessage("Draft saved. Review it once more, then open the lobby.");
    } catch (error) {
      setMessage(apiMessage(error, "Could not save this draft."));
    } finally {
      setBusy("");
    }
  };

  const handleOpen = async () => {
    setBusy("open");
    setMessage("");
    try {
      await save();
      onStateChange(await openBattleItLobby(roomId, state.sessionId));
    } catch (error) {
      setMessage(apiMessage(error, "Could not open the lobby."));
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="rounded-2xl border border-violet-400/15 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_34%),rgba(10,10,11,0.9)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StatusBadge tone="violet">Human review required</StatusBadge>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Review your Battle It pack</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {questions.length} questions cover {concepts} concepts. Every proof excerpt appears only after its answer is revealed.
          </p>
        </div>
        <StatusBadge tone="green">{state.model || "GPT-5.6"}</StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Create battle progress">
        {["Source", "Game setup", "Review"].map((label, index) => (
          <div
            key={label}
            className={`rounded-xl border px-2.5 py-2 ${
              index === 2
                ? "border-violet-300/35 bg-violet-300/10"
                : "border-emerald-300/20 bg-emerald-400/[0.07]"
            }`}
          >
            <div className={`text-[10px] font-semibold ${index === 2 ? "text-violet-100" : "text-emerald-200"}`}>
              {index === 2 ? "03" : "Done"}
            </div>
            <div className={`mt-0.5 truncate text-[11px] ${index === 2 ? "text-white" : "text-neutral-500"}`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <JoinCodeCard state={{ ...state, visibility }} compact />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_9rem_10rem_9rem_9rem_9rem]">
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Battle title
          </span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} placeholder="Battle title" />
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Access
          </span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className={fieldClass}>
            <option value="code-only">Code-only</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Difficulty
          </span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className={fieldClass}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Answer mode
          </span>
          <select value={answerMode} onChange={(event) => handleAnswerModeChange(event.target.value)} className={fieldClass}>
            <option value="text">Type answer</option>
            <option value="multiple-choice">4 choices</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Answer time
          </span>
          <select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className={fieldClass}>
            <option value="15">15 sec</option>
            <option value="20">20 sec</option>
            <option value="30">30 sec</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Reveal time
          </span>
          <select value={revealDelay} onChange={(event) => setRevealDelay(Number(event.target.value))} className={fieldClass}>
            <option value="3">3 sec</option>
            <option value="5">5 sec</option>
            <option value="8">8 sec</option>
            <option value="10">10 sec</option>
            <option value="15">15 sec</option>
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-3 sm:p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/75">
              Review progress
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              Question {safeActiveQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          <div className="text-xs text-neutral-500">
            Check the answer, explanation, and proof before moving on.
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-violet-400 transition-all duration-300"
            style={{ width: `${reviewProgress}%` }}
          />
        </div>
      </div>

      {activeQuestion ? (
        <div className="mt-3">
          <article key={activeQuestion.questionId} className="rounded-2xl border border-white/8 bg-black/20 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-white">Question {safeActiveQuestionIndex + 1}</div>
              <button
                type="button"
                disabled={questions.length <= 4}
                onClick={() => {
                  setQuestions((current) =>
                    current.filter((_, itemIndex) => itemIndex !== safeActiveQuestionIndex)
                  );
                  setActiveQuestionIndex((current) =>
                    Math.max(0, Math.min(current, questions.length - 2))
                  );
                }}
                className="rounded-lg border border-red-400/15 px-2 py-1 text-[11px] text-red-200 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_9rem]">
              <input value={activeQuestion.concept} onChange={(event) => updateQuestion(safeActiveQuestionIndex, "concept", event.target.value)} className={fieldClass} placeholder="Concept" />
              <select value={activeQuestion.difficulty} onChange={(event) => updateQuestion(safeActiveQuestionIndex, "difficulty", event.target.value)} className={fieldClass}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <textarea rows="3" value={activeQuestion.questionText} onChange={(event) => updateQuestion(safeActiveQuestionIndex, "questionText", event.target.value)} className={`${fieldClass} mt-2`} placeholder="Question" />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input value={activeQuestion.correctAnswer} onChange={(event) => updateCorrectAnswer(safeActiveQuestionIndex, event.target.value)} className={fieldClass} placeholder="Correct answer" />
              <input
                value={(activeQuestion.acceptedAnswers || []).join(", ")}
                onChange={(event) => updateQuestion(safeActiveQuestionIndex, "acceptedAnswers", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))}
                className={fieldClass}
                placeholder="Accepted variants"
              />
            </div>
            {answerMode === "multiple-choice" ? (
              <div className="mt-3 rounded-xl border border-cyan-300/12 bg-cyan-300/[0.04] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100/75">
                    Four player choices
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Include the correct answer once
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((optionIndex) => (
                    <label key={optionIndex} className="flex items-center gap-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-bold text-neutral-300">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <input
                        value={activeQuestion.answerOptions?.[optionIndex] || ""}
                        onChange={(event) => {
                          const nextOptions = [...(activeQuestion.answerOptions || [])];
                          nextOptions[optionIndex] = event.target.value;
                          updateQuestion(safeActiveQuestionIndex, "answerOptions", nextOptions);
                        }}
                        className={fieldClass}
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <textarea rows="3" value={activeQuestion.answerExplanation} onChange={(event) => updateQuestion(safeActiveQuestionIndex, "answerExplanation", event.target.value)} className={`${fieldClass} mt-2`} placeholder="Explanation" />
            <textarea rows="3" value={activeQuestion.sourceExcerpt} onChange={(event) => updateQuestion(safeActiveQuestionIndex, "sourceExcerpt", event.target.value)} className={`${fieldClass} mt-2 border-cyan-300/15`} placeholder="Proof excerpt from the notes" />
          </article>

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))}
              disabled={safeActiveQuestionIndex === 0}
              className="min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>
            <div className="text-center text-[11px] text-neutral-500">
              {safeActiveQuestionIndex === questions.length - 1
                ? "Final question"
                : `${questions.length - safeActiveQuestionIndex - 1} remaining`}
            </div>
            <button
              type="button"
              onClick={() =>
                setActiveQuestionIndex((current) =>
                  Math.min(questions.length - 1, current + 1)
                )
              }
              disabled={safeActiveQuestionIndex === questions.length - 1}
              className="min-h-11 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-neutral-300">{message}</div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-neutral-500">Opening the lobby locks the reviewed question order.</div>
        <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:w-auto">
          <button type="button" onClick={handleSave} disabled={!!busy} className="min-h-11 w-full rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {busy === "save" ? "Saving..." : "Save draft"}
          </button>
          <button type="button" onClick={handleOpen} disabled={!!busy} className="min-h-11 w-full rounded-xl bg-violet-400 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-60">
            {busy === "open" ? "Opening..." : "Open player lobby"}
          </button>
        </div>
      </div>
    </section>
  );
}

function WaitingLobby({ roomId, state, onStateChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setBusy(true);
    setError("");
    try {
      onStateChange(await startBattleIt(roomId, state.sessionId));
    } catch (requestError) {
      setError(apiMessage(requestError, "Could not start this battle."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-400/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_36%),rgba(10,10,11,0.9)] p-4 text-center sm:p-5">
      <StatusBadge tone="green">Players joining</StatusBadge>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white sm:text-2xl">{state.title}</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Hosted by {state.creatorDisplayName} · {state.questionCount} questions · {state.answerMode === "multiple-choice" ? "4 choices" : "typed answers"} · {state.questionDurationSeconds}s to answer · {state.revealDelaySeconds || 5}s reveal
      </p>
      <div className="mx-auto mt-4 max-w-md text-left">
        <JoinCodeCard state={state} />
      </div>
      <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-6 text-neutral-300">
        {state.visibility === "public"
          ? "This battle is listed under Open battles. Signed-in players join instantly without entering anything."
          : "Share the code with the players you want. Everyone who joins receives the same questions when the creator starts."}
      </div>
      {error ? <div className="mt-3 text-sm text-red-200">{error}</div> : null}
      {state.isCreator ? (
        <button type="button" onClick={handleStart} disabled={busy} className="mt-4 min-h-11 w-full rounded-xl bg-emerald-300 px-6 py-3 text-sm font-semibold text-neutral-950 disabled:opacity-60 sm:w-auto">
          {busy ? "Starting..." : "Start the battle"}
        </button>
      ) : (
        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Waiting for the creator</div>
      )}
    </section>
  );
}

function LiveStatus({ state, halftime, leaderboard, currentRoundNumber }) {
  const currentQuestionNumber = currentRoundNumber || state.currentQuestionNumber || 0;
  const progress = state.questionCount
    ? Math.min(100, Math.round((currentQuestionNumber / state.questionCount) * 100))
    : 0;

  return (
    <div className="space-y-3">
      <div className="px-1">
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          <span>Battle progress</span>
          <span className="text-cyan-100/80">
            {currentQuestionNumber} of {state.questionCount}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-cyan-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {halftime ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Halftime standings</div>
          <div className="mt-3 space-y-2">
            {(halftime.leaderboard || leaderboard || []).slice(0, 3).map((row) => (
              <div key={row.userId} className="flex items-center justify-between text-sm">
                <span className="text-white">#{row.rank} {row.displayName || row.username}</span>
                <span className="font-semibold text-amber-100">{row.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BattleItPanel({
  roomId,
  state,
  onStateChange,
  halftime,
  leaderboard,
  currentRoundNumber,
}) {
  if (!state) {
    return (
      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-8 text-center text-sm text-neutral-400">
        Loading Battle It studio...
      </div>
    );
  }

  const status = state?.status || "idle";

  if (status === "draft" && state?.isCreator) {
    return <DraftReview roomId={roomId} state={state} onStateChange={onStateChange} />;
  }

  if (status === "draft") {
    return (
      <section className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-5 text-center">
        <StatusBadge tone="violet">Creator review</StatusBadge>
        <h2 className="mt-3 text-xl font-semibold text-white">A new battle is being prepared</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-400">
          {state.creatorDisplayName || "The battle creator"} is checking the AI-generated pack before opening the player lobby. You can stay here.
        </p>
      </section>
    );
  }

  if (status === "lobby") {
    return <WaitingLobby roomId={roomId} state={state} onStateChange={onStateChange} />;
  }

  if (status === "active") {
    return (
      <LiveStatus
        state={state}
        halftime={halftime}
        leaderboard={leaderboard}
        currentRoundNumber={currentRoundNumber}
      />
    );
  }

  return <BattleItEntry roomId={roomId} state={state} onStateChange={onStateChange} />;
}
