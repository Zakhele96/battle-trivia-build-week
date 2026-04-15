import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import SiteFooter from "../components/SiteFooter";
import { SITE_CONFIG } from "../config/siteConfig";
import sivubelaLogo from "../assets/sivubela-logo.webp";

function getWhatsAppUrl() {
  const phone = SITE_CONFIG?.whatsapp?.number || "";
  const message =
    SITE_CONFIG?.whatsapp?.defaultMessage ||
    "Hello, I would like more information from Sivubela Intuthuko.";

  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function ContactPage() {
  const whatsappUrl = getWhatsAppUrl();

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="Contact Us"
        description="Contact Sivubela Intuthuko by email, phone, WhatsApp, or visit our office details."
        path="/contact"
        image="/social-share-default.jpg"
        type="website"
        keywords={["Contact", "Sivubela Intuthuko", "WhatsApp", "email", "phone"]}
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
              Contact
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
            Contact Us
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Get in touch
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
            Reach out for general enquiries, editorial communication, partnerships,
            or help related to the publication.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="border border-slate-200 bg-white p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Email
            </div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              {SITE_CONFIG?.contact?.email || "info@sivubelaintuthuko.co.za"}
            </div>
            <a
              href={`mailto:${SITE_CONFIG?.contact?.email || "info@sivubelaintuthuko.co.za"}`}
              className="mt-4 inline-flex text-sm font-semibold text-slate-900 transition hover:text-slate-700"
            >
              Send email →
            </a>
          </div>

          <div className="border border-slate-200 bg-white p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Phone
            </div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              {SITE_CONFIG?.contact?.phoneDisplay || "Phone unavailable"}
            </div>
            {SITE_CONFIG?.contact?.phoneHref ? (
              <a
                href={SITE_CONFIG.contact.phoneHref}
                className="mt-4 inline-flex text-sm font-semibold text-slate-900 transition hover:text-slate-700"
              >
                Call now →
              </a>
            ) : null}
          </div>

          <div className="border border-slate-200 bg-white p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              WhatsApp
            </div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              Fast direct contact
            </div>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-slate-900 transition hover:text-slate-700"
              >
                Open WhatsApp →
              </a>
            ) : (
              <div className="mt-4 text-sm text-slate-500">WhatsApp not configured</div>
            )}
          </div>

          <div className="border border-slate-200 bg-white p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Address
            </div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              {SITE_CONFIG?.contact?.addressLine1 || "Address unavailable"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {SITE_CONFIG?.contact?.addressLine2 || ""}
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}