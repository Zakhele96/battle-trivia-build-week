import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAdminTriviaQuestion,
  getAdminTriviaQuestions,
  getBattleTriviaSettings,
  setAdminTriviaQuestionActive,
  updateAdminTriviaQuestion,
  updateBattleTriviaSettings,
} from "../api/adminTriviaApi";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function createEmptyQuestionForm() {
  return {
    questionText: "",
    correctAnswer: "",
    acceptedAnswersText: "",
    category: "",
    difficulty: "",
    isActive: true,
  };
}

function createDefaultWindows() {
  return dayNames.map((_, dayOfWeek) => ({
    dayOfWeek,
    startTime: "18:00",
    endTime: "22:00",
    isActive: false,
  }));
}

function mergeWindows(windows = []) {
  const defaults = createDefaultWindows();
  const map = new Map(windows.map((x) => [x.dayOfWeek, x]));
  return defaults.map((item) => map.get(item.dayOfWeek) ?? item);
}

function parseAcceptedAnswers(text) {
  return text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminTriviaManagementPage() {
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [runMode, setRunMode] = useState("continuous");
  const [windows, setWindows] = useState(createDefaultWindows());
  const [sessionInfo, setSessionInfo] = useState(null);

  const [questionMessage, setQuestionMessage] = useState("");
  const [questionForm, setQuestionForm] = useState(createEmptyQuestionForm());
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [filters, setFilters] = useState({
    category: "",
    difficulty: "",
    isActive: "",
  });

  const filterParams = useMemo(() => {
    return {
      category: filters.category || undefined,
      difficulty: filters.difficulty || undefined,
      isActive:
        filters.isActive === ""
          ? undefined
          : filters.isActive === "true",
    };
  }, [filters]);

  async function loadQuestions() {
    setQuestionsLoading(true);
    setQuestionsError("");

    try {
      const data = await getAdminTriviaQuestions(filterParams);
      setQuestions(data);
    } catch {
      setQuestionsError("Failed to load questions.");
    } finally {
      setQuestionsLoading(false);
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    setSettingsError("");

    try {
      const data = await getBattleTriviaSettings();
      setRunMode(data.runMode || "continuous");
      setWindows(mergeWindows(data.windows || []));
      setSessionInfo({
        sessionId: data.sessionId,
        sessionType: data.sessionType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      });
    } catch {
      setSettingsError("Failed to load Battle Trivia settings.");
    } finally {
      setSettingsLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, [filterParams]);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleQuestionFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setQuestionForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question.id);
    setQuestionMessage("");
    setQuestionForm({
      questionText: question.questionText || "",
      correctAnswer: question.correctAnswer || "",
      acceptedAnswersText: (question.acceptedAnswers || []).join("\n"),
      category: question.category || "",
      difficulty: question.difficulty || "",
      isActive: !!question.isActive,
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setQuestionMessage("");
    setQuestionForm(createEmptyQuestionForm());
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setSavingQuestion(true);
    setQuestionMessage("");

    const payload = {
      questionText: questionForm.questionText.trim(),
      correctAnswer: questionForm.correctAnswer.trim(),
      acceptedAnswers: parseAcceptedAnswers(questionForm.acceptedAnswersText),
      category: questionForm.category.trim() || null,
      difficulty: questionForm.difficulty.trim() || null,
      isActive: questionForm.isActive,
    };

    try {
      if (editingQuestionId) {
        await updateAdminTriviaQuestion(editingQuestionId, payload);
        setQuestionMessage("Question updated.");
      } else {
        await createAdminTriviaQuestion(payload);
        setQuestionMessage("Question created.");
      }

      handleCancelEdit();
      await loadQuestions();
    } catch {
      setQuestionMessage("Failed to save question.");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleToggleQuestion = async (question) => {
    try {
      await setAdminTriviaQuestionActive(question.id, !question.isActive);
      await loadQuestions();
    } catch {
      setQuestionMessage("Failed to update question status.");
    }
  };

  const handleWindowChange = (dayOfWeek, field, value) => {
    setWindows((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsMessage("");
    setSettingsError("");

    try {
      const payload = {
        runMode,
        windows,
      };

      const data = await updateBattleTriviaSettings(payload);

      setRunMode(data.runMode || "continuous");
      setWindows(mergeWindows(data.windows || []));
      setSessionInfo({
        sessionId: data.sessionId,
        sessionType: data.sessionType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      });

      setSettingsMessage("Battle Trivia settings updated.");
    } catch {
      setSettingsError("Failed to update Battle Trivia settings.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-6 text-white lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_34%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,0.94)_52%,rgba(10,10,11,1)_100%)] shadow-2xl shadow-black/20">
          <div className="pointer-events-none h-px bg-white/10" />

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 transition-colors hover:text-blue-300"
                >
                  <span>←</span>
                  <span>Back to lobby</span>
                </Link>

                <div className="mt-4 text-[11px] uppercase tracking-[0.22em] text-blue-300/70">
                  Admin
                </div>
                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[34px]">
                  Battle Trivia control
                </h1>
                <p className="mt-3 max-w-[44rem] text-sm leading-6 text-neutral-400 sm:text-[15px]">
                  Manage live mode, weekly windows, and the question bank without
                  touching SQL.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Session
                </div>
                <div className="mt-1 text-sm font-medium text-white">
                  {sessionInfo?.sessionType || "Loading"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <section className="rounded-[26px] border border-white/10 bg-neutral-900/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Battle Trivia settings
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Switch between continuous mode and scheduled windows for the
                  active weekly session.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                Core
              </span>
            </div>

            {settingsLoading ? (
              <p className="mt-4 text-sm text-neutral-400">Loading settings...</p>
            ) : (
              <>
                <div className="mt-4 rounded-[22px] border border-white/6 bg-white/[0.03] p-4 text-sm text-neutral-300">
                  <div>Session type: {sessionInfo?.sessionType || "-"}</div>
                  <div>Period start: {formatDate(sessionInfo?.periodStart)}</div>
                  <div>Period end: {formatDate(sessionInfo?.periodEnd)}</div>
                </div>

                <form onSubmit={handleSaveSettings} className="mt-5 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Run mode
                    </label>
                    <select
                      value={runMode}
                      onChange={(e) => setRunMode(e.target.value)}
                      className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
                    >
                      <option value="continuous">Continuous</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Weekly windows</div>
                    <div className="space-y-3">
                      {windows.map((item) => (
                        <div
                          key={item.dayOfWeek}
                          className="grid gap-3 rounded-[20px] border border-white/6 bg-white/[0.03] p-3 md:grid-cols-[140px_90px_1fr_1fr]"
                        >
                          <div className="flex items-center font-medium text-neutral-200">
                            {dayNames[item.dayOfWeek]}
                          </div>

                          <label className="flex items-center gap-2 text-sm text-neutral-300">
                            <input
                              type="checkbox"
                              checked={item.isActive}
                              onChange={(e) =>
                                handleWindowChange(
                                  item.dayOfWeek,
                                  "isActive",
                                  e.target.checked
                                )
                              }
                            />
                            Active
                          </label>

                          <input
                            type="time"
                            value={item.startTime}
                            disabled={!item.isActive}
                            onChange={(e) =>
                              handleWindowChange(
                                item.dayOfWeek,
                                "startTime",
                                e.target.value
                              )
                            }
                            className="rounded-[16px] border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-blue-400/20 disabled:opacity-50"
                          />

                          <input
                            type="time"
                            value={item.endTime}
                            disabled={!item.isActive}
                            onChange={(e) =>
                              handleWindowChange(
                                item.dayOfWeek,
                                "endTime",
                                e.target.value
                              )
                            }
                            className="rounded-[16px] border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-blue-400/20 disabled:opacity-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {settingsError ? (
                    <div className="rounded-[18px] border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                      {settingsError}
                    </div>
                  ) : null}

                  {settingsMessage ? (
                    <div className="rounded-[18px] border border-emerald-900/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
                      {settingsMessage}
                    </div>
                  ) : null}

                  <button className="rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-5 py-3 font-medium text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all duration-200 hover:-translate-y-[1px]">
                    Save settings
                  </button>
                </form>
              </>
            )}
          </section>

          <section className="rounded-[26px] border border-white/10 bg-neutral-900/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Question bank
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Create, edit, filter, and activate questions without touching SQL.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                Questions
              </span>
            </div>

            <form
              onSubmit={handleSaveQuestion}
              className="mt-5 space-y-4 rounded-[24px] border border-white/8 bg-black/20 p-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="category"
                  placeholder="Category"
                  value={questionForm.category}
                  onChange={handleQuestionFormChange}
                  className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
                />

                <input
                  name="difficulty"
                  placeholder="Difficulty"
                  value={questionForm.difficulty}
                  onChange={handleQuestionFormChange}
                  className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
                />
              </div>

              <textarea
                name="questionText"
                rows="3"
                placeholder="Question text"
                value={questionForm.questionText}
                onChange={handleQuestionFormChange}
                className="w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
              />

              <input
                name="correctAnswer"
                placeholder="Correct answer"
                value={questionForm.correctAnswer}
                onChange={handleQuestionFormChange}
                className="w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
              />

              <textarea
                name="acceptedAnswersText"
                rows="4"
                placeholder="Accepted answers, one per line"
                value={questionForm.acceptedAnswersText}
                onChange={handleQuestionFormChange}
                className="w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
              />

              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={questionForm.isActive}
                  onChange={handleQuestionFormChange}
                />
                Active
              </label>

              {questionMessage ? (
                <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-blue-300">
                  {questionMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-5 py-3 font-medium text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-60"
                >
                  {savingQuestion
                    ? "Saving..."
                    : editingQuestionId
                    ? "Update question"
                    : "Create question"}
                </button>

                {editingQuestionId ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-3 text-white transition-all duration-200 hover:bg-white/[0.07]"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <input
                placeholder="Filter by category"
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
              />

              <input
                placeholder="Filter by difficulty"
                value={filters.difficulty}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, difficulty: e.target.value }))
                }
                className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
              />

              <select
                value={filters.isActive}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, isActive: e.target.value }))
                }
                className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-400/20"
              >
                <option value="">All statuses</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>
            </div>

            {questionsError ? (
              <div className="mt-4 rounded-[18px] border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {questionsError}
              </div>
            ) : null}

            {questionsLoading ? (
              <p className="mt-5 text-sm text-neutral-400">Loading questions...</p>
            ) : (
              <div className="mt-5 space-y-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-[24px] border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              question.isActive
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-white/[0.05] text-neutral-400"
                            }`}
                          >
                            {question.isActive ? "Active" : "Inactive"}
                          </span>

                          {question.category ? (
                            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs text-blue-300">
                              {question.category}
                            </span>
                          ) : null}

                          {question.difficulty ? (
                            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-300">
                              {question.difficulty}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-base font-semibold text-white">
                          {question.questionText}
                        </h3>

                        <p className="mt-2 text-sm text-neutral-300">
                          Correct answer:{" "}
                          <span className="font-medium text-white">
                            {question.correctAnswer}
                          </span>
                        </p>

                        <div className="mt-2 text-sm text-neutral-400">
                          Accepted answers:{" "}
                          {(question.acceptedAnswers || []).join(", ") || "-"}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(question)}
                          className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-white/[0.07]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleQuestion(question)}
                          className="rounded-[16px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-[1px]"
                        >
                          {question.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {questions.length === 0 ? (
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
                    No questions found.
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}