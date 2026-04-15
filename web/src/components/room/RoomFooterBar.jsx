export default function RoomFooterBar({ whisper = null, composer }) {
  return (
    <div className="shrink-0 border-t border-white/6 bg-[linear-gradient(180deg,rgba(10,10,11,0.78),rgba(18,18,20,0.96))] backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-[68rem] px-2.5 pt-2.5 pb-[max(0.9rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-3 sm:pb-[max(0.9rem,env(safe-area-inset-bottom))] lg:px-5">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.018))] px-2.5 py-2.5 shadow-[0_-12px_34px_rgba(0,0,0,0.18)] sm:px-3.5 sm:py-3">
          {whisper ? <div className="mb-2">{whisper}</div> : null}
          {composer}
        </div>
      </div>
    </div>
  );
}