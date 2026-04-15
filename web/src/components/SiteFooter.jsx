import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import sivubelaLogo from "../assets/sivubela-logo.webp";
import { SITE_CONFIG } from "../config/siteConfig";
import { getPublicCategories } from "../api/categoriesApi";

export default function SiteFooter() {
  const contact = SITE_CONFIG?.contact || {};
  const social = SITE_CONFIG?.social || {};
  const [footerCategories, setFooterCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await getPublicCategories();
      const normalized = Array.isArray(data) ? data : [];
      setFooterCategories(normalized.slice(0, 5));
    } catch {
      setFooterCategories([]);
    }
  }

  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <img
              src={sivubelaLogo}
              alt="Sivubela Intuthuko"
              className="h-10 w-auto object-contain"
            />
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
              {SITE_CONFIG?.shortTagline ||
                "Current stories, digital editions, and category-led reading from Sivubela Intuthuko."}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Sections
            </h3>
            <div className="mt-4 space-y-2">
              {footerCategories.length > 0 ? (
                footerCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/stories/category/${category.slug}`}
                    className="block text-sm text-slate-700 transition hover:text-slate-900"
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <div className="text-sm text-slate-500">No sections available</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Quick Links
            </h3>
            <div className="mt-4 space-y-2">
              <Link
                to="/stories"
                className="block text-sm text-slate-700 transition hover:text-slate-900"
              >
                All Stories
              </Link>

              <Link
                to="/issues"
                className="block text-sm text-slate-700 transition hover:text-slate-900"
              >
                All Issues
              </Link>

              <Link
                to="/about"
                className="block text-sm text-slate-700 transition hover:text-slate-900"
              >
                About Us
              </Link>

              <Link
                to="/contact"
                className="block text-sm text-slate-700 transition hover:text-slate-900"
              >
                Contact Us
              </Link>

              <Link
                to="/advertise"
                className="block text-sm text-slate-700 transition hover:text-slate-900"
              >
                Advertise With Us
              </Link>

              <Link
                to="/privacy-policy"
                className="block text-sm text-slate-700 transition hover:text-slate-900"
              >
                Privacy Policy
              </Link>

              <Link
                to="/terms"
                className="block text-sm text-slate-700 transition hover:text-slate-900"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Contact
            </h3>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="block transition hover:text-slate-900"
                >
                  {contact.email}
                </a>
              ) : null}

              {contact.phoneHref && contact.phoneDisplay ? (
                <a
                  href={contact.phoneHref}
                  className="block transition hover:text-slate-900"
                >
                  {contact.phoneDisplay}
                </a>
              ) : null}

              {contact.addressLine1 ? <div>{contact.addressLine1}</div> : null}
              {contact.addressLine2 ? <div>{contact.addressLine2}</div> : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {social.facebook ? (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-slate-700 transition hover:text-slate-900"
                >
                  Facebook
                </a>
              ) : null}

              {social.instagram ? (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-slate-700 transition hover:text-slate-900"
                >
                  Instagram
                </a>
              ) : null}

              {social.x ? (
                <a
                  href={social.x}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-slate-700 transition hover:text-slate-900"
                >
                  X
                </a>
              ) : null}

              {social.youtube ? (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-slate-700 transition hover:text-slate-900"
                >
                  YouTube
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-4">
          <div className="flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <div>
              © {new Date().getFullYear()} {SITE_CONFIG?.name || "Sivubela Intuthuko"}. All rights reserved.
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/about" className="transition hover:text-slate-700">
                About
              </Link>

              <Link to="/contact" className="transition hover:text-slate-700">
                Contact
              </Link>

              <Link to="/advertise" className="transition hover:text-slate-700">
                Advertise
              </Link>

              <Link to="/privacy-policy" className="transition hover:text-slate-700">
                Privacy Policy
              </Link>

              <Link to="/terms" className="transition hover:text-slate-700">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}