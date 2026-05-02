import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAdminLeaderboardSponsor,
  createAdminWordScrambleWord,
  createAdminTriviaQuestion,
  getAdminGrowthSnapshot,
  getAdminLeaderboardSponsors,
  getAdminUsers,
  getAdminWordScrambleWords,
  getAdminTriviaQuestions,
  getBattleTriviaSettings,
  getWordScrambleSettings,
  setAdminLeaderboardSponsorActive,
  setAdminUserAccess,
  setAdminWordScrambleWordActive,
  setAdminTriviaQuestionActive,
  setAdminTriviaQuestionsActiveBulk,
  updateAdminLeaderboardSponsor,
  updateAdminWordScrambleWord,
  updateAdminTriviaQuestion,
  updateBattleTriviaSettings,
  updateWordScrambleSettings,
} from "../api/adminTriviaApi";
import { getLeaderboard } from "../api/leaderboardsApi";
import {
  getRoomSessionStatus,
  getWordScrambleSessionStatus,
} from "../api/roomsApi";
import {
  createAdminRoom,
  getAdminRooms,
  getRoomModerationActions,
  setAdminRoomActive,
  updateRoomSlowMode,
} from "../api/roomModerationApi";
import {
  buildPromoCaption,
  buildShareImageUrl,
  buildShareUrl,
  downloadShareCardPng,
  getModeLabel,
  getPeriodLabel,
} from "../services/leaderboardShare";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const emptyQuestionForm = {
  questionText: "",
  correctAnswer: "",
  acceptedAnswersText: "",
  category: "",
  difficulty: "",
  questionImageUrl: "",
  answerImageUrl: "",
  answerExplanation: "",
  isActive: true,
};

const emptyScrambleWordForm = {
  answerWord: "",
  category: "",
  hint: "",
  isActive: true,
};

const emptyRoomForm = {
  name: "",
  slug: "",
  description: "",
  roomType: "chat",
  isActive: true,
  slowModeSeconds: 0,
};

const roomTypeOptions = [
  { value: "chat", label: "Chat" },
  { value: "trivia", label: "Trivia" },
  { value: "game", label: "Game" },
];

const sponsorPlacementOptions = [
  { key: "leaderboard-header", label: "Leaderboard header" },
  { key: "leaderboard-podium", label: "Leaderboard podium" },
  { key: "lobby-featured", label: "Lobby featured" },
  { key: "lobby-standings", label: "Lobby standings" },
  { key: "room-sidebar", label: "Room sidebar" },
];

function createEmptySponsorForm() {
  return {
    name: "",
    leaderboardMode: "battle-trivia",
    sponsorText: "This week's competition is sponsored by",
    description: "",
    websiteUrl: "",
    badgeImageUrl: "",
    callToActionLabel: "Visit sponsor",
    startsAt: "",
    endsAt: "",
    isActive: true,
    placements: sponsorPlacementOptions.map((item, index) => ({
      placementKey: item.key,
      isActive:
        item.key === "leaderboard-header" ||
        item.key === "lobby-featured" ||
        item.key === "room-sidebar",
      displayOrder: index,
    })),
  };
}

function toDateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildSponsorPayload(form) {
  return {
    name: form.name.trim(),
    leaderboardMode: form.leaderboardMode,
    sponsorText: form.sponsorText.trim(),
    description: form.description.trim() || null,
    websiteUrl: form.websiteUrl.trim() || null,
    badgeImageUrl: form.badgeImageUrl.trim() || null,
    callToActionLabel: form.callToActionLabel.trim() || null,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    isActive: form.isActive,
    displayPriority: 0,
    placements: form.placements.map((placement) => ({
      placementKey: placement.placementKey,
      isActive: !!placement.isActive,
      displayOrder: Number(placement.displayOrder) || 0,
    })),
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

function formatShortDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-blue-400/40 focus:bg-black/35";

const compactInputClass =
  "rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-blue-400/40";

function StatusPill({ children, tone = "neutral" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      : tone === "blue"
      ? "border-blue-400/25 bg-blue-500/10 text-blue-200"
      : tone === "amber"
      ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
      : tone === "violet"
      ? "border-violet-400/25 bg-violet-500/10 text-violet-200"
      : tone === "red"
      ? "border-red-400/25 bg-red-500/10 text-red-200"
      : "border-white/10 bg-white/[0.045] text-neutral-300";

  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, detail, tone = "neutral" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          {label}
        </div>
        <StatusPill tone={tone}>{value}</StatusPill>
      </div>
      {detail ? (
        <div className="mt-2 truncate text-[12px] text-neutral-400">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

function Panel({ title, description, eyebrow, action, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-900/75 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300/70">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-0.5 text-lg font-semibold tracking-[-0.02em] text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MiniLeaderboard({ title, rows = [], scoreKey = "score" }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <StatusPill>{rows.length}</StatusPill>
      </div>
      <div className="divide-y divide-white/6">
        {rows.slice(0, 5).map((row) => (
          <div
            key={`${title}-${row.userId}`}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">
                #{row.rank} {row.displayName || row.username}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-neutral-500">
                @{row.username}
              </div>
            </div>
            <div className="shrink-0 text-sm font-semibold text-blue-200">
              {row[scoreKey] ?? row.score} pts
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-4 text-sm text-neutral-500">
            No rows yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function buildAppUrl(path) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

const promoBoardOptions = [
  {
    key: "combined-current",
    label: "Combined current",
    mode: "combined",
    period: "current",
    rowsKey: "combined",
  },
  {
    key: "battle-trivia-current",
    label: "Battle Trivia current",
    mode: "battle-trivia",
    period: "current",
    rowsKey: "battle",
  },
  {
    key: "word-scramble-current",
    label: "Word Scramble current",
    mode: "word-scramble",
    period: "current",
    rowsKey: "scramble",
  },
  {
    key: "combined-previous",
    label: "Combined previous",
    mode: "combined",
    period: "previous",
    rowsKey: "previousCombined",
  },
];

export default function AdminTriviaManagementPage() {
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [bulkQuestionAction, setBulkQuestionAction] = useState("");

  const [scrambleWords, setScrambleWords] = useState([]);
  const [scrambleWordsLoading, setScrambleWordsLoading] = useState(true);
  const [scrambleWordsError, setScrambleWordsError] = useState("");
  const [scrambleWordMessage, setScrambleWordMessage] = useState("");
  const [scrambleWordForm, setScrambleWordForm] = useState(emptyScrambleWordForm);
  const [editingScrambleWordId, setEditingScrambleWordId] = useState(null);
  const [savingScrambleWord, setSavingScrambleWord] = useState(false);

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [runMode, setRunMode] = useState("continuous");
  const [windows, setWindows] = useState(createDefaultWindows());
  const [sessionInfo, setSessionInfo] = useState(null);
  const [battleTriviaQuestionDurationSeconds, setBattleTriviaQuestionDurationSeconds] =
    useState(20);
  const [battleTriviaRevealDelaySeconds, setBattleTriviaRevealDelaySeconds] =
    useState(5);
  const [battleTriviaMediaEnabled, setBattleTriviaMediaEnabled] =
    useState(false);
  const [wordScrambleRoundDurationSeconds, setWordScrambleRoundDurationSeconds] =
    useState(30);
  const [wordScrambleRevealDurationSeconds, setWordScrambleRevealDurationSeconds] =
    useState(5);

  const [rooms, setRooms] = useState([]);
  const [roomStatuses, setRoomStatuses] = useState({});
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [moderationActions, setModerationActions] = useState([]);
  const [slowModeDraft, setSlowModeDraft] = useState(0);
  const [moderationMessage, setModerationMessage] = useState("");
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [roomMessage, setRoomMessage] = useState("");
  const [savingRoom, setSavingRoom] = useState(false);
  const [updatingRoomId, setUpdatingRoomId] = useState("");

  const [leaderboards, setLeaderboards] = useState({
    combined: [],
    battle: [],
    scramble: [],
    previousCombined: [],
  });
  const [adminView, setAdminView] = useState("ops");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(true);
  const [adminUsersError, setAdminUsersError] = useState("");
  const [adminUsersMessage, setAdminUsersMessage] = useState("");
  const [adminUserQuery, setAdminUserQuery] = useState("");
  const [updatingAdminUserId, setUpdatingAdminUserId] = useState("");
  const [sponsors, setSponsors] = useState([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(true);
  const [sponsorsError, setSponsorsError] = useState("");
  const [sponsorMessage, setSponsorMessage] = useState("");
  const [sponsorForm, setSponsorForm] = useState(createEmptySponsorForm());
  const [editingSponsorId, setEditingSponsorId] = useState(null);
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [updatingSponsorId, setUpdatingSponsorId] = useState("");
  const [adminToolsMessage, setAdminToolsMessage] = useState("");
  const [promoBoardKey, setPromoBoardKey] = useState("combined-current");
  const [promoUserId, setPromoUserId] = useState("");
  const [growthSnapshot, setGrowthSnapshot] = useState(null);

  const [filters, setFilters] = useState({
    category: "",
    difficulty: "",
    isActive: "",
  });

  const [scrambleWordFilters, setScrambleWordFilters] = useState({
    category: "",
    isActive: "",
  });

  const filterParams = useMemo(
    () => ({
      category: filters.category || undefined,
      difficulty: filters.difficulty || undefined,
      isActive:
        filters.isActive === "" ? undefined : filters.isActive === "true",
    }),
    [filters]
  );

  const scrambleWordFilterParams = useMemo(
    () => ({
      category: scrambleWordFilters.category || undefined,
      isActive:
        scrambleWordFilters.isActive === ""
          ? undefined
          : scrambleWordFilters.isActive === "true",
    }),
    [scrambleWordFilters]
  );

  const adminUserParams = useMemo(
    () => ({
      query: adminUserQuery.trim() || undefined,
      take: 60,
    }),
    [adminUserQuery]
  );

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;
  const featuredBattleRoom =
    rooms.find((room) => room.isActive && room.slug === "battle-trivia") ||
    rooms.find((room) => room.isActive && room.roomType === "trivia") ||
    null;
  const activeRoomCount = rooms.filter((room) => room.isActive).length;
  const inactiveRoomCount = Math.max(0, rooms.length - activeRoomCount);
  const activeQuestions = questions.filter((q) => q.isActive).length;
  const inactiveQuestions = Math.max(0, questions.length - activeQuestions);
  const activeScrambleWords = scrambleWords.filter((word) => word.isActive).length;
  const inactiveScrambleWords = Math.max(0, scrambleWords.length - activeScrambleWords);
  const adminUserCount = adminUsers.filter((user) => user.isAdmin).length;
  const activeWindows = windows.filter((w) => w.isActive).length;
  const activeSponsors = sponsors.filter((sponsor) => sponsor.isActive).length;
  const battleStatus = Object.values(roomStatuses).find(
    (item) => item?.mode === "battle"
  );
  const scrambleStatus = Object.values(roomStatuses).find(
    (item) => item?.mode === "scramble"
  );
  const selectedPromoBoard =
    promoBoardOptions.find((option) => option.key === promoBoardKey) ||
    promoBoardOptions[0];
  const promoRows = leaderboards[selectedPromoBoard.rowsKey] || [];
  const selectedPromoRow =
    promoRows.find((row) => row.userId === promoUserId) || promoRows[0] || null;
  const promoShareUrl = selectedPromoRow
    ? buildShareUrl(
        selectedPromoBoard.mode,
        selectedPromoBoard.period,
        selectedPromoRow.userId
      )
    : "";
  const promoImageUrl = selectedPromoRow
    ? buildShareImageUrl(
        selectedPromoBoard.mode,
        selectedPromoBoard.period,
        selectedPromoRow.userId
      )
    : "";
  const promoCaption = selectedPromoRow
    ? buildPromoCaption({
        row: selectedPromoRow,
        mode: selectedPromoBoard.mode,
        period: selectedPromoBoard.period,
        label: getModeLabel(selectedPromoBoard.mode),
      })
    : "";

  async function loadQuestions() {
    setQuestionsLoading(true);
    setQuestionsError("");

    try {
      setQuestions(await getAdminTriviaQuestions(filterParams));
    } catch {
      setQuestionsError("Failed to load questions.");
    } finally {
      setQuestionsLoading(false);
    }
  }

  async function loadScrambleWords() {
    setScrambleWordsLoading(true);
    setScrambleWordsError("");

    try {
      setScrambleWords(await getAdminWordScrambleWords(scrambleWordFilterParams));
    } catch {
      setScrambleWordsError("Failed to load scramble words.");
    } finally {
      setScrambleWordsLoading(false);
    }
  }

  async function loadAdminUsers() {
    setAdminUsersLoading(true);
    setAdminUsersError("");

    try {
      setAdminUsers(await getAdminUsers(adminUserParams));
    } catch {
      setAdminUsersError("Failed to load users.");
    } finally {
      setAdminUsersLoading(false);
    }
  }

  async function loadSponsors() {
    setSponsorsLoading(true);
    setSponsorsError("");

    try {
      setSponsors(await getAdminLeaderboardSponsors());
    } catch {
      setSponsorsError("Failed to load sponsors.");
    } finally {
      setSponsorsLoading(false);
    }
  }

  async function loadGrowthSnapshot() {
    try {
      setGrowthSnapshot(await getAdminGrowthSnapshot());
    } catch {
      setGrowthSnapshot(null);
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    setSettingsError("");

    try {
      const data = await getBattleTriviaSettings();
      const scrambleData = await getWordScrambleSettings();
      setRunMode(data.runMode || "continuous");
      setWindows(mergeWindows(data.windows || []));
      setBattleTriviaQuestionDurationSeconds(
        Number(data.questionDurationSeconds) || 20
      );
      setBattleTriviaRevealDelaySeconds(
        Number(data.revealDelaySeconds) || 5
      );
      setBattleTriviaMediaEnabled(!!data.mediaEnabled);
      setWordScrambleRoundDurationSeconds(
        Number(scrambleData.roundDurationSeconds) || 30
      );
      setWordScrambleRevealDurationSeconds(
        Number(scrambleData.revealDurationSeconds) || 5
      );
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

  async function loadRoomsAndStatuses() {
    try {
      const nextRooms = await getAdminRooms();
      setRooms(nextRooms);
      setSelectedRoomId((current) => current || nextRooms[0]?.id || "");

      const entries = await Promise.all(
        nextRooms.map(async (room) => {
          try {
            if (!room.isActive) {
              return [room.id, { mode: "room", statusText: "Inactive" }];
            }

            if (room.slug === "battle-trivia" || room.roomType === "trivia") {
              const status = await getRoomSessionStatus(room.id);
              return [room.id, { ...status, mode: "battle" }];
            }

            if (room.slug === "word-scramble") {
              const status = await getWordScrambleSessionStatus(room.id);
              return [room.id, { ...status, mode: "scramble" }];
            }
          } catch {
            return [room.id, { mode: "room", statusText: "Unavailable" }];
          }

          return [room.id, { mode: "room", statusText: "Chat room" }];
        })
      );

      setRoomStatuses(Object.fromEntries(entries));
    } catch {
      setRooms([]);
      setRoomStatuses({});
    }
  }

  async function loadLeaderboards() {
    const [combined, battle, scramble, previousCombined] = await Promise.all([
      getLeaderboard("combined", "current", 10).catch(() => ({ rows: [] })),
      getLeaderboard("battle-trivia", "current", 10).catch(() => ({ rows: [] })),
      getLeaderboard("word-scramble", "current", 10).catch(() => ({ rows: [] })),
      getLeaderboard("combined", "previous", 10).catch(() => ({ rows: [] })),
    ]);

    setLeaderboards({
      combined: combined.rows || [],
      battle: battle.rows || [],
      scramble: scramble.rows || [],
      previousCombined: previousCombined.rows || [],
    });
  }

  async function refreshAdminWorkspace() {
    setAdminToolsMessage("");

    try {
      await Promise.all([
        loadSettings(),
        loadRoomsAndStatuses(),
        loadLeaderboards(),
        loadSponsors(),
        loadGrowthSnapshot(),
        loadQuestions(),
        loadScrambleWords(),
        loadAdminUsers(),
      ]);
      setAdminToolsMessage("Admin data refreshed.");
    } catch {
      setAdminToolsMessage("Could not refresh everything.");
    }
  }

  async function copyAdminLink(path, label) {
    try {
      await navigator.clipboard.writeText(buildAppUrl(path));
      setAdminToolsMessage(`${label} link copied.`);
    } catch {
      setAdminToolsMessage(`Could not copy ${label.toLowerCase()} link.`);
    }
  }

  async function copyTextValue(value, successMessage, errorMessage) {
    if (!value) {
      setAdminToolsMessage(errorMessage);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setAdminToolsMessage(successMessage);
    } catch {
      setAdminToolsMessage(errorMessage);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, [filterParams]);

  useEffect(() => {
    loadScrambleWords();
  }, [scrambleWordFilterParams]);

  useEffect(() => {
    loadAdminUsers();
  }, [adminUserParams]);

  useEffect(() => {
    loadSettings();
    loadRoomsAndStatuses();
    loadLeaderboards();
    loadSponsors();
    loadGrowthSnapshot();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) return;

    const room = rooms.find((item) => item.id === selectedRoomId);
    setSlowModeDraft(room?.slowModeSeconds ?? 0);
    setModerationMessage("");

    getRoomModerationActions(selectedRoomId, 16)
      .then(setModerationActions)
      .catch(() => setModerationActions([]));
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!promoRows.length) {
      setPromoUserId("");
      return;
    }

    if (!promoRows.some((row) => row.userId === promoUserId)) {
      setPromoUserId(promoRows[0].userId);
    }
  }, [promoRows, promoUserId]);

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
      questionImageUrl: question.questionImageUrl || "",
      answerImageUrl: question.answerImageUrl || "",
      answerExplanation: question.answerExplanation || "",
      isActive: !!question.isActive,
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setQuestionMessage("");
    setQuestionForm(emptyQuestionForm);
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
      questionImageUrl: questionForm.questionImageUrl.trim() || null,
      answerImageUrl: questionForm.answerImageUrl.trim() || null,
      answerExplanation: questionForm.answerExplanation.trim() || null,
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

  const handleBulkQuestionActiveChange = async (isActive) => {
    setBulkQuestionAction(isActive ? "on" : "off");
    setQuestionMessage("");

    try {
      const result = await setAdminTriviaQuestionsActiveBulk(isActive, {
        category: filters.category.trim() || undefined,
        difficulty: filters.difficulty.trim() || undefined,
        isActive:
          filters.isActive === "" ? undefined : filters.isActive === "true",
      });

      const affected = Number(result?.affected) || 0;
      setQuestionMessage(
        affected === 0
          ? `No filtered questions were turned ${isActive ? "on" : "off"}.`
          : `${affected} filtered question${affected === 1 ? "" : "s"} turned ${isActive ? "on" : "off"}.`
      );
      await loadQuestions();
    } catch {
      setQuestionMessage("Failed to update filtered questions.");
    } finally {
      setBulkQuestionAction("");
    }
  };

  const handleScrambleWordFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setScrambleWordForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditScrambleWord = (word) => {
    setEditingScrambleWordId(word.id);
    setScrambleWordMessage("");
    setScrambleWordForm({
      answerWord: word.answerWord || "",
      category: word.category || "",
      hint: word.hint || "",
      isActive: !!word.isActive,
    });
  };

  const handleCancelScrambleWordEdit = () => {
    setEditingScrambleWordId(null);
    setScrambleWordMessage("");
    setScrambleWordForm(emptyScrambleWordForm);
  };

  const handleSaveScrambleWord = async (e) => {
    e.preventDefault();
    setSavingScrambleWord(true);
    setScrambleWordMessage("");

    const payload = {
      answerWord: scrambleWordForm.answerWord.trim(),
      category: scrambleWordForm.category.trim() || null,
      hint: scrambleWordForm.hint.trim() || null,
      isActive: scrambleWordForm.isActive,
    };

    try {
      if (editingScrambleWordId) {
        await updateAdminWordScrambleWord(editingScrambleWordId, payload);
        setScrambleWordMessage("Scramble word updated.");
      } else {
        await createAdminWordScrambleWord(payload);
        setScrambleWordMessage("Scramble word created.");
      }

      handleCancelScrambleWordEdit();
      await loadScrambleWords();
    } catch {
      setScrambleWordMessage("Failed to save scramble word.");
    } finally {
      setSavingScrambleWord(false);
    }
  };

  const handleToggleScrambleWord = async (word) => {
    try {
      await setAdminWordScrambleWordActive(word.id, !word.isActive);
      await loadScrambleWords();
    } catch {
      setScrambleWordMessage("Failed to update scramble word status.");
    }
  };

  const handleToggleAdminUser = async (user) => {
    setUpdatingAdminUserId(user.id);
    setAdminUsersMessage("");

    try {
      const updated = await setAdminUserAccess(user.id, !user.isAdmin);
      setAdminUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setAdminUsersMessage(
        updated.isAdmin
          ? `${updated.displayName || updated.username} is now an admin.`
          : `${updated.displayName || updated.username} is no longer an admin.`
      );
    } catch (error) {
      setAdminUsersMessage(
        error?.response?.data?.message || "Failed to update admin access."
      );
    } finally {
      setUpdatingAdminUserId("");
    }
  };

  const handleRoomFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setSavingRoom(true);
    setRoomMessage("");

    try {
      const created = await createAdminRoom({
        name: roomForm.name.trim(),
        slug: roomForm.slug.trim().toLowerCase(),
        description: roomForm.description.trim() || null,
        roomType: roomForm.roomType,
        isActive: roomForm.isActive,
        slowModeSeconds: Number(roomForm.slowModeSeconds) || 0,
      });

      setRoomForm(emptyRoomForm);
      setRoomMessage(`Room created: ${created.name}.`);
      await loadRoomsAndStatuses();
      setSelectedRoomId(created.id);
    } catch (error) {
      setRoomMessage(
        error?.response?.data?.message || "Failed to create room."
      );
    } finally {
      setSavingRoom(false);
    }
  };

  const handleToggleRoomActive = async (room) => {
    setUpdatingRoomId(room.id);
    setRoomMessage("");

    try {
      const updated = await setAdminRoomActive(room.id, !room.isActive);
      setRoomMessage(
        updated.isActive
          ? `${updated.name} is now live.`
          : `${updated.name} is now disabled.`
      );
      await loadRoomsAndStatuses();
    } catch (error) {
      setRoomMessage(
        error?.response?.data?.message || "Failed to update room status."
      );
    } finally {
      setUpdatingRoomId("");
    }
  };

  const handleSponsorFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSponsorForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSponsorPlacementChange = (placementKey, field, value) => {
    setSponsorForm((prev) => ({
      ...prev,
      placements: prev.placements.map((placement) =>
        placement.placementKey === placementKey
          ? { ...placement, [field]: value }
          : placement
      ),
    }));
  };

  const handleEditSponsor = (sponsor) => {
    setEditingSponsorId(sponsor.id);
    setSponsorMessage("");

    const placementMap = new Map(
      (sponsor.placements || []).map((item) => [item.placementKey, item])
    );

    setSponsorForm({
      name: sponsor.name || "",
      leaderboardMode: sponsor.leaderboardMode || "battle-trivia",
      sponsorText:
        sponsor.sponsorText || "This week's competition is sponsored by",
      description: sponsor.description || "",
      websiteUrl: sponsor.websiteUrl || "",
      badgeImageUrl: sponsor.badgeImageUrl || "",
      callToActionLabel: sponsor.callToActionLabel || "Visit sponsor",
      startsAt: toDateTimeInputValue(sponsor.startsAt),
      endsAt: toDateTimeInputValue(sponsor.endsAt),
      isActive: !!sponsor.isActive,
      placements: sponsorPlacementOptions.map((option, index) => {
        const value = placementMap.get(option.key);
        return {
          placementKey: option.key,
          isActive: !!value?.isActive,
          displayOrder: value?.displayOrder ?? index,
        };
      }),
    });
  };

  const handleCancelSponsorEdit = () => {
    setEditingSponsorId(null);
    setSponsorMessage("");
    setSponsorForm(createEmptySponsorForm());
  };

  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    setSavingSponsor(true);
    setSponsorMessage("");

    try {
      const payload = buildSponsorPayload(sponsorForm);

      if (editingSponsorId) {
        await updateAdminLeaderboardSponsor(editingSponsorId, payload);
        setSponsorMessage("Sponsor updated.");
      } else {
        await createAdminLeaderboardSponsor(payload);
        setSponsorMessage("Sponsor created.");
      }

      handleCancelSponsorEdit();
      await loadSponsors();
    } catch (error) {
      setSponsorMessage(
        error?.response?.data?.message || "Failed to save sponsor."
      );
    } finally {
      setSavingSponsor(false);
    }
  };

  const handleToggleSponsor = async (sponsor) => {
    setUpdatingSponsorId(sponsor.id);
    setSponsorMessage("");

    try {
      await setAdminLeaderboardSponsorActive(sponsor.id, !sponsor.isActive);
      await loadSponsors();
    } catch (error) {
      setSponsorMessage(
        error?.response?.data?.message || "Failed to update sponsor."
      );
    } finally {
      setUpdatingSponsorId("");
    }
  };

  const handleWindowChange = (dayOfWeek, field, value) => {
    setWindows((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsMessage("");
    setSettingsError("");

    try {
      const [data, scrambleData] = await Promise.all([
        updateBattleTriviaSettings({
          runMode,
          windows,
          questionDurationSeconds: Number(battleTriviaQuestionDurationSeconds),
          revealDelaySeconds: Number(battleTriviaRevealDelaySeconds),
          mediaEnabled: battleTriviaMediaEnabled,
        }),
        updateWordScrambleSettings({
          roundDurationSeconds: Number(wordScrambleRoundDurationSeconds),
          revealDurationSeconds: Number(wordScrambleRevealDurationSeconds),
        }),
      ]);
      setRunMode(data.runMode || "continuous");
      setWindows(mergeWindows(data.windows || []));
      setBattleTriviaQuestionDurationSeconds(
        Number(data.questionDurationSeconds) || 20
      );
      setBattleTriviaRevealDelaySeconds(
        Number(data.revealDelaySeconds) || 5
      );
      setBattleTriviaMediaEnabled(!!data.mediaEnabled);
      setWordScrambleRoundDurationSeconds(
        Number(scrambleData.roundDurationSeconds) || 30
      );
      setWordScrambleRevealDurationSeconds(
        Number(scrambleData.revealDurationSeconds) || 5
      );
      setSessionInfo({
        sessionId: data.sessionId,
        sessionType: data.sessionType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      });
      setSettingsMessage("Battle Trivia settings updated.");
      await loadRoomsAndStatuses();
    } catch {
      setSettingsError("Failed to update Battle Trivia settings.");
    }
  };

  const handleSaveSlowMode = async () => {
    if (!selectedRoomId) return;

    setModerationMessage("");

    try {
      await updateRoomSlowMode(selectedRoomId, Number(slowModeDraft) || 0);
      setModerationMessage("Slow mode updated.");
      await loadRoomsAndStatuses();
      setModerationActions(await getRoomModerationActions(selectedRoomId, 16));
    } catch {
      setModerationMessage("Failed to update slow mode.");
    }
  };

  const handleOpenPromoShare = () => {
    if (!promoShareUrl) {
      setAdminToolsMessage("Choose a player first.");
      return;
    }

    window.open(promoShareUrl, "_blank", "noopener,noreferrer");
    setAdminToolsMessage("Public share page opened.");
  };

  const handleDownloadPromoCard = async () => {
    if (!selectedPromoRow) {
      setAdminToolsMessage("Choose a player first.");
      return;
    }

    const playerName =
      selectedPromoRow.displayName || selectedPromoRow.username || "player";

    try {
      await downloadShareCardPng({
        mode: selectedPromoBoard.mode,
        period: selectedPromoBoard.period,
        userId: selectedPromoRow.userId,
        filenameBase: `${playerName}-${selectedPromoBoard.mode}-${selectedPromoBoard.period}-story-card`,
      });
      setAdminToolsMessage("Story card downloaded.");
    } catch {
      setAdminToolsMessage("Could not download story card.");
    }
  };

  return (
    <div className="admin-page min-h-screen bg-[linear-gradient(180deg,#050505_0%,#0a0a0b_46%,#050505_100%)] px-3 py-4 text-white sm:px-5">
      <div className="mx-auto max-w-[92rem]">
        <header className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_16%_0%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,rgba(23,23,23,0.96),rgba(10,10,10,0.9))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 transition hover:text-blue-200"
              >
                <span aria-hidden="true">&lt;-</span>
                <span>Lobby</span>
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  BTS Admin
                </h1>
                <StatusPill tone="blue">{sessionInfo?.sessionType || "Loading"}</StatusPill>
                <StatusPill tone={scrambleStatus?.hasActiveRound ? "green" : "violet"}>
                  Scramble {scrambleStatus?.hasActiveRound ? "live" : "weekly"}
                </StatusPill>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                <span>Battle: {formatShortDate(sessionInfo?.periodStart)} - {formatShortDate(sessionInfo?.periodEnd)}</span>
                <span>{rooms.length} rooms</span>
                <span>{questions.length + scrambleWords.length} content items</span>
              </div>
            </div>

            <div className="flex rounded-xl border border-white/10 bg-black/25 p-1">
              {[
                ["ops", "Operations"],
                ["content", "Content"],
                ["people", "People"],
                ["rankings", "Rankings"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAdminView(key)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    adminView === key
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Rooms"
              value={rooms.length}
              detail={`${activeRoomCount} active • ${inactiveRoomCount} inactive`}
              tone="blue"
            />
          <StatCard
            label="Trivia bank"
            value={`${activeQuestions}/${questions.length}`}
            detail={`${inactiveQuestions} inactive`}
            tone="violet"
          />
          <StatCard
            label="Battle Trivia"
            value={runMode === "scheduled" ? "Scheduled" : "Continuous"}
            detail={runMode === "scheduled" ? `${activeWindows} active windows` : battleStatus?.statusText || "Anytime"}
            tone={runMode === "scheduled" ? "amber" : "blue"}
          />
          <StatCard
            label="Scramble bank"
            value={`${activeScrambleWords}/${scrambleWords.length}`}
            detail={`${inactiveScrambleWords} inactive words`}
            tone={scrambleStatus?.hasActiveRound ? "green" : "violet"}
          />
          <StatCard
            label="System admins"
            value={adminUserCount}
            detail={`${adminUsers.length} users loaded`}
            tone="green"
          />
        </div>

        {adminView === "ops" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Panel
              eyebrow="Game control"
              title="Schedule"
              description="Battle Trivia timing and the weekly reset window at a glance."
              action={<StatusPill tone="blue">Core</StatusPill>}
            >
              {settingsLoading ? (
                <p className="text-sm text-neutral-400">Loading settings...</p>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.1fr]">
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Period
                      </div>
                      <div className="mt-2 text-sm text-white">
                        {formatShortDate(sessionInfo?.periodStart)} - {formatShortDate(sessionInfo?.periodEnd)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Word Scramble
                      </div>
                      <div className="mt-2 text-sm text-violet-200">
                        {wordScrambleRoundDurationSeconds}s round, {wordScrambleRevealDurationSeconds}s reveal
                      </div>
                    </div>
                    <label>
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Run mode
                      </span>
                      <select
                        value={runMode}
                        onChange={(e) => setRunMode(e.target.value)}
                        className={inputClass}
                      >
                        <option value="continuous">Continuous</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </label>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/8 bg-black/20">
                    <div className="grid grid-cols-[1fr_78px_96px_96px] gap-2 border-b border-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      <span>Day</span>
                      <span>Active</span>
                      <span>Start</span>
                      <span>End</span>
                    </div>
                    {windows.map((item) => (
                      <div
                        key={item.dayOfWeek}
                        className="grid grid-cols-[1fr_78px_96px_96px] items-center gap-2 border-b border-white/6 px-3 py-2 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-neutral-200">
                          {dayNames[item.dayOfWeek]}
                        </div>
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) =>
                            handleWindowChange(item.dayOfWeek, "isActive", e.target.checked)
                          }
                        />
                        <input
                          type="time"
                          value={item.startTime}
                          disabled={!item.isActive}
                          onChange={(e) =>
                            handleWindowChange(item.dayOfWeek, "startTime", e.target.value)
                          }
                          className={`${compactInputClass} disabled:opacity-40`}
                        />
                        <input
                          type="time"
                          value={item.endTime}
                          disabled={!item.isActive}
                          onChange={(e) =>
                            handleWindowChange(item.dayOfWeek, "endTime", e.target.value)
                          }
                          className={`${compactInputClass} disabled:opacity-40`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Battle Trivia timers
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label>
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                            Question seconds
                          </span>
                          <input
                            type="number"
                            min="5"
                            max="120"
                            value={battleTriviaQuestionDurationSeconds}
                            onChange={(e) =>
                              setBattleTriviaQuestionDurationSeconds(e.target.value)
                            }
                            className={inputClass}
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                            Reveal seconds
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={battleTriviaRevealDelaySeconds}
                            onChange={(e) =>
                              setBattleTriviaRevealDelaySeconds(e.target.value)
                            }
                            className={inputClass}
                          />
                        </label>
                      </div>

                      <label className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-300">
                        <input
                          type="checkbox"
                          checked={battleTriviaMediaEnabled}
                          onChange={(e) =>
                            setBattleTriviaMediaEnabled(e.target.checked)
                          }
                        />
                        Enable question images and answer reveal media
                      </label>
                    </div>

                    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Word Scramble timers
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label>
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                            Round seconds
                          </span>
                          <input
                            type="number"
                            min="5"
                            max="180"
                            value={wordScrambleRoundDurationSeconds}
                            onChange={(e) =>
                              setWordScrambleRoundDurationSeconds(e.target.value)
                            }
                            className={inputClass}
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                            Reveal seconds
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={wordScrambleRevealDurationSeconds}
                            onChange={(e) =>
                              setWordScrambleRevealDurationSeconds(e.target.value)
                            }
                            className={inputClass}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {settingsError ? (
                    <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                      {settingsError}
                    </div>
                  ) : null}
                  {settingsMessage ? (
                    <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
                      {settingsMessage}
                    </div>
                  ) : null}

                  <button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-blue-100">
                    Save settings
                  </button>
                </form>
              )}
            </Panel>

            <Panel
              eyebrow="Rooms"
              title="Room controls"
              description="Create rooms, switch them on or off, then adjust slow mode and inspect moderation history."
              action={<StatusPill tone="amber">Live</StatusPill>}
            >
              <form onSubmit={handleCreateRoom} className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    name="name"
                    placeholder="Room name"
                    value={roomForm.name}
                    onChange={handleRoomFormChange}
                    className={inputClass}
                  />
                  <input
                    name="slug"
                    placeholder="room-slug"
                    value={roomForm.slug}
                    onChange={handleRoomFormChange}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_9rem]">
                  <textarea
                    name="description"
                    rows="2"
                    placeholder="What the room is for"
                    value={roomForm.description}
                    onChange={handleRoomFormChange}
                    className={inputClass}
                  />
                  <select
                    name="roomType"
                    value={roomForm.roomType}
                    onChange={handleRoomFormChange}
                    className={inputClass}
                  >
                    {roomTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    name="slowModeSeconds"
                    placeholder="Slow mode"
                    value={roomForm.slowModeSeconds}
                    onChange={handleRoomFormChange}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={roomForm.isActive}
                      onChange={handleRoomFormChange}
                    />
                    Start active
                  </label>
                  <button
                    type="submit"
                    disabled={savingRoom}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-blue-100 disabled:opacity-60"
                  >
                    {savingRoom ? "Creating..." : "Create room"}
                  </button>
                </div>
              </form>

              {roomMessage ? (
                <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-blue-300">
                  {roomMessage}
                </div>
              ) : null}

              <div className="max-h-[19rem] divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/8 bg-black/20">
                {rooms.map((room) => {
                  const status = roomStatuses[room.id];
                  const selected = room.id === selectedRoomId;
                  return (
                    <div
                      key={room.id}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition ${
                        selected ? "bg-blue-500/10" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedRoomId(room.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm font-semibold text-white">
                          {room.name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                          <span>{room.slug}</span>
                          <span>•</span>
                          <span>{room.roomType}</span>
                          <span>•</span>
                          <span>{room.slowModeSeconds}s slow mode</span>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusPill tone={room.isActive ? "green" : "neutral"}>
                          {room.isActive ? "Active" : "Inactive"}
                        </StatusPill>
                        <StatusPill
                          tone={
                            !room.isActive
                              ? "neutral"
                              : status?.hasActiveRound || status?.isLiveNow
                              ? "green"
                              : status?.mode === "scramble"
                              ? "violet"
                              : "neutral"
                          }
                        >
                          {status?.statusText || "Ready"}
                        </StatusPill>
                        <button
                          type="button"
                          onClick={() => handleToggleRoomActive(room)}
                          disabled={updatingRoomId === room.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            room.isActive
                              ? "bg-red-500/12 text-red-200 hover:bg-red-500/18"
                              : "bg-emerald-500/12 text-emerald-200 hover:bg-emerald-500/18"
                          } disabled:opacity-60`}
                        >
                          {updatingRoomId === room.id
                            ? "Saving..."
                            : room.isActive
                            ? "Disable"
                            : "Enable"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedRoom ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {selectedRoom.name}
                        </div>
                        <div className="mt-0.5 text-[12px] text-neutral-400">
                          {selectedRoom.description || "No room description yet."}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusPill tone={selectedRoom.isActive ? "green" : "neutral"}>
                          {selectedRoom.isActive ? "Live" : "Disabled"}
                        </StatusPill>
                        <StatusPill tone="blue">{selectedRoom.roomType}</StatusPill>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={slowModeDraft}
                      onChange={(e) => setSlowModeDraft(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={handleSaveSlowMode}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      Save
                    </button>
                    {selectedRoom.isActive ? (
                      <Link
                        to={`/rooms/${selectedRoom.id}`}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-sm text-white transition hover:bg-white/[0.07]"
                      >
                        Open
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-2 text-center text-sm text-neutral-500">
                        Disabled
                      </div>
                    )}
                  </div>
                  {moderationMessage ? (
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-blue-300">
                      {moderationMessage}
                    </div>
                  ) : null}
                  <div className="max-h-[15rem] divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/8 bg-black/20">
                    {moderationActions.map((action) => (
                      <div key={action.id} className="px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium text-white">{action.actionType}</div>
                          <div className="text-[11px] text-neutral-500">{formatShortDate(action.createdAt)}</div>
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-neutral-400">
                          {action.targetDisplayName ? `Target: ${action.targetDisplayName}` : "Room-level action"}
                          {action.reason ? ` - ${action.reason}` : ""}
                        </div>
                      </div>
                    ))}
                    {moderationActions.length === 0 ? (
                      <div className="px-3 py-5 text-sm text-neutral-500">No recent moderation actions.</div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </Panel>
          </div>
        ) : null}

        {adminView === "content" ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Panel
              eyebrow="Battle Trivia"
              title={editingQuestionId ? "Edit question" : "Question bank"}
              description="Compact question editor with filters and active controls."
              action={<StatusPill tone="violet">{questions.length} items</StatusPill>}
            >
              <form onSubmit={handleSaveQuestion} className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="category" placeholder="Category" value={questionForm.category} onChange={handleQuestionFormChange} className={inputClass} />
                  <input name="difficulty" placeholder="Difficulty" value={questionForm.difficulty} onChange={handleQuestionFormChange} className={inputClass} />
                </div>
                <textarea name="questionText" rows="2" placeholder="Question text" value={questionForm.questionText} onChange={handleQuestionFormChange} className={inputClass} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="correctAnswer" placeholder="Correct answer" value={questionForm.correctAnswer} onChange={handleQuestionFormChange} className={inputClass} />
                  <textarea name="acceptedAnswersText" rows="1" placeholder="Accepted answers, one per line" value={questionForm.acceptedAnswersText} onChange={handleQuestionFormChange} className={inputClass} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="questionImageUrl" placeholder="Question image URL (optional)" value={questionForm.questionImageUrl} onChange={handleQuestionFormChange} className={inputClass} />
                  <input name="answerImageUrl" placeholder="Answer image URL (optional)" value={questionForm.answerImageUrl} onChange={handleQuestionFormChange} className={inputClass} />
                </div>
                <textarea name="answerExplanation" rows="2" placeholder="Answer explanation or fun fact (optional)" value={questionForm.answerExplanation} onChange={handleQuestionFormChange} className={inputClass} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input type="checkbox" name="isActive" checked={questionForm.isActive} onChange={handleQuestionFormChange} />
                    Active
                  </label>
                  <div className="flex gap-2">
                    {editingQuestionId ? (
                      <button type="button" onClick={handleCancelEdit} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.07]">
                        Cancel
                      </button>
                    ) : null}
                    <button type="submit" disabled={savingQuestion} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-60">
                      {savingQuestion ? "Saving..." : editingQuestionId ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              </form>

              {questionMessage ? (
                <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-blue-300">
                  {questionMessage}
                </div>
              ) : null}

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <input placeholder="Category" value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))} className={inputClass} />
                <input placeholder="Difficulty" value={filters.difficulty} onChange={(e) => setFilters((prev) => ({ ...prev, difficulty: e.target.value }))} className={inputClass} />
                <select value={filters.isActive} onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))} className={inputClass}>
                  <option value="">All statuses</option>
                  <option value="true">Active only</option>
                  <option value="false">Inactive only</option>
                </select>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                <div className="text-xs text-neutral-400">
                  Apply to the currently filtered Battle Trivia questions.
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={questionsLoading || bulkQuestionAction !== ""}
                    onClick={() => handleBulkQuestionActiveChange(true)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {bulkQuestionAction === "on" ? "Turning on..." : "Turn filtered on"}
                  </button>
                  <button
                    type="button"
                    disabled={questionsLoading || bulkQuestionAction !== ""}
                    onClick={() => handleBulkQuestionActiveChange(false)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                  >
                    {bulkQuestionAction === "off" ? "Turning off..." : "Turn filtered off"}
                  </button>
                </div>
              </div>

              {questionsError ? (
                <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">{questionsError}</div>
              ) : null}

              <div className="mt-4 max-h-[31rem] divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/8 bg-black/20">
                {questionsLoading ? (
                  <div className="px-3 py-5 text-sm text-neutral-400">Loading questions...</div>
                ) : (
                  questions.map((question) => (
                    <div key={question.id} className="px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-1.5">
                            <StatusPill tone={question.isActive ? "green" : "neutral"}>{question.isActive ? "Active" : "Inactive"}</StatusPill>
                            {question.category ? <StatusPill tone="blue">{question.category}</StatusPill> : null}
                            {question.difficulty ? <StatusPill tone="amber">{question.difficulty}</StatusPill> : null}
                          </div>
                          <div className="mt-2 line-clamp-2 text-sm font-semibold text-white">{question.questionText}</div>
                          <div className="mt-1 truncate text-xs text-neutral-400">Answer: {question.correctAnswer}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {question.questionImageUrl ? <StatusPill tone="blue">Question image</StatusPill> : null}
                            {question.answerImageUrl ? <StatusPill tone="amber">Answer image</StatusPill> : null}
                            {question.answerExplanation ? <StatusPill tone="violet">Explanation</StatusPill> : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => handleEditQuestion(question)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleToggleQuestion(question)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">
                            {question.isActive ? "Off" : "On"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {!questionsLoading && questions.length === 0 ? (
                  <div className="px-3 py-5 text-sm text-neutral-500">No questions found.</div>
                ) : null}
              </div>
            </Panel>

            <Panel
              eyebrow="Word Scramble"
              title={editingScrambleWordId ? "Edit word" : "Word bank"}
              description="Add and maintain scramble answers, hints, and categories."
              action={<StatusPill tone="green">{activeScrambleWords}/{scrambleWords.length} active</StatusPill>}
            >
              <form onSubmit={handleSaveScrambleWord} className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="answerWord" placeholder="Answer word" value={scrambleWordForm.answerWord} onChange={handleScrambleWordFormChange} className={inputClass} />
                  <input name="category" placeholder="Category" value={scrambleWordForm.category} onChange={handleScrambleWordFormChange} className={inputClass} />
                </div>
                <textarea name="hint" rows="2" placeholder="Hint" value={scrambleWordForm.hint} onChange={handleScrambleWordFormChange} className={inputClass} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input type="checkbox" name="isActive" checked={scrambleWordForm.isActive} onChange={handleScrambleWordFormChange} />
                    Active
                  </label>
                  <div className="flex gap-2">
                    {editingScrambleWordId ? (
                      <button type="button" onClick={handleCancelScrambleWordEdit} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.07]">
                        Cancel
                      </button>
                    ) : null}
                    <button type="submit" disabled={savingScrambleWord} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      {savingScrambleWord ? "Saving..." : editingScrambleWordId ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </form>

              {scrambleWordMessage ? (
                <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-blue-300">
                  {scrambleWordMessage}
                </div>
              ) : null}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <input placeholder="Category" value={scrambleWordFilters.category} onChange={(e) => setScrambleWordFilters((prev) => ({ ...prev, category: e.target.value }))} className={inputClass} />
                <select value={scrambleWordFilters.isActive} onChange={(e) => setScrambleWordFilters((prev) => ({ ...prev, isActive: e.target.value }))} className={inputClass}>
                  <option value="">All statuses</option>
                  <option value="true">Active only</option>
                  <option value="false">Inactive only</option>
                </select>
              </div>

              {scrambleWordsError ? (
                <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">{scrambleWordsError}</div>
              ) : null}

              <div className="mt-4 max-h-[31rem] divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/8 bg-black/20">
                {scrambleWordsLoading ? (
                  <div className="px-3 py-5 text-sm text-neutral-400">Loading words...</div>
                ) : (
                  scrambleWords.map((word) => (
                    <div key={word.id} className="px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-1.5">
                            <StatusPill tone={word.isActive ? "green" : "neutral"}>{word.isActive ? "Active" : "Inactive"}</StatusPill>
                            {word.category ? <StatusPill tone="blue">{word.category}</StatusPill> : null}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-white">{word.answerWord}</div>
                          <div className="mt-1 truncate text-xs text-neutral-400">Hint: {word.hint || "-"}</div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => handleEditScrambleWord(word)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleToggleScrambleWord(word)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">
                            {word.isActive ? "Off" : "On"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {!scrambleWordsLoading && scrambleWords.length === 0 ? (
                  <div className="px-3 py-5 text-sm text-neutral-500">No scramble words found.</div>
                ) : null}
              </div>
            </Panel>
          </div>
        ) : null}

        {adminView === "people" ? (
          <div className="mt-4">
            <Panel
              eyebrow="Access"
              title="Admin users"
              description="Promote trusted users so they can help moderate rooms and manage operations."
              action={<StatusPill tone="green">{adminUserCount} admins</StatusPill>}
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <input
                  placeholder="Search name, username, or email"
                  value={adminUserQuery}
                  onChange={(e) => setAdminUserQuery(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={loadAdminUsers}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                >
                  Refresh users
                </button>
              </div>

              {adminUsersMessage ? (
                <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-blue-300">
                  {adminUsersMessage}
                </div>
              ) : null}

              {adminUsersError ? (
                <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                  {adminUsersError}
                </div>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-xl border border-white/8 bg-black/20">
                <div className="hidden grid-cols-[1.2fr_1.2fr_110px_128px] gap-3 border-b border-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 md:grid">
                  <span>User</span>
                  <span>Email</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>

                {adminUsersLoading ? (
                  <div className="px-3 py-8 text-sm text-neutral-400">
                    Loading users...
                  </div>
                ) : (
                  <div className="max-h-[34rem] divide-y divide-white/6 overflow-y-auto">
                    {adminUsers.map((adminUser) => (
                      <div
                        key={adminUser.id}
                        className="grid gap-3 px-3 py-3 md:grid-cols-[1.2fr_1.2fr_110px_128px] md:items-center"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {adminUser.displayName || adminUser.username}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-neutral-500">
                            @{adminUser.username}
                          </div>
                        </div>
                        <div className="min-w-0 truncate text-sm text-neutral-300">
                          {adminUser.email}
                        </div>
                        <div>
                          <StatusPill tone={adminUser.isAdmin ? "green" : "neutral"}>
                            {adminUser.isAdmin ? "Admin" : "User"}
                          </StatusPill>
                        </div>
                        <button
                          type="button"
                          disabled={updatingAdminUserId === adminUser.id}
                          onClick={() => handleToggleAdminUser(adminUser)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                            adminUser.isAdmin
                              ? "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/15"
                              : "bg-emerald-500 text-white hover:bg-emerald-400"
                          }`}
                        >
                          {updatingAdminUserId === adminUser.id
                            ? "Saving..."
                            : adminUser.isAdmin
                            ? "Remove"
                            : "Make admin"}
                        </button>
                      </div>
                    ))}
                    {adminUsers.length === 0 ? (
                      <div className="px-3 py-8 text-sm text-neutral-500">
                        No users found.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </Panel>
          </div>
        ) : null}

        {adminView === "rankings" ? (
          <div className="mt-4">
            <Panel
              eyebrow="Client tools"
              title="Quick admin actions"
              description="Fast browser-side tools for jumping around the app, copying links, and refreshing the live admin view."
              action={<StatusPill tone="violet">No backend needed</StatusPill>}
            >
              <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={refreshAdminWorkspace}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
                  >
                    Refresh all admin data
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyAdminLink(
                        "/leaderboards?mode=combined&period=current",
                        "Combined leaderboard"
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                  >
                    Copy combined leaderboard link
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyAdminLink(
                        "/leaderboards?mode=battle-trivia&period=current",
                        "Battle Trivia leaderboard"
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                  >
                    Copy trivia leaderboard link
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyAdminLink(
                        featuredBattleRoom ? `/rooms/${featuredBattleRoom.id}` : "/rooms",
                        "Featured room"
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                  >
                    Copy featured room link
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <Link
                    to="/leaderboards?mode=combined&period=current"
                    className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-center text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15"
                  >
                    Open live rankings
                  </Link>
                  <Link
                    to={featuredBattleRoom ? `/rooms/${featuredBattleRoom.id}` : "/rooms"}
                    className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-center text-sm font-semibold text-amber-100 transition hover:bg-amber-500/15"
                  >
                    Open featured room
                  </Link>
                  <Link
                    to="/"
                    className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-center text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                  >
                    Open lobby
                  </Link>
                </div>
              </div>

              {adminToolsMessage ? (
                <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-blue-300">
                  {adminToolsMessage}
                </div>
              ) : null}
            </Panel>

            <div className="mt-4">
              <Panel
                eyebrow="Growth tools"
                title="Promo studio"
                description="Pick any player already on a board and instantly generate the public share page, caption, and downloadable story card."
                action={<StatusPill tone="amber">Social ready</StatusPill>}
              >
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="block">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                          Board
                        </div>
                        <select
                          value={promoBoardKey}
                          onChange={(e) => setPromoBoardKey(e.target.value)}
                          className={inputClass}
                        >
                          {promoBoardOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                          Player
                        </div>
                        <select
                          value={selectedPromoRow?.userId || ""}
                          onChange={(e) => setPromoUserId(e.target.value)}
                          className={inputClass}
                          disabled={!promoRows.length}
                        >
                          {promoRows.map((row) => (
                            <option key={row.userId} value={row.userId}>
                              #{row.rank} {row.displayName || row.username}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Promo preview
                      </div>
                      {selectedPromoRow ? (
                        <>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <StatusPill tone="blue">
                              {getModeLabel(selectedPromoBoard.mode)}
                            </StatusPill>
                            <StatusPill tone="violet">
                              {getPeriodLabel(selectedPromoBoard.period)}
                            </StatusPill>
                            <StatusPill tone="green">
                              #{selectedPromoRow.rank}
                            </StatusPill>
                          </div>
                          <div className="mt-3 text-lg font-semibold text-white">
                            {selectedPromoRow.displayName || selectedPromoRow.username}
                          </div>
                          <div className="mt-1 text-sm text-neutral-400">
                            @{selectedPromoRow.username} · {selectedPromoRow.score} pts
                          </div>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                copyTextValue(
                                  promoShareUrl,
                                  "Public share link copied.",
                                  "Could not copy public share link."
                                )
                              }
                              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
                            >
                              Copy public share link
                            </button>
                            <button
                              type="button"
                              onClick={handleOpenPromoShare}
                              className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15"
                            >
                              Open public share page
                            </button>
                            <button
                              type="button"
                              onClick={handleDownloadPromoCard}
                              className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/15"
                            >
                              Download story card
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyTextValue(
                                  promoCaption,
                                  "Promo caption copied.",
                                  "Could not copy promo caption."
                                )
                              }
                              className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                            >
                              Copy promo caption
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 text-sm text-neutral-500">
                          No leaderboard rows are available for this board yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Suggested caption
                      </div>
                      <div className="mt-3 rounded-xl border border-white/8 bg-black/20 p-3 text-sm leading-6 text-neutral-200">
                        {promoCaption || "Pick a player to generate a promo caption."}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Story card source
                      </div>
                      <div className="mt-3 rounded-xl border border-white/8 bg-black/20 p-3 text-xs leading-6 text-neutral-400 break-all">
                        {promoImageUrl || "No image available yet."}
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="mt-4">
              <Panel
                eyebrow="Growth analytics"
                title="Share-to-signup performance"
                description="This is the scoreboard for the viral loop itself: who is driving visits, who gets join clicks, and which boards convert."
                action={<StatusPill tone="green">Live attribution</StatusPill>}
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <StatCard
                    label="Share views"
                    value={growthSnapshot?.totalShareViews ?? 0}
                    detail="Opened public share pages"
                    tone="blue"
                  />
                  <StatCard
                    label="Join clicks"
                    value={growthSnapshot?.totalJoinClicks ?? 0}
                    detail="Clicked through to auth"
                    tone="amber"
                  />
                  <StatCard
                    label="Sign-ups"
                    value={growthSnapshot?.totalReferredSignups ?? 0}
                    detail="New accounts from shared flows"
                    tone="green"
                  />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">
                        Top sharers
                      </div>
                      <StatusPill tone="violet">
                        {(growthSnapshot?.topSharers || []).length}
                      </StatusPill>
                    </div>

                    <div className="space-y-2">
                      {(growthSnapshot?.topSharers || []).map((player) => (
                        <div
                          key={player.userId}
                          className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-white">
                                {player.displayName || player.username}
                              </div>
                              <div className="mt-1 text-xs text-neutral-500">
                                @{player.username}
                              </div>
                            </div>
                            <StatusPill tone="green">
                              {player.referredSignups} sign-ups
                            </StatusPill>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-400">
                            <div>{player.shareViews} views</div>
                            <div>{player.joinClicks} join clicks</div>
                          </div>
                        </div>
                      ))}

                      {(growthSnapshot?.topSharers || []).length === 0 ? (
                        <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-4 text-sm text-neutral-500">
                          No share performance data yet.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">
                        Board conversion
                      </div>
                      <StatusPill tone="blue">
                        {(growthSnapshot?.boardPerformance || []).length}
                      </StatusPill>
                    </div>

                    <div className="space-y-2">
                      {(growthSnapshot?.boardPerformance || []).map((board) => (
                        <div
                          key={`${board.leaderboardMode}-${board.leaderboardPeriod}`}
                          className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-white">
                              {getModeLabel(board.leaderboardMode)}
                            </div>
                            <StatusPill tone="violet">
                              {getPeriodLabel(board.leaderboardPeriod)}
                            </StatusPill>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-neutral-400">
                            <div>{board.shareViews} views</div>
                            <div>{board.joinClicks} clicks</div>
                            <div>{board.referredSignups} sign-ups</div>
                          </div>
                        </div>
                      ))}

                      {(growthSnapshot?.boardPerformance || []).length === 0 ? (
                        <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-4 text-sm text-neutral-500">
                          No board conversion data yet.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel
              eyebrow="Rankings"
              title="Leaderboard snapshots"
              description="Current and previous weekly performance in a compact readout."
              action={<StatusPill tone="green">Live data</StatusPill>}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MiniLeaderboard title="Combined current" rows={leaderboards.combined} />
                <MiniLeaderboard title="Battle Trivia" rows={leaderboards.battle} />
                <MiniLeaderboard title="Word Scramble" rows={leaderboards.scramble} />
                <MiniLeaderboard title="Combined previous" rows={leaderboards.previousCombined} />
              </div>
            </Panel>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel
                eyebrow="Sponsors"
                title={editingSponsorId ? "Edit sponsor" : "Weekly sponsor campaign"}
                description="Create weekly sponsorship campaigns and choose exactly where they appear in the product."
                action={<StatusPill tone="amber">{activeSponsors}/{sponsors.length} active</StatusPill>}
              >
                <form onSubmit={handleSaveSponsor} className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      name="name"
                      placeholder="Sponsor name"
                      value={sponsorForm.name}
                      onChange={handleSponsorFormChange}
                      className={inputClass}
                    />
                    <select
                      name="leaderboardMode"
                      value={sponsorForm.leaderboardMode}
                      onChange={handleSponsorFormChange}
                      className={inputClass}
                    >
                      <option value="battle-trivia">Battle Trivia</option>
                      <option value="combined">Combined</option>
                      <option value="word-scramble">Word Scramble</option>
                    </select>
                  </div>

                  <input
                    name="sponsorText"
                    placeholder="Sponsor line"
                    value={sponsorForm.sponsorText}
                    onChange={handleSponsorFormChange}
                    className={inputClass}
                  />

                  <textarea
                    name="description"
                    rows="2"
                    placeholder="Short sponsor description"
                    value={sponsorForm.description}
                    onChange={handleSponsorFormChange}
                    className={inputClass}
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      name="websiteUrl"
                      placeholder="Website URL"
                      value={sponsorForm.websiteUrl}
                      onChange={handleSponsorFormChange}
                      className={inputClass}
                    />
                    <input
                      name="badgeImageUrl"
                      placeholder="Badge image URL"
                      value={sponsorForm.badgeImageUrl}
                      onChange={handleSponsorFormChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      name="callToActionLabel"
                      placeholder="CTA label"
                      value={sponsorForm.callToActionLabel}
                      onChange={handleSponsorFormChange}
                      className={inputClass}
                    />
                    <input
                      type="datetime-local"
                      name="startsAt"
                      value={sponsorForm.startsAt}
                      onChange={handleSponsorFormChange}
                      className={inputClass}
                    />
                    <input
                      type="datetime-local"
                      name="endsAt"
                      value={sponsorForm.endsAt}
                      onChange={handleSponsorFormChange}
                      className={inputClass}
                    />
                  </div>

                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-300">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={sponsorForm.isActive}
                      onChange={handleSponsorFormChange}
                    />
                    Active campaign
                  </label>

                  <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      Placements
                    </div>
                    <div className="mb-3 text-xs text-neutral-400">
                      Choose every place this sponsor should appear this week.
                    </div>
                    <div className="space-y-2">
                      {sponsorPlacementOptions.map((option) => {
                        const placement = sponsorForm.placements.find(
                          (item) => item.placementKey === option.key
                        );

                        return (
                          <div
                            key={option.key}
                            className="rounded-xl border border-white/6 bg-white/[0.02] p-3"
                          >
                            <label className="flex items-center gap-2 text-sm text-white">
                              <input
                                type="checkbox"
                                checked={!!placement?.isActive}
                                onChange={(e) =>
                                  handleSponsorPlacementChange(
                                    option.key,
                                    "isActive",
                                    e.target.checked
                                  )
                                }
                              />
                              {option.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {sponsorMessage ? (
                    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-blue-300">
                      {sponsorMessage}
                    </div>
                  ) : null}

                  {sponsorsError ? (
                    <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                      {sponsorsError}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {editingSponsorId ? (
                      <button
                        type="button"
                        onClick={handleCancelSponsorEdit}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.07]"
                      >
                        Cancel
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      disabled={savingSponsor}
                      className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {savingSponsor
                        ? "Saving..."
                        : editingSponsorId
                        ? "Update sponsor"
                        : "Create sponsor"}
                    </button>
                  </div>
                </form>
              </Panel>

              <Panel
                eyebrow="Sponsor list"
                title="Scheduled campaigns"
                description="Review live and upcoming sponsors, then toggle them on or off without losing their placements."
                action={<StatusPill tone="blue">{sponsors.length} total</StatusPill>}
              >
                <div className="max-h-[48rem] divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/8 bg-black/20">
                  {sponsorsLoading ? (
                    <div className="px-3 py-5 text-sm text-neutral-400">
                      Loading sponsors...
                    </div>
                  ) : (
                    sponsors.map((sponsor) => (
                      <div key={sponsor.id} className="px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap gap-1.5">
                              <StatusPill tone={sponsor.isActive ? "green" : "neutral"}>
                                {sponsor.isActive ? "Active" : "Inactive"}
                              </StatusPill>
                              <StatusPill tone="amber">
                                {sponsor.leaderboardMode}
                              </StatusPill>
                            </div>
                            <div className="mt-2 text-sm font-semibold text-white">
                              {sponsor.name}
                            </div>
                            <div className="mt-1 text-xs text-neutral-400">
                              {sponsor.sponsorText}
                            </div>
                            <div className="mt-1 text-[11px] text-neutral-500">
                              {formatShortDate(sponsor.startsAt)} to {formatShortDate(sponsor.endsAt)}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(sponsor.placements || [])
                                .filter((placement) => placement.isActive)
                                .map((placement) => (
                                  <StatusPill key={`${sponsor.id}-${placement.placementKey}`}>
                                    {placement.placementKey}
                                  </StatusPill>
                                ))}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditSponsor(sponsor)}
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/[0.06]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={updatingSponsorId === sponsor.id}
                              onClick={() => handleToggleSponsor(sponsor)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                                sponsor.isActive
                                  ? "bg-red-500/80 hover:bg-red-500"
                                  : "bg-emerald-600 hover:bg-emerald-500"
                              } disabled:opacity-60`}
                            >
                              {updatingSponsorId === sponsor.id
                                ? "Saving..."
                                : sponsor.isActive
                                ? "Disable"
                                : "Enable"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {!sponsorsLoading && sponsors.length === 0 ? (
                    <div className="px-3 py-5 text-sm text-neutral-500">
                      No sponsors scheduled yet.
                    </div>
                  ) : null}
                </div>
              </Panel>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
