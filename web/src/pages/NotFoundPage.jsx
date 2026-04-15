import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo";
import SiteFooter from "../components/SiteFooter";
import sivubelaLogo from "../assets/sivubela-logo.webp";

export default function NotFoundPage() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");

  if (isAdminPath) {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 py-10">
        <Seo
          title="Page Not Found"
          description="The page you are looking for could not be found."
          path={location.pathname}
          image="/social-share-default.jpg"
          type="website"
          robots="noindex,nofollow"
        />

        <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm ring-1 ring-black/5 md:p-12">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Error 404
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-900 md:text-5xl">
            Page not found
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-neutral-600 md:text-base">
            The admin page you tried to open does not exist, may have moved,
            or the link may be incorrect.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/admin"
              className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Go to Dashboard
            </Link>

            <Link
              to="/admin/stories"
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Manage Stories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="Page Not Found"
        description="The page you are looking for could not be found."
        path={location.pathname}
        image="/social-share-default.jpg"
        type="website"
        robots="noindex,nofollow"
      />

      <div className="border-b border-slate-200 bg-white lg:hidden">
        <div className="px-3 py-2">
          <div className="grid grid-cols-3 items-center">
            <Link
              to="/"
              className="justify-self-start text-[11px] font-semibold uppercase tracking-wide text-slate-700"
            >
              Home
            </Link>

            <Link to="/" className="justify-self-center">
              <img
                src={sivubelaLogo}
                alt="Sivubela Intuthuko"
                className="mx-auto h-9 w-auto object-contain"
              />
            </Link>

            <span className="justify-self-end text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              404
            </span>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
          >
            ← Back home
          </Link>

          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Sivubela Intuthuko
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        <div className="overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-900 px-6 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Error 404
            </div>
          </div>

          <div className="p-6 text-center md:p-12">
            <div className="text-6xl font-black tracking-tight text-slate-900 md:text-8xl">
              404
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Page not found
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              The page you are looking for does not exist, may have moved,
              or the link may be incorrect.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/"
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Go to Homepage
              </Link>

              <Link
                to="/stories"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                Browse Stories
              </Link>

              <Link
                to="/issues"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                Browse Issues
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
              <Link
                to="/stories"
                className="border border-slate-200 bg-slate-50 p-5 transition hover:bg-slate-100"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Read
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  Latest Stories
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Open the latest published stories from across categories.
                </p>
              </Link>

              <Link
                to="/issues"
                className="border border-slate-200 bg-slate-50 p-5 transition hover:bg-slate-100"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Browse
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  Digital Editions
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Explore the latest issue and the editions archive.
                </p>
              </Link>

              <Link
                to="/contact"
                className="border border-slate-200 bg-slate-50 p-5 transition hover:bg-slate-100"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Reach Us
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  Contact Us
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Get in touch for enquiries, updates, or advertising.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}