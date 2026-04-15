import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getIssueBySlug, getIssuePages } from '../api/issuesApi'
import { getFileUrl } from '../api/fileUrl'
import ReaderToolbar from '../components/ReaderToolbar'
import FlipBookReader from '../components/FlipBookReader'
import MobileThumbnailStrip from '../components/MobileThumbnailStrip'
import DesktopThumbnailSidebar from '../components/DesktopThumbnailSidebar'
import Seo from "../components/Seo";
import { trackOncePerSession } from "../api/analyticsApi";

const MOBILE_READER_WIDTH = 360
const BASE_PAGE_WIDTH = 560
const BASE_PAGE_HEIGHT = 790
const BASE_SPREAD_WIDTH = BASE_PAGE_WIDTH * 2

function normalizeArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

export default function IssueReaderPage() {
  const { slug } = useParams()
  const containerRef = useRef(null)
  const bookRef = useRef(null)
  const touchStartXRef = useRef(0)
  const touchEndXRef = useRef(0)

  const [issue, setIssue] = useState(null)
  const [pages, setPages] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
  if (!issue?.slug) return;

  trackOncePerSession(`issue_open:${issue.slug}`, {
    eventName: "issue_open",
    pageType: "issue",
    pageSlug: issue.slug,
    label: issue.title || "",
    metadata: {
      issueNumber: String(issue.issueNumber || ""),
    },
  });
}, [issue?.slug]);


  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function loadIssue() {
      try {
        setLoading(true)
        setError('')

        const issueData = await getIssueBySlug(slug)
        setIssue(issueData)

        const pagesResponse = await getIssuePages(issueData.id)
        const normalizedPages = normalizeArray(pagesResponse)

        setPages(normalizedPages)
        setCurrentPage(1)
        setZoom(1)
      } catch (err) {
        console.error('Failed to load issue:', err)
        setError('Failed to load issue.')
        setIssue(null)
        setPages([])
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadIssue()
    }
  }, [slug])

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (!pages.length) return

      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === '+') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      if (e.key.toLowerCase() === 'f') toggleFullscreen()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pages.length, isMobile])

  const activePage = useMemo(() => {
    if (!Array.isArray(pages) || pages.length === 0) return null
    return pages.find((p) => Number(p.pageNumber) === Number(currentPage)) || null
  }, [pages, currentPage])

  useEffect(() => {
    if (!Array.isArray(pages) || pages.length === 0) return

    const nextPage = pages.find((p) => Number(p.pageNumber) === Number(currentPage) + 1)
    const prevPage = pages.find((p) => Number(p.pageNumber) === Number(currentPage) - 1)

    ;[nextPage, prevPage].forEach((page) => {
      if (!page?.imageUrl) return
      const img = new Image()
      img.src = getFileUrl(page.imageUrl)
    })
  }, [pages, currentPage])

  function getPageFlip() {
    return bookRef.current?.pageFlip?.()
  }

  function handlePrev() {
    if (!pages.length) return

    if (isMobile) {
      setCurrentPage((prev) => Math.max(prev - 1, 1))
      return
    }

    getPageFlip()?.flipPrev()
  }

  function handleNext() {
    if (!pages.length) return

    if (isMobile) {
      setCurrentPage((prev) => Math.min(prev + 1, pages.length))
      return
    }

    getPageFlip()?.flipNext()
  }

  function handleJump(page) {
    const pageNumber = Number(page)
    if (!Number.isInteger(pageNumber)) return
    if (pageNumber < 1 || pageNumber > pages.length) return

    if (isMobile) {
      setCurrentPage(pageNumber)
      return
    }

    getPageFlip()?.flip(pageNumber - 1)
  }

  function handleZoomIn() {
    setZoom((prev) => Math.min(prev + 0.1, 2.2))
  }

  function handleZoomOut() {
    setZoom((prev) => Math.max(prev - 0.1, 0.8))
  }

  function handleResetZoom() {
    setZoom(1)
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        }
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen failed:', err)
    }
  }

  function handleTouchStart(e) {
    if (!isMobile || zoom !== 1) return
    touchStartXRef.current = e.changedTouches[0].clientX
  }

  function handleTouchEnd(e) {
    if (!isMobile || zoom !== 1) return

    touchEndXRef.current = e.changedTouches[0].clientX
    const diffX = touchEndXRef.current - touchStartXRef.current
    const swipeThreshold = 50

    if (Math.abs(diffX) < swipeThreshold) return

    if (diffX < 0) {
      handleNext()
    } else {
      handlePrev()
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          Loading issue...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl bg-red-50 p-6 text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          Issue not found.
        </div>
      </div>
    )
  }

  const scaledMobileWidth = MOBILE_READER_WIDTH * zoom
  const scaledDesktopWidth = BASE_SPREAD_WIDTH * zoom
  const scaledDesktopHeight = BASE_PAGE_HEIGHT * zoom


  const isClosedFrontCover = currentPage === 1
  const isClosedBackCover = currentPage === pages.length

  let desktopBookOffset = 0

  if (isClosedFrontCover) {
    desktopBookOffset = -(BASE_PAGE_WIDTH * zoom) / 2
  } else if (isClosedBackCover) {
    desktopBookOffset = (BASE_PAGE_WIDTH * zoom) / 2
  }

  return (
      <div
        ref={containerRef}
        className={`mx-auto px-4 py-4 ${
          isFullscreen
            ? 'h-screen max-w-none overflow-y-auto bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_55%)]'
            : 'max-w-[1650px]'
        }`}
      >

        <Seo
  title={issue.title}
  description={
    issue.description ||
    `Read Issue ${issue.issueNumber || ""} of Sivubela Intuthuko online.`
  }
  path={`/issues/${issue.slug}`}
  image={issue.thumbnailUrl || issue.coverImageUrl || "/social-share-default.jpg"}
  type="article"
  publishedTime={issue.publishDate || ""}
  modifiedTime={issue.updatedAt || issue.publishDate || ""}
  section="Digital Edition"
  keywords={[
    "issue",
    "digital edition",
    issue.issueNumber ? `Issue ${issue.issueNumber}` : "",
    "Sivubela Intuthuko",
  ].filter(Boolean)}
  jsonLd={{
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: issue.title,
    description:
      issue.description ||
      `Read Issue ${issue.issueNumber || ""} of Sivubela Intuthuko online.`,
    datePublished: issue.publishDate || undefined,
    image: [
      issue.thumbnailUrl || issue.coverImageUrl || "/social-share-default.jpg",
    ],
    publisher: {
      "@type": "Organization",
      name: "Sivubela Intuthuko",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/issues/${issue.slug}`,
    },
  }}
/>

      <div className={`pb-28 md:pb-10 ${isFullscreen ? 'min-h-full' : ''}`}>
        <div className="mb-6">
          {!isFullscreen && (
            <Link
              to="/"
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              ← Back to issues
            </Link>
          )}

          <h1
            className={`mt-2 text-2xl font-black tracking-tight md:text-3xl ${
              isFullscreen ? 'text-white' : 'text-slate-900'
            }`}
          >
            {issue.title}
          </h1>

          <p className={`mt-2 text-sm ${isFullscreen ? 'text-slate-300' : 'text-slate-600'}`}>
            {issue.issueNumber || 'Issue'} · {pages.length} pages
          </p>

          <p className={`mt-1 text-sm ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            {isMobile
              ? 'Mobile reader · swipe or tap thumbnails'
              : 'Desktop flipbook · use arrows, page jump, zoom, or thumbnails'}
          </p>
        </div>

        <ReaderToolbar
          currentPage={currentPage}
          totalPages={pages.length}
          onPrev={handlePrev}
          onNext={handleNext}
          onJump={handleJump}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />

        <div className="mt-6">
          {isMobile ? (
<div className="flex justify-center">
  <div className="w-full max-w-md">
    <div
      className={`overflow-hidden rounded-2xl shadow-lg ring-1 ${
        isFullscreen
          ? 'bg-slate-900 ring-slate-700'
          : 'bg-white ring-slate-200'
      }`}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="overflow-auto overscroll-contain"
        style={{
          maxHeight: isFullscreen ? 'calc(100dvh - 250px)' : '70dvh',
          WebkitOverflowScrolling: 'touch',
          touchAction: zoom > 1 ? 'pan-x pan-y' : 'auto',
        }}
      >
        <div
          className="mx-auto"
          style={{ width: `${scaledMobileWidth}px` }}
        >
          {activePage ? (
            <img
              src={getFileUrl(activePage.imageUrl)}
              alt={`Page ${activePage.pageNumber}`}
              className="block h-auto w-full select-none"
              draggable={false}
            />
          ) : (
            <div className="p-10 text-center text-slate-500">
              No page available.
            </div>
          )}
        </div>
      </div>
    </div>

    <MobileThumbnailStrip
      pages={pages}
      currentPage={currentPage}
      onSelectPage={handleJump}
      getThumbUrl={getFileUrl}
    />
  </div>
</div>
          ) : (
           <div className="flex items-start gap-6 xl:gap-8">
              {!isFullscreen && (
                <DesktopThumbnailSidebar
                  pages={pages}
                  currentPage={currentPage}
                  onSelectPage={handleJump}
                  getThumbUrl={getFileUrl}
                />
              )}

              <div className="min-w-0 flex-1">
                <div
                  className={`overflow-x-auto overflow-y-visible rounded-[28px] border p-6 shadow-2xl ${
                    isFullscreen
                      ? 'border-white/10 bg-black/20'
                      : 'border-slate-200 bg-slate-100/70'
                  }`}
                >
                <div className="flex justify-center overflow-x-auto">
                  <div
                    style={{
                      width: `${scaledDesktopWidth}px`,
                      minHeight: `${scaledDesktopHeight}px`,
                      transform: `translateX(${desktopBookOffset}px)`,
                      transition: 'transform 220ms ease',
                    }}
                  >
                    <div
                      style={{
                        width: `${BASE_SPREAD_WIDTH}px`,
                        height: `${BASE_PAGE_HEIGHT}px`,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <FlipBookReader
                        bookRef={bookRef}
                        pages={pages}
                        onFlip={setCurrentPage}
                      />
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}