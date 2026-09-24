/**
 * Price Finder Controller
 *
 * Workflow:
 * 1. Receive a product URL from the user
 * 2. Detect the platform and extract product identifiers (model, brand, SKU, GTIN, name)
 * 3. Search our MongoDB for an exact match, then a fuzzy match
 * 4. Aggregate all approved vendor offers for the matched product
 * 5. Generate external price rows (from permitted affiliate APIs / product feeds)
 *    NOTE: Where live external APIs require approved keys (Amazon PA-API, Flipkart
 *    Affiliate API, IndiaMART API), we return clearly-labeled indicative rows with
 *    "fetch_required" flag so the UI can display them with a disclaimer.
 *    Real API integrations should be plugged in here once credentials are obtained.
 * 6. Sort everything by lowest valid price
 */

import Product from "../models/Product.js";
import VendorOffer from "../models/VendorOffer.js";

// ─── Platform Detector ────────────────────────────────────────────────────────

const PLATFORM_PATTERNS = [
  {
    id: "amazon_in",
    name: "Amazon India",
    icon: "amazon",
    color: "#FF9900",
    domains: ["amazon.in", "amzn.in", "amzn.to"],
    extractors: {
      /** e.g. /dp/B09XYZ1234 or /gp/product/B09XYZ1234 */
      asin: (url) => {
        const m = url.match(/\/(?:dp|gp\/product|ASIN)\/([A-Z0-9]{10})/i);
        return m ? m[1].toUpperCase() : null;
      },
      /** ?keywords=... */
      keywords: (url) => {
        try {
          return new URL(url).searchParams.get("keywords") || null;
        } catch { return null; }
      },
    },
  },
  {
    id: "flipkart",
    name: "Flipkart",
    icon: "flipkart",
    color: "#2874F0",
    domains: ["flipkart.com", "dl.flipkart.com"],
    extractors: {
      /** /p/pid=XXXXXXXXXX */
      pid: (url) => {
        const m = url.match(/pid=([A-Z0-9]+)/i);
        return m ? m[1].toUpperCase() : null;
      },
      /** Product name from path */
      name: (url) => {
        try {
          const parts = new URL(url).pathname.split("/").filter(Boolean);
          return parts[0] ? decodeURIComponent(parts[0]).replace(/-/g, " ") : null;
        } catch { return null; }
      },
    },
  },
  {
    id: "indiamart",
    name: "IndiaMART",
    icon: "indiamart",
    color: "#E87722",
    domains: ["indiamart.com", "dir.indiamart.com"],
    extractors: {
      name: (url) => {
        try {
          const parts = new URL(url).pathname.split("/").filter(Boolean);
          // /proddetail/brand-model-12345678.html → "brand model"
          if (parts[1]) return decodeURIComponent(parts[1]).replace(/-\d+\.html$/, "").replace(/-/g, " ");
          return null;
        } catch { return null; }
      },
    },
  },
  {
    id: "tradeindia",
    name: "TradeIndia",
    icon: "tradeindia",
    color: "#F58220",
    domains: ["tradeindia.com"],
    extractors: {
      name: (url) => {
        try {
          const seg = new URL(url).pathname.split("/").filter(Boolean);
          return seg[seg.length - 1]?.replace(/-/g, " ")?.replace(/\.html$/, "") || null;
        } catch { return null; }
      },
    },
  },
  {
    id: "industrybuying",
    name: "IndustryBuying",
    icon: "industrybuying",
    color: "#1A73E8",
    domains: ["industrybuying.com"],
    extractors: {
      name: (url) => {
        try {
          const seg = new URL(url).pathname.split("/").filter(Boolean);
          return seg[0]?.replace(/-/g, " ") || null;
        } catch { return null; }
      },
    },
  },
  {
    id: "moglix",
    name: "Moglix",
    icon: "moglix",
    color: "#E53935",
    domains: ["moglix.com"],
    extractors: {
      name: (url) => {
        try {
          const seg = new URL(url).pathname.split("/").filter(Boolean);
          return seg[0]?.replace(/-/g, " ") || null;
        } catch { return null; }
      },
    },
  },
];

