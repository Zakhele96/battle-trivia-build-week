import { Link } from "react-router-dom";
import Seo from "../components/seo";
import SiteFooter from "../components/SiteFooter";
import { SITE_CONFIG } from "../config/siteConfig";
import sivubelaLogo from "../assets/sivubela-logo.webp";

function getWhatsAppUrl() {
  const phone = SITE_CONFIG?.whatsapp?.number || "";
  const message = "Hello, I would like to advertise with Sivubela Intuthuko.";

  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function AdvertisePage() {
  const whatsappUrl = getWhatsAppUrl();
  const email = SITE_CONFIG?.contact?.email || "info@sivubelaintuthuko.co.za";

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="Advertise With Us"
        description="Advertise with Sivubela Intuthuko through story placements, edition sponsorships, and promotional opportunities."
        path="/advertise"
        image="/social-share-default.jpg"
        type="website"
        keywords={["Advertise", "Sivubela Intuthuko", "sponsorship", "advertising", "media kit"]}
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
              Advertise
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
            Advertise With Us
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Reach our readers
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Partner with {SITE_CONFIG?.name || "Sivubela Intuthuko"} through branded
            placements, sponsorship opportunities, and digital visibility across our stories and editions.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Display Opportunities</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Banner placements, homepage promotions, section sponsorships, and edition visibility.
            </p>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Sponsored Features</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Clearly labelled sponsored or partner-driven placements built to fit the publication style.
            </p>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Edition Sponsorship</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Highlight your brand around digital edition launches and archive visibility.
            </p>
          </section>
        </div>

        <section className="mt-8 border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Let’s Talk
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Start an advertising conversation
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            For rates, availability, branded campaigns, or partnership ideas, contact us directly.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`mailto:${email}?subject=${encodeURIComponent("Advertising enquiry")}`}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Email us
            </a>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                WhatsApp us
              </a>
            ) : null}

            <Link
              to="/contact"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              Contact page
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}