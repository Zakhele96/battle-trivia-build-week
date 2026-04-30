import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppSectionNav from "../components/layout/AppSectionNav";
import AppTopBar from "../components/layout/AppTopBar";
import {
  createSquad,
  getMySquads,
  getSquadDetail,
  joinSquad,
} from "../api/squadsApi";
import {
  buildSquadChallengeText,
  buildSquadChallengeUrl,
  buildSquadInviteUrl,
  buildSquadRecapImageUrl,
  buildSquadRecapUrl,
  downloadImageUrlPng,
} from "../services/leaderboardShare";
import { useTheme } from "../hooks/useTheme";

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-3 sm:mb-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
        {eyebrow}
      </div>
      <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[19px]">
        {title}
      </div>
      {description ? (
        <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:mt-1.5 sm:text-[13px]">
          {description}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-white">
        {value}
      </div>
      {detail ? <div className="mt-1 text-[11px] text-neutral-400">{detail}</div> : null}
    </div>
  );
}

function SummaryCard({ label, value, detail, accent = "blue" }) {
  const accentClassName =
    accent === "violet"
      ? "border-violet-300/18 bg-violet-500/10 text-violet-200"
      : accent === "emerald"
        ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-200"
        : "border-blue-300/18 bg-blue-400/10 text-blue-200";

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[20px] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">{label}</div>
        <div className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentClassName}`}>
          Live
        </div>
      </div>
      <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[17px]">{label}</div>
      <div className="mt-2 text-[22px] font-semibold tracking-[-0.05em] text-white sm:text-[24px]">{value}</div>
      <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:text-[13px]">{detail}</div>
    </div>
  );
}

export default function SquadsPage() {
  const { resolvedTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [squads, setSquads] = useState([]);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previousSquadDetail, setPreviousSquadDetail] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [rivalSquadId, setRivalSquadId] = useState("");
  const [mode, setMode] = useState(searchParams.get("mode") || "combined");
  const [period, setPeriod] = useState(searchParams.get("period") || "current");

  const selectedSquadId = searchParams.get("squadId") || "";

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getMySquads();
        if (!isMounted) return;

        setSquads(Array.isArray(result) ? result : []);
      } catch {
        if (!isMounted) return;
        setError("Failed to load squads.");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!squads.length) {
      setSelectedSquad(null);
      return;
    }

    const fallbackId = squads[0]?.id;
    const nextSquadId =
      squads.find((item) => item.id === selectedSquadId)?.id || fallbackId;

    if (!selectedSquadId && nextSquadId) {
      setSearchParams({
        squadId: nextSquadId,
        mode,
        period,
      });
      return;
    }

    if (!nextSquadId) return;

    let isMounted = true;

    async function loadDetail() {
      setDetailLoading(true);
      setError("");

      try {
        const [result, previousResult] = await Promise.all([
          getSquadDetail(nextSquadId, mode, period),
          getSquadDetail(nextSquadId, mode, "previous").catch(() => null),
        ]);
        if (!isMounted) return;
        setSelectedSquad(result);
        setPreviousSquadDetail(previousResult);
      } catch {
        if (!isMounted) return;
        setError("Failed to load squad detail.");
        setSelectedSquad(null);
        setPreviousSquadDetail(null);
      } finally {
        if (!isMounted) return;
        setDetailLoading(false);
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [squads, selectedSquadId, mode, period, setSearchParams]);

  const topMember = useMemo(
    () => selectedSquad?.leaderboardRows?.[0] || null,
    [selectedSquad]
  );
  const squadMomentum = useMemo(() => {
    if (!selectedSquad) return null;

    const currentRank = selectedSquad.overallRank || 0;
    const previousRank = previousSquadDetail?.overallRank || 0;

    if (currentRank > 0 && previousRank > 0) {
      const delta = previousRank - currentRank;

      return {
        title:
          delta > 0
            ? `${selectedSquad.name} climbed ${delta} squad spot${delta === 1 ? "" : "s"}.`
            : delta < 0
            ? `${selectedSquad.name} dropped ${Math.abs(delta)} squad spot${Math.abs(delta) === 1 ? "" : "s"}.`
            : `${selectedSquad.name} held the same squad position.`,
        detail:
          currentRank === 1
            ? "You are the top squad on this board right now."
            : `${selectedSquad.pointsBehindLeader} point${selectedSquad.pointsBehindLeader === 1 ? "" : "s"} behind the leading squad and ${selectedSquad.pointsToNextRank} point${selectedSquad.pointsToNextRank === 1 ? "" : "s"} from the next jump.`,
      };
    }

    if (currentRank > 0) {
      return {
        title: `${selectedSquad.name} is currently #${currentRank} among squads.`,
        detail:
          currentRank === 1
            ? "Defend the lead and get the squad recap ready."
            : `${selectedSquad.pointsBehindLeader} point${selectedSquad.pointsBehindLeader === 1 ? "" : "s"} behind the leading squad right now.`,
      };
    }

    return {
      title: "Your squad recap is ready once your crew gets on the board.",
      detail: "Invite more members and push your first ranked squad finish.",
    };
  }, [previousSquadDetail, selectedSquad]);
  const rivalOptions = useMemo(
    () => squads.filter((squad) => squad.id !== selectedSquad?.id),
    [squads, selectedSquad?.id]
  );
  const selectedRivalSquad =
    rivalOptions.find((squad) => squad.id === rivalSquadId) || rivalOptions[0] || null;

  useEffect(() => {
    if (!rivalOptions.length) {
      setRivalSquadId("");
      return;
    }

    if (!rivalOptions.some((squad) => squad.id === rivalSquadId)) {
      setRivalSquadId(rivalOptions[0].id);
    }
  }, [rivalOptions, rivalSquadId]);

  const handleSelectSquad = (squadId) => {
    setSearchParams({ squadId, mode, period });
  };

  const handleCreateSquad = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const created = await createSquad({ name: createName.trim() });
      setCreateName("");
      setMessage("Squad created.");
      const list = await getMySquads();
      setSquads(Array.isArray(list) ? list : []);
      setSelectedSquad(created);
      setSearchParams({ squadId: created.id, mode, period });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create squad.");
    }
  };

  const handleJoinSquad = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const joined = await joinSquad({ inviteCode: joinCode.trim() });
      setJoinCode("");
      setMessage("Joined squad.");
      const list = await getMySquads();
      setSquads(Array.isArray(list) ? list : []);
      setSelectedSquad(joined);
      setSearchParams({ squadId: joined.id, mode, period });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to join squad.");
    }
  };

  const handleCopyInvite = async () => {
    if (!selectedSquad?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(selectedSquad.inviteCode);
      setMessage("Invite code copied.");
    } catch {
      setMessage("Could not copy invite code.");
    }
  };

  const handleCopyInviteLink = async () => {
    if (!selectedSquad?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(
        buildSquadInviteUrl(selectedSquad.inviteCode, mode, period)
      );
      setMessage("Squad invite link copied.");
    } catch {
      setMessage("Could not copy squad invite link.");
    }
  };

  const handleShareSquad = async () => {
    if (!selectedSquad?.inviteCode) return;

    const url = buildSquadInviteUrl(selectedSquad.inviteCode, mode, period);
    const text = `${selectedSquad.name} is recruiting on BTS. Join our squad, use invite code ${selectedSquad.inviteCode}, and get onto our weekly board.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${selectedSquad.name} on BTS`,
          text,
          url,
        });
        setMessage("Squad share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage("Squad share text copied.");
    } catch {
      setMessage("Could not share squad right now.");
    }
  };

  const handleShareSquadChallenge = async () => {
    if (!selectedSquad?.inviteCode || !selectedRivalSquad?.inviteCode) {
      setMessage("Choose another squad to challenge.");
      return;
    }

    const url = buildSquadChallengeUrl(
      selectedSquad.inviteCode,
      selectedRivalSquad.inviteCode,
      mode,
      period
    );
    const text = buildSquadChallengeText({
      challengerSquad: selectedSquad.name,
      rivalSquad: selectedRivalSquad.name,
      mode,
      period,
      label: selectedSquad.leaderboardLabel,
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${selectedSquad.name} vs ${selectedRivalSquad.name}`,
          text,
          url,
        });
        setMessage("Squad challenge share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage("Squad challenge copied.");
    } catch {
      setMessage("Could not share squad challenge right now.");
    }
  };

  const handleShareSquadRecap = async () => {
    if (!selectedSquad?.inviteCode) return;

    const url = buildSquadRecapUrl(selectedSquad.inviteCode, mode, "previous");
    const text = `${selectedSquad.name} just posted their BTS weekly squad recap. See how the crew finished and create your account to build a squad of your own.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${selectedSquad.name} weekly recap`,
          text,
          url,
        });
        setMessage("Squad recap share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage("Squad recap copied.");
    } catch {
      setMessage("Could not share squad recap right now.");
    }
  };

  const handleDownloadSquadRecap = async () => {
    if (!selectedSquad?.inviteCode) return;

    try {
      await downloadImageUrlPng(
        buildSquadRecapImageUrl(selectedSquad.inviteCode, mode, "previous"),
        `${selectedSquad.name}-weekly-squad-recap`
      );
      setMessage("Squad recap downloaded.");
    } catch {
      setMessage("Could not download squad recap.");
    }
  };

  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`squads-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "squads-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Squads"
          title="Your mini leaderboards"
          description="Create a squad, invite your people, and turn the weekly BTS climb into a smaller rivalry with repeat energy."
          actions={[]}
        />

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Your squads"
            value={squads.length}
            detail="Private crew spaces you can switch between and compete inside."
            accent="blue"
          />
          <SummaryCard
            label="Top member"
            value={topMember ? topMember.displayName || topMember.username : "Waiting"}
            detail={topMember ? `${topMember.score} points currently lead your selected squad board.` : "Your leading squad member appears here once the board loads."}
            accent="emerald"
          />
          <SummaryCard
            label="Board mode"
            value={selectedSquad?.leaderboardLabel || "Combined"}
            detail="Current squad board slice shown in the detailed panel below."
            accent="violet"
          />
        </div>

        {error ? (
          <div className="mb-4 rounded-[18px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-[18px] border border-emerald-900/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-300/90">
            {message}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4">
            <SectionHeader
              eyebrow="Start a squad"
              title="Create or join"
              description="Keep it simple: make a crew, share the invite code, and compete on your own private weekly board."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <form onSubmit={handleCreateSquad} className="space-y-3">
                <div className="text-sm font-semibold text-white">Create squad</div>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Squad name"
                  className="w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                />
                <button
                  type="submit"
                  className="w-full rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
                >
                  Create squad
                </button>
              </form>

              <form onSubmit={handleJoinSquad} className="space-y-3">
                <div className="text-sm font-semibold text-white">Join squad</div>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Invite code"
                  className="w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-sm uppercase tracking-[0.18em] text-white outline-none focus:border-blue-400/20"
                />
                <button
                  type="submit"
                  className="w-full rounded-[16px] border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15"
                >
                  Join squad
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4">
            <SectionHeader
              eyebrow="Why squads"
              title="Small-group pressure"
              description="Global boards are good for discovery. Squads make people come back because now friends, teams, and communities are watching each other."
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Your squads" value={squads.length} detail="Private competition circles" />
              <StatCard label="Top member" value={topMember ? `#1 ${topMember.displayName || topMember.username}` : "Waiting"} detail={topMember ? `${topMember.score} pts` : "No squad board yet"} />
              <StatCard label="Current board" value={selectedSquad?.leaderboardLabel || "Combined"} detail={selectedSquad ? `${selectedSquad.memberCount} members` : "Create or join first"} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
          <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4">
            <SectionHeader
              eyebrow="Your squads"
              title="Choose a squad"
              description="Switch between squads and compare who is actually carrying the team this week."
            />

            {loading ? (
              <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-8 text-sm text-neutral-500">
                Loading squads...
              </div>
            ) : squads.length === 0 ? (
              <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-8 text-sm text-neutral-500">
                No squads yet. Create one above and start your own mini leaderboard.
              </div>
            ) : (
              <div className="space-y-3">
                {squads.map((squad) => {
                  const active = squad.id === selectedSquadId;

                  return (
                    <button
                      key={squad.id}
                      type="button"
                      onClick={() => handleSelectSquad(squad.id)}
                      className={`w-full rounded-[18px] border p-4 text-left transition ${
                        active
                          ? "border-blue-300/22 bg-blue-500/10"
                          : "border-white/8 bg-black/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {squad.name}
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                            {squad.memberCount} members
                          </div>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-neutral-300">
                          {squad.inviteCode}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4">
            <SectionHeader
              eyebrow="Squad board"
              title={selectedSquad?.name || "Select a squad"}
              description="This board only shows your squad members, so the weekly climb feels personal."
            />

            {selectedSquad ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      Invite code
                    </div>
                    <div className="mt-1 text-lg font-semibold tracking-[0.18em] text-white">
                      {selectedSquad.inviteCode}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                    >
                      Copy invite code
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="rounded-[16px] border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15"
                    >
                      Copy invite link
                    </button>
                    <button
                      type="button"
                      onClick={handleShareSquad}
                      className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                    >
                      Share squad
                    </button>
                    <button
                      type="button"
                      onClick={handleShareSquadRecap}
                      className="rounded-[16px] border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/15"
                    >
                      Share weekly recap
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSquadRecap}
                      className="rounded-[16px] border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/15"
                    >
                      Download recap
                    </button>
                  </div>
                </div>

                {squadMomentum ? (
                  <div className="mb-4 rounded-[18px] border border-violet-400/18 bg-violet-500/10 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-violet-100/75">
                      Momentum
                    </div>
                    <div className="mt-1 text-sm text-white">
                      {squadMomentum.title}
                    </div>
                    <div className="mt-1 text-[12px] leading-5 text-violet-100/80">
                      {squadMomentum.detail}
                    </div>
                  </div>
                ) : null}

                {rivalOptions.length ? (
                  <div className="mb-4 rounded-[18px] border border-orange-300/16 bg-orange-400/10 px-4 py-3">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-orange-100/75">
                          Squad challenge
                        </div>
                        <div className="mt-1 text-sm text-white">
                          Call out another squad and turn this board into a crew rivalry.
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={selectedRivalSquad?.id || ""}
                          onChange={(e) => setRivalSquadId(e.target.value)}
                          className="rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        >
                          {rivalOptions.map((squad) => (
                            <option key={squad.id} value={squad.id}>
                              {squad.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleShareSquadChallenge}
                          className="rounded-[14px] border border-orange-300/18 bg-orange-400/12 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:bg-orange-400/18"
                        >
                          Share squad challenge
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mb-4 flex flex-wrap gap-2">
                  {[
                    ["combined", "Combined"],
                    ["battle-trivia", "Battle Trivia"],
                    ["word-scramble", "Word Scramble"],
                  ].map(([nextMode, label]) => (
                    <button
                      key={nextMode}
                      type="button"
                      onClick={() => {
                        setMode(nextMode);
                        setSearchParams({
                          squadId: selectedSquad.id,
                          mode: nextMode,
                          period,
                        });
                      }}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        mode === nextMode
                          ? "bg-blue-500 text-white"
                          : "border border-white/10 bg-white/[0.03] text-neutral-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                  {["current", "previous"].map((nextPeriod) => (
                    <button
                      key={nextPeriod}
                      type="button"
                      onClick={() => {
                        setPeriod(nextPeriod);
                        setSearchParams({
                          squadId: selectedSquad.id,
                          mode,
                          period: nextPeriod,
                        });
                      }}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        period === nextPeriod
                          ? "bg-violet-500 text-white"
                          : "border border-white/10 bg-white/[0.03] text-neutral-300"
                      }`}
                    >
                      {nextPeriod}
                    </button>
                  ))}
                </div>

                {detailLoading ? (
                  <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-8 text-sm text-neutral-500">
                    Loading squad board...
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-3">
                      <div className="text-sm font-semibold text-white">Members</div>
                      <div className="mt-3 space-y-2">
                        {(selectedSquad.members || []).map((member) => (
                          <div
                            key={member.userId}
                            className="rounded-[16px] border border-white/6 bg-white/[0.03] px-3 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {member.displayName || member.username}
                                </div>
                                <div className="mt-1 text-[11px] text-neutral-500">
                                  @{member.username}
                                </div>
                              </div>
                              {member.isOwner ? (
                                <div className="rounded-full border border-amber-300/18 bg-amber-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-100">
                                  Owner
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-3">
                      <div className="text-sm font-semibold text-white">
                        {selectedSquad.leaderboardLabel}
                      </div>
                      <div className="mt-3 space-y-2">
                        {(selectedSquad.leaderboardRows || []).map((row) => (
                          <div
                            key={row.userId}
                            className="grid grid-cols-[72px_minmax(0,1fr)_80px] items-center gap-3 rounded-[16px] border border-white/6 bg-white/[0.03] px-3 py-3"
                          >
                            <div className="text-sm font-semibold text-blue-200">
                              #{row.rank}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-white">
                                {row.displayName || row.username}
                              </div>
                              <div className="mt-1 truncate text-[11px] text-neutral-500">
                                @{row.username}
                              </div>
                            </div>
                            <div className="text-right text-sm font-semibold text-white">
                              {row.score}
                            </div>
                          </div>
                        ))}

                        {!selectedSquad.leaderboardRows?.length ? (
                          <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-3 py-6 text-sm text-neutral-500">
                            No ranked squad members on this board yet.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-8 text-sm text-neutral-500">
                Pick a squad to see its mini leaderboard.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
