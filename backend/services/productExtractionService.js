const clean = (value, max = 240) => typeof value === "string" ? value.trim().slice(0, max) : "";
const identifier = (value) => clean(value, 80).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
const words = (value = "") => String(value).toLowerCase().match(/[a-z0-9]+(?:[.-][a-z0-9]+)*/g) || [];
const price = (value) => {
  const parsed = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const decode = (value = "") => String(value)
  .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
const text = (value = "") => decode(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
const inferCategory = (value) => {
  const source = String(value || "").toLowerCase();
  const categories = [["Motors", ["motor", "motors", "vfd", "drive", "starter", "pump"]], ["Switchgear", ["switchgear", "switch", "breaker", "panel", "mcc"]], ["Industrial Sensors", ["sensor", "proximity", "photoelectric", "transmitter"]], ["Testing Instruments", ["tester", "testing", "meter", "multimeter", "oscilloscope", "instrument"]], ["Power & Automation", ["automation", "plc", "power supply", "contactor", "relay"]]];
  return categories.find(([, terms]) => terms.some((term) => source.includes(term)))?.[0] || "";
};

export class ProductExtractionError extends Error {
  constructor(message, { code = "extraction_failed", stage = "extract", status, cause } = {}) {
    super(message); this.name = "ProductExtractionError"; this.code = code; this.stage = stage; this.status = status; this.cause = cause;
  }
}

export function parseProductUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) throw new ProductExtractionError("A product URL is required.", { code: "invalid_url", stage: "validate" });
  let url;
  try { url = new URL(rawUrl.trim()); } catch (cause) { throw new ProductExtractionError("Please provide a valid product URL.", { code: "invalid_url", stage: "validate", cause }); }
  const hostname = url.hostname.toLowerCase();
  if (!['http:', 'https:'].includes(url.protocol) || !hostname) throw new ProductExtractionError("Please provide a valid http/https product URL.", { code: "invalid_url", stage: "validate" });
  const isLocal = hostname === "localhost" || hostname.endsWith(".local") || /^127\.|^0\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) || hostname === "::1";
  return { url, domain: hostname.replace(/^www\./i, ""), isLocal };
}

