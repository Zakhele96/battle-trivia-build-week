import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import SiteFooter from "../components/SiteFooter";
import { SITE_CONFIG } from "../config/siteConfig";
import sivubelaLogo from "../assets/sivubela-logo.webp";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="Privacy Policy"
        description="Read the privacy policy for Sivubela Intuthuko."
        path="/privacy-policy"
        image="/social-share-default.jpg"
        type="website"
        keywords={["Privacy Policy", "Sivubela Intuthuko", "privacy"]}
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
              Privacy
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
            This page explains how {SITE_CONFIG?.name || "Sivubela Intuthuko"} collects,
            uses, and protects limited information from visitors and subscribers.
          </p>

          <div className="prose prose-slate mt-8 max-w-none">
            <h2>Information We Collect</h2>
            <p>
              We may collect information you provide directly, such as your email
              address when you subscribe for updates or contact us.
            </p>

            <h2>How We Use Information</h2>
            <p>
              We use collected information to respond to enquiries, send updates,
              improve the website experience, and understand how readers use our
              stories and digital editions.
            </p>

            <h2>Analytics</h2>
            <p>
              We may collect limited analytics data such as page opens, search usage,
              and interaction with public features like WhatsApp or subscription forms.
              This helps us improve content and user experience.
            </p>

            <h2>Subscriptions</h2>
            <p>
              If you subscribe to updates, your email address may be stored so we can
              send relevant publication updates. You may request removal or deactivation
              of your subscription at any time.
            </p>

            <h2>Third-Party Links</h2>
            <p>
              Our site may link to social media platforms or third-party services.
              Their own privacy policies apply once you leave this website.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy-related questions, contact us at{" "}
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