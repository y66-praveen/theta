// ===========================================================================
// seo.js — SEO / structured-data layer for Theta.
// Same split as before: script.js owns routing/rendering and calls
// setSEO({title, description, path}) once per navigation; this file owns
// every <head> mutation. Routes are now exam-namespaced (/jee/..., /neet/...)
// so breadcrumb/collection/article logic resolves against whichever
// dataset (CHAPTERS_BY_ID vs NEET_CHAPTERS_BY_ID) the path segment names.
// ===========================================================================

const SEO_CONFIG = {
  siteName: "Theta",
  baseUrl: "https://theta-study.pages.dev/",
  defaultImage: "/social-preview.png",
  language: "en-IN",
};

const EXAM_LABELS = { jee: "JEE Main", neet: "NEET UG" };
const EXAM_CHAPTERS_BY_ID = { jee: () => (typeof CHAPTERS_BY_ID !== "undefined" ? CHAPTERS_BY_ID : null), neet: () => (typeof NEET_CHAPTERS_BY_ID !== "undefined" ? NEET_CHAPTERS_BY_ID : null) };
const EXAM_CLUSTERS_BY_ID = { jee: () => (typeof CLUSTERS_BY_ID !== "undefined" ? CLUSTERS_BY_ID : null), neet: () => (typeof NEET_CLUSTERS_BY_ID !== "undefined" ? NEET_CLUSTERS_BY_ID : null) };

function seoOrigin() {
  return SEO_CONFIG.baseUrl.replace(/\/$/, "");
}

function upsertMeta(attr, value, content) {
  let elm = document.querySelector(`meta[${attr}="${value}"]`);
  if (!elm) { elm = document.createElement("meta"); elm.setAttribute(attr, value); document.head.appendChild(elm); }
  elm.setAttribute("content", content);
}
function upsertJsonLd(id, data) {
  let elm = document.getElementById(id);
  if (!elm) { elm = document.createElement("script"); elm.type = "application/ld+json"; elm.id = id; document.head.appendChild(elm); }
  elm.textContent = JSON.stringify(data);
}
function removeJsonLd(id) { const e = document.getElementById(id); if (e) e.remove(); }

function buildBreadcrumbs(path) {
  const origin = seoOrigin();
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: origin + "/" }];
  const segs = path.split("/").filter(Boolean);
  const examKey = segs[0];
  if (!EXAM_LABELS[examKey]) return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };

  items.push({ "@type": "ListItem", position: 2, name: EXAM_LABELS[examKey], item: origin + "/" + examKey + "/" });
  const rest = segs.slice(1);
  const sub = rest[0];
  const nameMap = { priority: "Priority explorer", physics: "Physics", chemistry: "Chemistry", maths: "Mathematics", botany: "Botany", zoology: "Zoology", clusters: "Clusters", about: "About" };

  if (sub && nameMap[sub] && rest.length === 1) {
    items.push({ "@type": "ListItem", position: 3, name: nameMap[sub], item: origin + "/" + examKey + "/" + sub });
  } else if (sub === "chapter" && rest[1]) {
    const byId = EXAM_CHAPTERS_BY_ID[examKey] && EXAM_CHAPTERS_BY_ID[examKey]();
    const c = byId ? byId[rest[1]] : null;
    items.push({ "@type": "ListItem", position: 3, name: "Priority explorer", item: origin + "/" + examKey + "/priority" });
    if (c) items.push({ "@type": "ListItem", position: 4, name: c.chapter, item: origin + path });
  } else if (sub === "cluster" && rest[1]) {
    const byId = EXAM_CLUSTERS_BY_ID[examKey] && EXAM_CLUSTERS_BY_ID[examKey]();
    const cl = byId ? byId[rest[1]] : null;
    items.push({ "@type": "ListItem", position: 3, name: "Clusters", item: origin + "/" + examKey + "/clusters" });
    if (cl) items.push({ "@type": "ListItem", position: 4, name: cl.name, item: origin + path });
  }
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

function renderWebsiteSchema() {
  const origin = seoOrigin();
  upsertJsonLd("jsonld-website", {
    "@context": "https://schema.org", "@type": "WebSite",
    name: SEO_CONFIG.siteName, url: origin + "/",
    description: "A chapter priority and focus system for JEE Main and NEET UG, built from historical trends, scoring potential and prerequisites.",
    inLanguage: SEO_CONFIG.language,
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: origin + "/jee/priority?q={search_term_string}" }, "query-input": "required name=search_term_string" },
  });
}

function renderChapterSchema(path) {
  const segs = path.split("/").filter(Boolean);
  const examKey = segs[0];
  if (segs[1] !== "chapter" || !segs[2] || !EXAM_CHAPTERS_BY_ID[examKey]) { removeJsonLd("jsonld-article"); return; }
  const byId = EXAM_CHAPTERS_BY_ID[examKey]();
  const c = byId ? byId[segs[2]] : null;
  if (!c) { removeJsonLd("jsonld-article"); return; }
  const origin = seoOrigin();
  upsertJsonLd("jsonld-article", {
    "@context": "https://schema.org", "@type": "Article",
    headline: `${c.chapter} — ${EXAM_LABELS[examKey]} priority`,
    description: c.whyItMatters || "",
    mainEntityOfPage: origin + path,
    inLanguage: SEO_CONFIG.language,
    image: origin + SEO_CONFIG.defaultImage,
  });
}

function renderCollectionSchema(path, title, description) {
  const segs = path.split("/").filter(Boolean);
  const collectionSubs = ["priority", "physics", "chemistry", "maths", "botany", "zoology", "clusters"];
  if (segs.length !== 2 || !collectionSubs.includes(segs[1])) { removeJsonLd("jsonld-collection"); return; }
  const origin = seoOrigin();
  upsertJsonLd("jsonld-collection", { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: origin + path });
}

function applySEO({ title, description, path }) {
  const origin = seoOrigin();
  const canonicalUrl = origin + path + (window.location.search || "");
  const image = origin + SEO_CONFIG.defaultImage;

  document.title = title;
  upsertMeta("name", "description", description);

  const canonical = document.getElementById("canonicalLink");
  if (canonical) canonical.setAttribute("href", canonicalUrl);

  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonicalUrl);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:image", image);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);

  renderWebsiteSchema();
  upsertJsonLd("jsonld-breadcrumb", buildBreadcrumbs(path));
  renderCollectionSchema(path, title, description);
  renderChapterSchema(path);
}

window.setSEO = applySEO;