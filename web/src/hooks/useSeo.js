import { useEffect } from "react";
import {
  buildCanonicalUrl,
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "../seo/siteMeta";

function ensureMeta(selector, attributes = {}) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function ensureLink(selector, attributes = {}) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

export function useSeo({
  title,
  description = SITE_DESCRIPTION,
  keywords = SITE_KEYWORDS,
  canonicalPath = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  robots = "index,follow",
  jsonLd,
}) {
  useEffect(() => {
    const nextTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
    const nextDescription = description || SITE_DESCRIPTION;
    const nextKeywords = Array.isArray(keywords) ? keywords.join(", ") : keywords;
    const nextCanonical = buildCanonicalUrl(canonicalPath);

    const previousTitle = document.title;
    document.title = nextTitle;

    const descriptionMeta = ensureMeta('meta[name="description"]', {
      name: "description",
      content: nextDescription,
    });
    const keywordsMeta = ensureMeta('meta[name="keywords"]', {
      name: "keywords",
      content: nextKeywords,
    });
    const robotsMeta = ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: robots,
    });
    const ogTitleMeta = ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: nextTitle,
    });
    const ogDescriptionMeta = ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: nextDescription,
    });
    const ogTypeMeta = ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });
    const ogUrlMeta = ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: nextCanonical,
    });
    const ogSiteNameMeta = ensureMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE_NAME,
    });
    const ogImageMeta = ensureMeta('meta[property="og:image"]', {
      property: "og:image",
      content: image,
    });
    const twitterCardMeta = ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    const twitterTitleMeta = ensureMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: nextTitle,
    });
    const twitterDescriptionMeta = ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: nextDescription,
    });
    const twitterImageMeta = ensureMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: image,
    });
    const canonicalLink = ensureLink('link[rel="canonical"]', {
      rel: "canonical",
      href: nextCanonical,
    });

    let structuredDataScript = null;
    if (jsonLd) {
      structuredDataScript =
        document.head.querySelector('script[data-seo="route-jsonld"]') ||
        document.createElement("script");
      structuredDataScript.type = "application/ld+json";
      structuredDataScript.setAttribute("data-seo", "route-jsonld");
      structuredDataScript.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(structuredDataScript);
    }

    return () => {
      document.title = previousTitle;
      descriptionMeta.setAttribute("content", SITE_DESCRIPTION);
      keywordsMeta.setAttribute("content", SITE_KEYWORDS.join(", "));
      robotsMeta.setAttribute("content", "index,follow");
      ogTitleMeta.setAttribute("content", SITE_TITLE);
      ogDescriptionMeta.setAttribute("content", SITE_DESCRIPTION);
      ogTypeMeta.setAttribute("content", "website");
      ogUrlMeta.setAttribute("content", SITE_URL);
      ogSiteNameMeta.setAttribute("content", SITE_NAME);
      ogImageMeta.setAttribute("content", DEFAULT_OG_IMAGE);
      twitterCardMeta.setAttribute("content", "summary_large_image");
      twitterTitleMeta.setAttribute("content", SITE_TITLE);
      twitterDescriptionMeta.setAttribute("content", SITE_DESCRIPTION);
      twitterImageMeta.setAttribute("content", DEFAULT_OG_IMAGE);
      canonicalLink.setAttribute("href", SITE_URL);

      if (structuredDataScript) {
        structuredDataScript.remove();
      }
    };
  }, [canonicalPath, description, image, jsonLd, keywords, robots, title, type]);
}
