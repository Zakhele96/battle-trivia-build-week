import { Helmet } from "react-helmet-async";
import { SITE_CONFIG } from "../config/siteConfig";

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text, max = 160) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function resolveSiteUrl() {
  return (
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    window.location.origin
  ).replace(/\/$/, "");
}

function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return "";

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const siteUrl = resolveSiteUrl();
  return pathOrUrl.startsWith("/")
    ? `${siteUrl}${pathOrUrl}`
    : `${siteUrl}/${pathOrUrl}`;
}

export default function Seo({
  title,
  description,
  path = "/",
  image = "",
  type = "website",
  robots = "index,follow",
  publishedTime = "",
  modifiedTime = "",
  author = "",
  section = "",
  keywords = [],
  jsonLd = null,
}) {
  const siteName = SITE_CONFIG?.name || "Sivubela Intuthuko";
  const siteUrl = resolveSiteUrl();
  const canonicalUrl = toAbsoluteUrl(path);
  const absoluteImage = image ? toAbsoluteUrl(image) : toAbsoluteUrl("/social-share-default.jpg");

  const finalTitle = title ? `${title} | ${siteName}` : siteName;
  const finalDescription = truncate(
    description ||
      SITE_CONFIG?.shortTagline ||
      "Stories, editions, and community updates."
  );

  const finalKeywords = Array.isArray(keywords) ? keywords.filter(Boolean).join(", ") : "";

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{finalTitle}</title>

      <meta name="description" content={finalDescription} />
      <meta name="robots" content={robots} />
      {finalKeywords ? <meta name="keywords" content={finalKeywords} /> : null}
      {author ? <meta name="author" content={author} /> : null}

      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:alt" content={title || siteName} />

      {type === "article" && publishedTime ? (
        <meta property="article:published_time" content={publishedTime} />
      ) : null}
      {type === "article" && modifiedTime ? (
        <meta property="article:modified_time" content={modifiedTime} />
      ) : null}
      {type === "article" && author ? (
        <meta property="article:author" content={author} />
      ) : null}
      {type === "article" && section ? (
        <meta property="article:section" content={section} />
      ) : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteImage} />

      {jsonLd ? (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      ) : null}
    </Helmet>
  );
}

export { stripHtml, truncate, toAbsoluteUrl, resolveSiteUrl };