function detectPlatform(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return null; }
  const host = url.hostname.replace(/^www\./, "");
  return PLATFORM_PATTERNS.find((p) => p.domains.some((d) => host === d || host.endsWith(`.${d}`))) || null;
}

function extractIdentifiers(rawUrl, platform) {
  const ids = {};
  if (!platform) return ids;
  for (const [key, fn] of Object.entries(platform.extractors)) {
    const value = fn(rawUrl);
    if (value) ids[key] = value;
  }
  return ids;
}

/** Tokenise a string into meaningful search words */
function tokenise(str = "") {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/** Score how well two strings overlap on tokens */
function tokenOverlap(a = "", b = "") {
  const ta = new Set(tokenise(a));
  const tb = new Set(tokenise(b));
  let hits = 0;
  for (const t of ta) if (tb.has(t)) hits++;
  return hits / Math.max(ta.size, tb.size, 1);
}

// ─── External Price Rows ──────────────────────────────────────────────────────

/**
 * Build external price rows for the platform the URL came from.
 *
 * In production, replace the sections marked [API_INTEGRATION] with real calls to:
 *   • Amazon PA-API v5 (getItems by ASIN)
 *   • Flipkart Affiliate API (productSearch)
 *   • IndiaMART LeadManager API (product search)
 *   • IndustryBuying / Moglix affiliate / product feeds
 *
 * Until API credentials are provisioned, we return an "indicative" row
 * with fetch_required=true so the frontend can render a clear disclaimer.
 */
function buildExternalRows(platform, identifiers, rawUrl, matched) {
  if (!platform) return [];

  const now = new Date().toISOString();

  // [API_INTEGRATION] Placeholder for actual API calls
  // In a real implementation, this would be:
  //   const liveData = await amazonPAAPI.getItems({ ItemIds: [identifiers.asin] });
  //   const price = liveData.ItemsResult.Items[0].Offers.Listings[0].Price.Amount;

  return [
    {
      platform: platform.name,
      platform_id: platform.id,
      platform_color: platform.color,
      seller: platform.name,
      price: null,           // null = live price not fetched
      mrp: null,
      discount: null,
      availability: "check_live",
      shipping: null,
      url: rawUrl,
      last_updated: now,
      source: "external",
      fetch_required: true,   // tells the UI to show a "Visit site" CTA instead of price
      note: `Live pricing requires ${platform.name} API credentials. Click "View on ${platform.name}" to see the current price.`,
      identifiers,
    },
  ];
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function findByUrl(req, res) {
  const { url: rawUrl } = req.body;

  if (!rawUrl || typeof rawUrl !== "string") {
    return res.status(400).json({ success: false, message: "A product URL is required." });
  }

  // Validate URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl.trim());
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("bad protocol");
  } catch {
    return res.status(400).json({ success: false, message: "Please provide a valid http/https URL." });
  }

  const platform = detectPlatform(rawUrl);
  const identifiers = extractIdentifiers(rawUrl, platform);

  // ── 1. Build search query from URL path / identifiers ──────────────────────

  // Extract meaningful text from the URL to search with
  const urlText = [
    parsedUrl.pathname,
    identifiers.name || "",
    identifiers.keywords || "",
  ].join(" ").replace(/[-_\/\\]/g, " ").replace(/[^a-z0-9\s]/gi, " ");

  const searchTokens = tokenise(urlText).filter((t) => t.length > 2);
  const searchPhrase = searchTokens.slice(0, 8).join(" ");

  // ── 2. Exact match: SKU / model number ────────────────────────────────────

  let exactMatch = null;
  const modelTokens = searchTokens.filter((t) => /[a-z]/.test(t) && /\d/.test(t)); // alphanumeric = likely model
  if (modelTokens.length) {
    exactMatch = await Product.findOne({
      status: "published",
      $or: [
        { model: { $in: modelTokens.map((t) => new RegExp(`^${t}$`, "i")) } },
        { sku: { $in: modelTokens.map((t) => new RegExp(`^${t}$`, "i")) } },
      ],
    }).lean();
  }

  // ── 3. Full-text / fuzzy search ───────────────────────────────────────────

  let candidates = [];
  if (!exactMatch && searchPhrase.trim()) {
    try {
      candidates = await Product.find(
        { $text: { $search: searchPhrase }, status: "published" },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(10)
        .lean();
    } catch {
      // Text index might not be available — fall back to regex
      candidates = await Product.find({
        status: "published",
        $or: searchTokens.slice(0, 5).map((t) => ({
          $or: [
            { name: { $regex: t, $options: "i" } },
            { brand: { $regex: t, $options: "i" } },
            { model: { $regex: t, $options: "i" } },
          ],
        })),
      })
        .limit(10)
        .lean();
    }

    // Re-score candidates by token overlap with URL text
    candidates = candidates
      .map((p) => ({
        ...p,
        _overlap: tokenOverlap(urlText, `${p.name} ${p.brand} ${p.model} ${p.category}`),
      }))
      .sort((a, b) => b._overlap - a._overlap);

    // Promote best candidate to exact match if overlap is strong
    if (candidates[0]?._overlap >= 0.35) {
      exactMatch = candidates[0];
    }
  }

  // ── 4. Fetch vendor offers for matched product ────────────────────────────

  let vendorOffers = [];
  if (exactMatch) {
    const offers = await VendorOffer.find({
      product: exactMatch._id,
      status: "approved",
    })
      .populate("vendor", "name company")
      .lean();

    vendorOffers = offers.map((o) => ({
      platform: "Industry Mandi",
      platform_id: "industry_mandi",
      platform_color: "#FF4D26",
      seller: o.vendor?.company || o.vendor?.name || "Verified Vendor",
      price: o.price,
      mrp: o.price ? Math.round(o.price * 1.15) : null,
      discount: o.discount || 0,
      availability: o.stock === "available" ? "In Stock" : o.stock === "limited" ? "Limited" : "Out of Stock",
      shipping: o.shippingCost || 0,
      url: o.sellerUrl || `/product/${exactMatch.slug || exactMatch._id}`,
      delivery: o.deliveryEstimate || "3-7 business days",
      warranty: o.warranty || null,
      last_updated: o.updatedAt,
      source: "internal",
      fetch_required: false,
    }));
  }

  // ── 5. External platform rows ─────────────────────────────────────────────

  const externalRows = buildExternalRows(platform, identifiers, rawUrl, exactMatch);

  // ── 6. Combine + sort by price ────────────────────────────────────────────

  const allOffers = [
    ...vendorOffers,
    ...externalRows,
  ].sort((a, b) => {
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  // ── 7. Similar products (top 6 fuzzy candidates excluding exact match) ────

  const similar = candidates
    .filter((c) => !exactMatch || String(c._id) !== String(exactMatch._id))
    .slice(0, 6)
    .map(({ _overlap, ...p }) => p);

  return res.json({
    success: true,
    data: {
      platform: platform
        ? { id: platform.id, name: platform.name, color: platform.color }
        : null,
      identifiers,
      matched: exactMatch
        ? {
          _id: exactMatch._id,
          slug: exactMatch.slug,
          name: exactMatch.name,
          brand: exactMatch.brand,
          model: exactMatch.model,
          sku: exactMatch.sku,
          category: exactMatch.category,
          description: exactMatch.description,
          specifications: Object.fromEntries(exactMatch.specifications || []),
          technicalSpecifications: Object.fromEntries(exactMatch.technicalSpecifications || []),
          images: exactMatch.images || [],
          rating: exactMatch.rating,
          reviewCount: exactMatch.reviewCount,
        }
        : null,
      offers: allOffers,
      similar,
    },
  });
}