export function extractCatalogIdentifier(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const qId = url.searchParams.get("id") || url.searchParams.get("productId") || url.searchParams.get("slug");
    if (qId) return decodeURIComponent(qId).trim();
    const match = url.pathname.match(/\/(?:product|products)\/([^\/?#]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).trim();
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length) {
      const last = decodeURIComponent(segments[segments.length - 1]).trim();
      if (last && !["product", "products", "item", "items"].includes(last.toLowerCase())) {
        return last;
      }
    }
  } catch {
    const match = String(rawUrl).match(/(?:\/|^)(?:product|products)\/([^\/?#]+)/i);
    if (match && match[1]) return decodeURIComponent(match[1]).trim();
  }
  return "";
}

function fallback(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const rawPath = decodeURIComponent(url.pathname || "");
    const qTerm = url.searchParams.get("q") || url.searchParams.get("search") || url.searchParams.get("query") || url.searchParams.get("keyword") || "";
    const pathname = rawPath.replace(/\/+|[-_]+/g, " ").replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\b(?:product|products|item|items|shop|search|category|categories|collection|collections|page|cart|p|pid|dp|gp)\b/gi, " ").replace(/\s+/g, " ").trim();
    return { name: pathname || qTerm, sku: rawPath.match(/\/(?:dp|gp\/product|p)\/([a-z0-9]{8,20})/i)?.[1] || url.searchParams.get("sku") || "" };
  } catch { return { name: "", sku: "" }; }
}

export function normalizeExtractedProduct(raw, rawUrl) {
  const urlFallback = fallback(rawUrl);
  const specifications = Object.fromEntries(Object.entries(raw?.specifications || {}).slice(0, 30).map(([key, value]) => [clean(key, 80), clean(value, 240)]).filter(([key, value]) => key && value));
  const name = clean(raw?.name) || urlFallback.name;
  const product = { name, brand: clean(raw?.brand, 100), model: clean(raw?.model, 100), sku: identifier(raw?.sku || urlFallback.sku), gtin: identifier(raw?.gtin), category: clean(raw?.category, 120) || inferCategory([name, raw?.keywords, raw?.model].join(" ")), variant: clean(raw?.variant, 120), color: clean(raw?.color, 80), capacity: clean(raw?.capacity, 80), price: price(raw?.price), specifications, imageUrl: /^https:\/\//i.test(clean(raw?.imageUrl, 2048)) ? clean(raw.imageUrl, 2048) : "" };
  product.keywords = [...new Set([...(Array.isArray(raw?.keywords) ? raw.keywords : []), ...words([product.name, product.brand, product.model, product.variant, product.category, product.capacity, ...Object.values(specifications)].join(" "))].map((item) => clean(item, 60).toLowerCase()).filter((item) => item.length > 1))].slice(0, 30);
  return product;
}

function meta(html, ...names) {
  for (const name of names) {
    const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${safe}["'][^>]+content=["']([^"']+)["']`, "i")) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${safe}["']`, "i"));
    if (match?.[1]) return decode(match[1]);
  }
  return "";
}
function objects(value, out = []) {
  if (Array.isArray(value)) value.forEach((item) => objects(item, out));
  else if (value && typeof value === "object") { out.push(value); Object.values(value).forEach((item) => objects(item, out)); }
  return out;
}
function jsonLd(html) {
  const data = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { data.push(...objects(JSON.parse(match[1].trim()))); } catch { /* Ignore malformed publisher metadata. */ }
  }
  return data;
}
function tableSpecs(html) {
  const specs = {};
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map((cell) => text(cell[1]));
    if (cells.length >= 2 && cells[0].length <= 80 && cells[1].length <= 240) specs[cells[0]] = cells[1];
  }
  return specs;
}

export function extractProductFromHtml(html, rawUrl) {
  const products = jsonLd(html).filter((item) => String(item?.['@type'] || "").toLowerCase().includes("product"));
  const product = products[0] || {};
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers || {};
  const additional = Array.isArray(product.additionalProperty) ? product.additionalProperty : [];
  const specifications = { ...tableSpecs(html), ...Object.fromEntries(additional.map((item) => [item?.name, item?.value]).filter(([key, value]) => key && value != null)) };
  return normalizeExtractedProduct({
    name: product.name || meta(html, "og:title", "twitter:title", "product:name"), brand: typeof product.brand === "object" ? product.brand.name : product.brand,
    model: product.model || product.mpn, sku: product.sku, gtin: product.gtin13 || product.gtin || product.gtin12, category: product.category, color: product.color,
    price: offer.price ?? product.price ?? meta(html, "product:price:amount", "price"), imageUrl: Array.isArray(product.image) ? product.image[0] : product.image || meta(html, "og:image", "twitter:image"), specifications,
  }, rawUrl);
}

export async function extractProductFromUrl(rawUrl) {
  const { url, domain, isLocal } = parseProductUrl(rawUrl);
  if (isLocal) {
    const product = normalizeExtractedProduct({}, url.toString());
    return { product, source: `local:${domain}`, domain };
  }
  let response;
  try { response = await fetch(url, { headers: { "User-Agent": "IndustryMandiPriceFinder/1.0", Accept: "text/html,application/xhtml+xml" }, redirect: "follow", signal: AbortSignal.timeout(15000) }); }
  catch (cause) { throw new ProductExtractionError("The product page could not be reached.", { code: "network_error", stage: "fetch", cause }); }
  if (!response.ok) throw new ProductExtractionError(`The product page returned HTTP ${response.status}.`, { code: "upstream_http_error", stage: "fetch", status: response.status });
  if (!(response.headers.get("content-type") || "").includes("text/html")) throw new ProductExtractionError("The pasted URL did not return an HTML product page.", { code: "unsupported_content", stage: "fetch" });
  const product = extractProductFromHtml((await response.text()).slice(0, 2_000_000), url.toString());
  if (!product.name && !product.brand && !product.model && !product.price && !Object.keys(product.specifications).length) throw new ProductExtractionError("No public product data was found on this page.", { code: "missing_product_data", stage: "parse" });
  return { product, source: `public_metadata:${domain}`, domain };
}
