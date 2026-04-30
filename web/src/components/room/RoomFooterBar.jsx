export default function RoomFooterBar({ whisper = null, composer }) {
  return (
    <div className="shrink-0 border-t border-white/6 bg-[linear-gradient(180deg,rgba(10,10,11,0.68),rgba(18,18,20,0.97))] backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-[68rem] px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-3 sm:pb-[max(0.9rem,env(safe-area-inset-bottom))] lg:px-5">
        <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.014))] px-2 py-2 shadow-[0_-12px_34px_rgba(0,0,0,0.18)] sm:rounded-[28px] sm:px-3.5 sm:py-3">
          {whisper ? <div className="mb-1.5 sm:mb-2">{whisper}</div> : null}
          {composer}
        </div>
      </div>
    </div>
  );
}
