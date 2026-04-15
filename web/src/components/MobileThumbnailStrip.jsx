export default function MobileThumbnailStrip({
  pages,
  currentPage,
  onSelectPage,
  getThumbUrl,
}) {
  if (!pages?.length) return null

  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Pages
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {pages.map((page) => {
          const isActive = Number(page.pageNumber) === Number(currentPage)

          return (
            <button
              key={page.pageNumber}
              onClick={() => onSelectPage(page.pageNumber)}
              className={`shrink-0 overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                isActive
                  ? 'border-emerald-600 ring-2 ring-emerald-200'
                  : 'border-slate-200'
              }`}
            >
              <img
                src={getThumbUrl(page.imageUrl)}
                alt={`Page ${page.pageNumber}`}
                className="h-24 w-16 object-cover"
                draggable={false}
              />

              <div
                className={`px-2 py-1 text-center text-xs font-semibold ${
                  isActive ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                {page.pageNumber}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}