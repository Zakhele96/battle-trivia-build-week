import { useEffect, useMemo, useState } from "react";
import {
  generateBattleItPack,
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
  const [sourceText, setSourceText] = useState("");
  const [images, setImages] = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionDurationSeconds, setQuestionDurationSeconds] = useState(20);
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
        questionDurationSeconds,
      });
      onStateChange(next);
    } catch (requestError) {
      setError(apiMessage(requestError, "Could not generate this Battle It pack."));
    } finally {
      setBusy(false);
    }
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
            <StatusBadge>Creator studio</StatusBadge>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
              Turn your notes into a live battle
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-400">
              Paste notes or upload two pages. GPT-5.6 creates as many strong, source-backed questions as the material supports, up to 20.
            </p>
          </div>
          <StatusBadge tone="green">One AI call</StatusBadge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
          <label className="block">
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
            <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-center transition hover:border-cyan-300/30">
              <span className="block text-sm font-semibold text-white">Upload note images</span>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">
                Up to two JPEG, PNG, or WebP pages. Maximum 5 MB each.
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImages}
                className="mt-3 block w-full text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-neutral-950"
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

            <div className="grid grid-cols-2 gap-2">
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-500">
            Minimum four usable questions. Weak or unsupported questions are never padded in.
          </div>
          <button
            type="submit"
            disabled={busy || sourceText.length > 12000}
            className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Reading notes and building your battle..." : "Generate Battle It pack"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DraftReview({ roomId, state, onStateChange }) {
  const [title, setTitle] = useState(state.title || "Battle It Challenge");
  const [difficulty, setDifficulty] = useState(state.difficulty || "medium");
  const [duration, setDuration] = useState(state.questionDurationSeconds || 20);
  const [questions, setQuestions] = useState(state.questions || []);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTitle(state.title || "Battle It Challenge");
    setDifficulty(state.difficulty || "medium");
    setDuration(state.questionDurationSeconds || 20);
    setQuestions(state.questions || []);
  }, [state]);

  const concepts = useMemo(
    () => new Set(questions.map((question) => question.concept.trim().toLowerCase()).filter(Boolean)).size,
    [questions]
  );

  const updateQuestion = (index, field, value) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question
      )
    );
  };

  const payload = () => ({
    title,
    difficulty,
    questionDurationSeconds: duration,
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

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_9rem_9rem]">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} placeholder="Battle title" />
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className={fieldClass}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className={fieldClass}>
          <option value="15">15 sec</option>
          <option value="20">20 sec</option>
          <option value="30">30 sec</option>
        </select>
      </div>

      <div className="mt-4 max-h-[38rem] space-y-3 overflow-y-auto pr-1">
        {questions.map((question, index) => (
          <article key={question.questionId} className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-white">Question {index + 1} of {questions.length}</div>
              <button
                type="button"
                disabled={questions.length <= 4}
                onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                className="rounded-lg border border-red-400/15 px-2 py-1 text-[11px] text-red-200 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_9rem]">
              <input value={question.concept} onChange={(event) => updateQuestion(index, "concept", event.target.value)} className={fieldClass} placeholder="Concept" />
              <select value={question.difficulty} onChange={(event) => updateQuestion(index, "difficulty", event.target.value)} className={fieldClass}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <textarea rows="2" value={question.questionText} onChange={(event) => updateQuestion(index, "questionText", event.target.value)} className={`${fieldClass} mt-2`} placeholder="Question" />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input value={question.correctAnswer} onChange={(event) => updateQuestion(index, "correctAnswer", event.target.value)} className={fieldClass} placeholder="Correct answer" />
              <input
                value={(question.acceptedAnswers || []).join(", ")}
                onChange={(event) => updateQuestion(index, "acceptedAnswers", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))}
                className={fieldClass}
                placeholder="Accepted variants"
              />
            </div>
            <textarea rows="2" value={question.answerExplanation} onChange={(event) => updateQuestion(index, "answerExplanation", event.target.value)} className={`${fieldClass} mt-2`} placeholder="Explanation" />
            <textarea rows="2" value={question.sourceExcerpt} onChange={(event) => updateQuestion(index, "sourceExcerpt", event.target.value)} className={`${fieldClass} mt-2 border-cyan-300/15`} placeholder="Proof excerpt from the notes" />
          </article>
        ))}
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-neutral-300">{message}</div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-neutral-500">Opening the lobby locks the reviewed question order.</div>
        <div className="flex gap-2">
          <button type="button" onClick={handleSave} disabled={!!busy} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {busy === "save" ? "Saving..." : "Save draft"}
          </button>
          <button type="button" onClick={handleOpen} disabled={!!busy} className="rounded-xl bg-violet-400 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-60">
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
    <section className="rounded-2xl border border-emerald-400/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_36%),rgba(10,10,11,0.9)] p-5 text-center">
      <StatusBadge tone="green">Players joining</StatusBadge>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{state.title}</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Hosted by {state.creatorDisplayName} · {state.questionCount} questions · {state.questionDurationSeconds}s each
      </p>
      <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-6 text-neutral-300">
        Share this room link. Everyone already here will receive the same questions simultaneously when the creator starts.
      </div>
      {error ? <div className="mt-3 text-sm text-red-200">{error}</div> : null}
      {state.isCreator ? (
        <button type="button" onClick={handleStart} disabled={busy} className="mt-4 rounded-xl bg-emerald-300 px-6 py-3 text-sm font-semibold text-neutral-950 disabled:opacity-60">
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

  return (
    <CreateBattleForm
      roomId={roomId}
      onStateChange={onStateChange}
      previousBattle={status === "completed" ? state : null}
    />
  );
}
