import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import SiteFooter from "../components/SiteFooter";
import { SITE_CONFIG } from "../config/siteConfig";
import sivubelaLogo from "../assets/sivubela-logo.webp";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="About Us"
        description="Learn more about Sivubela Intuthuko, our mission, and our digital publication."
        path="/about"
        image="/social-share-default.jpg"
        type="website"
        keywords={["About", "Sivubela Intuthuko", "news", "digital newspaper"]}
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
              About
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
            {SITE_CONFIG?.name || "Sivubela Intuthuko"}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8 border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            About Us
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            About {SITE_CONFIG?.name || "Sivubela Intuthuko"}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            {SITE_CONFIG?.name || "Sivubela Intuthuko"} is a digital-first publication
            built to make local stories, digital editions, and community updates easier
            to read, share, and discover.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="border border-slate-200 bg-white p-6 lg:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Our Mission
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              A stronger digital home for local journalism
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 md:text-base">
              <p>
                We aim to present news, editions, and community content in a format
                that feels modern, accessible, and easy to navigate on both desktop and mobile.
              </p>
              <p>
                Our platform brings together daily stories, category-led reading,
                and digital issue browsing so readers can move naturally between
                current updates and full editions.
              </p>
              <p>
                We believe local journalism should be easy to discover, easy to read,
                and easy to share across the channels readers actually use every day.
              </p>
            </div>
          </section>

          <aside className="border border-slate-200 bg-white p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Quick Facts
            </div>
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div>
                <div className="font-semibold text-slate-900">Publication</div>
                <div>{SITE_CONFIG?.name || "Sivubela Intuthuko"}</div>
              </div>

              <div>
                <div className="font-semibold text-slate-900">Focus</div>
                <div>Stories, editions, and community updates</div>
              </div>

              <div>
                <div className="font-semibold text-slate-900">Location</div>
                <div>{SITE_CONFIG?.contact?.addressLine1 || "Durban"}</div>
                <div>{SITE_CONFIG?.contact?.addressLine2 || "KwaZulu-Natal"}</div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            What Readers Can Expect
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-900">Latest Stories</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Current reporting presented in a clean, mobile-friendly reading format.
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-900">Digital Editions</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Easy access to published issues through a dedicated editions archive.
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-900">Category Reading</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Stories grouped by category so readers can explore what matters most to them.
              </p>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}