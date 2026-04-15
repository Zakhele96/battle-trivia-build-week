import HTMLFlipBook from 'react-pageflip'
import { forwardRef } from 'react'
import { getFileUrl } from '../api/fileUrl'

const BASE_PAGE_WIDTH = 560
const BASE_PAGE_HEIGHT = 790

const FlipPage = forwardRef(function FlipPage({ page, isCover = false }, ref) {
  return (
    <div
      ref={ref}
      className={`h-full w-full overflow-hidden ${
        isCover ? 'bg-slate-50' : 'bg-white'
      }`}
    >
      <div className="relative h-full w-full">
        <img
          src={getFileUrl(page.imageUrl)}
          alt={`Page ${page.pageNumber}`}
          className="h-full w-full object-contain select-none"
          draggable={false}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
          <div className="rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-lg">
            {isCover ? 'Cover' : `Page ${page.pageNumber}`}
          </div>
        </div>
      </div>
    </div>
  )
})

export default function FlipBookReader({
  bookRef,
  pages,
  onFlip,
}) {
  if (!pages?.length) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-2xl ring-1 ring-slate-200">
        No pages available.
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <HTMLFlipBook
        ref={bookRef}
        width={BASE_PAGE_WIDTH}
        height={BASE_PAGE_HEIGHT}
        minWidth={BASE_PAGE_WIDTH}
        maxWidth={BASE_PAGE_WIDTH}
        minHeight={BASE_PAGE_HEIGHT}
        maxHeight={BASE_PAGE_HEIGHT}
        size="fixed"
        drawShadow={true}
        maxShadowOpacity={0.45}
        flippingTime={850}
        usePortrait={false}
        startZIndex={1}
        autoSize={false}
        showCover={true}
        mobileScrollSupport={true}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={30}
        showPageCorners={true}
        className="drop-shadow-[0_25px_60px_rgba(0,0,0,0.35)]"
        onFlip={(e) => onFlip?.(Number(e.data) + 1)}
      >
        {pages.map((page, index) => (
          <FlipPage
            key={page.pageNumber}
            page={page}
            isCover={index === 0}
          />
        ))}
      </HTMLFlipBook>
    </div>
  )
}