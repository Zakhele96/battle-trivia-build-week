export default function DesktopThumbnailSidebar({
  pages,
  currentPage,
  onSelectPage,
  getThumbUrl,
}) {
  if (!pages?.length) return null

  return (
   <aside className="relative z-10 hidden w-36 shrink-0 md:block xl:w-40">
      <div className="sticky top-24 rounded-3xl bg-white/95 p-3 shadow-xl ring-1 ring-slate-200 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pages
          </div>
          <div className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
            {pages.length}
          </div>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {pages.map((page) => {
            const isActive = Number(page.pageNumber) === Number(currentPage)

            return (
              <button
                key={page.pageNumber}
                onClick={() => onSelectPage(page.pageNumber)}
                className={`block w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                  isActive
                    ? 'border-emerald-600 ring-2 ring-emerald-200'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
                title={`Go to page ${page.pageNumber}`}
              >
                <div className="overflow-hidden bg-slate-100">
                  <img
                    src={getThumbUrl(page.imageUrl)}
                    alt={`Page ${page.pageNumber}`}
                    className="h-36 w-full object-cover"
                    draggable={false}
                  />
                </div>

                <div
                  className={`px-2 py-2 text-center text-xs font-semibold ${
                    isActive ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  Page {page.pageNumber}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}