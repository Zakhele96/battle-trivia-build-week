import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import SiteFooter from "../components/SiteFooter";
import { SITE_CONFIG } from "../config/siteConfig";
import sivubelaLogo from "../assets/sivubela-logo.webp";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="Terms & Conditions"
        description="Read the terms and conditions for using Sivubela Intuthuko."
        path="/terms"
        image="/social-share-default.jpg"
        type="website"
        keywords={["Terms", "Terms and Conditions", "Sivubela Intuthuko"]}
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
              Terms
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

      <div className="mx-auto max-w-4xl px-4 py-8">
        <section className="border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Legal
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
            These terms govern the use of {SITE_CONFIG?.name || "Sivubela Intuthuko"} and
            its digital content, stories, and published issues.
          </p>

          <div className="prose prose-slate mt-8 max-w-none">
            <h2>Use of Content</h2>
            <p>
              Content on this website is provided for reading, sharing, and general
              informational use. Republishing, commercial reuse, or redistribution
              may require permission.
            </p>

            <h2>Accuracy and Availability</h2>
            <p>
              We aim to keep information accurate and the site available, but we do
              not guarantee uninterrupted access or that all content is free from errors.
            </p>

            <h2>User Conduct</h2>
            <p>
              Visitors must not misuse the website, attempt unauthorized access,
              interfere with normal operation, or use the platform for unlawful purposes.
            </p>

            <h2>External Services</h2>
            <p>
              Links to third-party services, social platforms, or messaging tools may
              be provided for convenience. We are not responsible for third-party policies
              or availability.
            </p>

            <h2>Changes</h2>
            <p>
              We may update these terms from time to time. Continued use of the site
              after changes are posted means you accept the updated terms.
            </p>

            <h2>Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a href={`mailto:${SITE_CONFIG?.contact?.email || "info@sivubelaintuthuko.co.za"}`}>
                {SITE_CONFIG?.contact?.email || "info@sivubelaintuthuko.co.za"}
              </a>.
            </p>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}