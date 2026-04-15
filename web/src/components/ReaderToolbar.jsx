import {
  ChevronLeft,
  ChevronRight,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ReaderToolbar({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onJump,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleFullscreen,
  isFullscreen,
}) {
  const [inputValue, setInputValue] = useState(String(currentPage))

  useEffect(() => {
    setInputValue(String(currentPage))
  }, [currentPage])

  function handleSubmit(e) {
    e.preventDefault()
    const page = Number(inputValue)

    if (!Number.isInteger(page)) return
    if (page < 1 || page > totalPages) return

    onJump(page)
  }

  return (
    <>
      <div className="sticky top-3 z-30 hidden md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/85 px-3 py-2 text-white shadow-2xl backdrop-blur">
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              disabled={currentPage <= 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              title="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={onNext}
              disabled={currentPage >= totalPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              title="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <Search size={16} className="text-slate-300" />
              <input
                type="number"
                min="1"
                max={totalPages}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-16 bg-transparent text-center text-sm text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
            >
              Go
            </button>
          </form>

          <div className="min-w-0 text-center">
            <div className="text-sm font-semibold leading-none">
              {currentPage} / {totalPages}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Page
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onZoomOut}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
              title="Zoom out"
            >
              <ZoomOut size={17} />
            </button>

            <div className="min-w-14 text-center text-xs font-semibold text-slate-200">
              {Math.round(zoom * 100)}%
            </div>

            <button
              onClick={onZoomIn}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
              title="Zoom in"
            >
              <ZoomIn size={17} />
            </button>

            <button
              onClick={onResetZoom}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
              title="Reset zoom"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={onToggleFullscreen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 transition hover:bg-emerald-500"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 text-white shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <button
            onClick={onPrev}
            disabled={currentPage <= 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            title="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
            <div className="text-sm font-semibold leading-none">
              {currentPage} / {totalPages}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Page
            </div>
          </div>

          <button
            onClick={onNext}
            disabled={currentPage >= totalPages}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            title="Next page"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={onZoomOut}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <button
            onClick={onZoomIn}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 transition hover:bg-emerald-500"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>

        <div className="mx-auto mt-2 flex max-w-md items-center justify-center gap-2">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                type="number"
                min="1"
                max={totalPages}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-14 bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200"
            >
              Go
            </button>
          </form>

          <button
            onClick={onResetZoom}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
            title="Reset zoom"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </>
  )
}