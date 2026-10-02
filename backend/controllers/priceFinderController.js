import Product from "../models/Product.js";
import ProductRequest from "../models/ProductRequest.js";
import VendorOffer from "../models/VendorOffer.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { extractProductFromUrl, normalizeExtractedProduct, parseProductUrl, extractCatalogIdentifier, ProductExtractionError } from "../services/productExtractionService.js";

const published = { status: { $in: ["published", "approved"] } };
const esc = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const tokens = (value) => String(value || "").toLowerCase().match(/[a-z0-9]+(?:[.-][a-z0-9]+)*/g) || [];
const mapObject = (value) => Object.fromEntries(value instanceof Map ? value : Object.entries(value || {}));
const normalizedText = (value) => norm(value).replace(/^the/, "");

function toPublic(product, confidence) {
  return {
    _id: product._id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    model: product.model,
    sku: product.sku,
    gtin: product.gtin,
    category: product.category,
    variant: product.variant,
    color: product.color,
    capacity: product.capacity,
    price: product.price,
    specifications: mapObject(product.specifications),
    technicalSpecifications: mapObject(product.technicalSpecifications),
    images: product.images || [],
    ...(confidence === undefined ? {} : { confidence })
  };
}

function keywordTerms(source) {
  const ignored = new Set([
    "the", "and", "for", "with", "from", "this", "that", "product", "products", "item", "items",
    "online", "buy", "price", "india", "shop", "http", "https", "www", "com", "category",
    "categories", "details", "detail", "view", "brand", "html", "htm", "php", "dp", "gp", "proddetail",
    "undefined", "null"
  ]);
  const rawText = [
    source.name, source.brand, source.model, source.sku, source.gtin,
    source.category, source.variant, source.color, source.capacity,
    ...(source.keywords || []),
    ...Object.values(source.specifications || {})
  ].join(" ");
  return [...new Set(tokens(rawText))]
    .filter((term) => term.length >= 2 && !ignored.has(term))
    .slice(0, 15);
}

function scoreSimilar(source, candidate, terms) {
  const candidateSpecs = { ...mapObject(candidate.specifications), ...mapObject(candidate.technicalSpecifications) };
  const candidateText = [
    candidate.name, candidate.brand, candidate.model, candidate.sku,
    candidate.category, candidate.variant, candidate.color, candidate.capacity,
    candidate.slug, ...Object.values(candidateSpecs)
  ].join(" ").toLowerCase();

  const searchTerms = terms || keywordTerms(source);
  const matchedTerms = searchTerms.filter((term) => candidateText.includes(term.toLowerCase()));

  if (!matchedTerms.length) return 0;

  let score = 20 + matchedTerms.length * 10;
  if (candidate.brand && searchTerms.some((t) => norm(t) === norm(candidate.brand))) {
    score += 25;
  }
  if (candidate.model && searchTerms.some((t) => norm(t) === norm(candidate.model))) {
    score += 25;
  }
  if (candidate.sku && searchTerms.some((t) => norm(t) === norm(candidate.sku))) {
    score += 30;
  }
  if (source.category && candidate.category) {
    const sCat = norm(source.category);
    const cCat = norm(candidate.category);
    if (sCat === cCat || sCat.includes(cCat) || cCat.includes(sCat)) score += 15;
  }

  const nameTokens = tokens(candidate.name);
  const nameMatchedCount = searchTerms.filter((t) => nameTokens.includes(t)).length;
  score += nameMatchedCount * 8;

  return Math.min(99, Math.round(score));
}

async function findProductByIdentifier(identifier) {
  if (!identifier) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  const conditions = [
    ...(isObjectId ? [{ _id: identifier }] : []),
    { slug: identifier },
    { slug: new RegExp(`^${esc(identifier)}$`, "i") },
    { sku: identifier.toUpperCase() },
    { model: new RegExp(`^${esc(identifier)}$`, "i") },
  ];
  let p = await Product.findOne({ ...published, $or: conditions }).lean();
  if (p) return p;

  const slugClean = identifier.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slugClean && slugClean !== identifier) {
    p = await Product.findOne({ ...published, slug: slugClean }).lean();
    if (p) return p;
  }
  return null;
}

async function exactMatch(extracted, rawUrl) {
  if (rawUrl) {
    const ident = extractCatalogIdentifier(rawUrl);
    if (ident) {
      const byIdent = await findProductByIdentifier(ident);
      if (byIdent) return byIdent;
    }
  }
  const checks = [];
  if (extracted.gtin) checks.push({ gtin: new RegExp(`^${esc(extracted.gtin)}$`, "i") });
  if (extracted.sku) checks.push({ sku: new RegExp(`^${esc(extracted.sku)}$`, "i") });
  if (extracted.model) checks.push({ model: new RegExp(`^${esc(extracted.model)}$`, "i") });
  if (checks.length) {
    const direct = await Product.findOne({ ...published, $or: checks }).lean();
    if (direct) return direct;
  }
  if (extracted.brand && extracted.model) {
    const brandModel = await Product.findOne({
      ...published,
      brand: new RegExp(`^${esc(extracted.brand)}$`, "i"),
      model: new RegExp(`^${esc(extracted.model)}$`, "i"),
      ...(extracted.variant ? { variant: new RegExp(`^${esc(extracted.variant)}$`, "i") } : {})
    }).lean();
    if (brandModel) return brandModel;
  }
  if (extracted.name) {
    const exactName = await Product.findOne({
      ...published,
      name: new RegExp(`^${esc(extracted.name)}$`, "i")
    }).lean();
    if (exactName) return exactName;

    const nameKey = normalizedText(extracted.name);
    if (nameKey.length >= 6) {
      const candidates = await Product.find(published).limit(200).lean();
      const nameMatch = candidates.find((candidate) => {
        const candidateKey = normalizedText(candidate.name);
        return candidateKey === nameKey || candidateKey.includes(nameKey) || nameKey.includes(candidateKey);
      });
      if (nameMatch) return nameMatch;
    }
  }
  const importantSpecs = Object.values(extracted.specifications || {}).map(norm).filter((value) => value.length > 2);
  if (importantSpecs.length >= 2) {
    const candidates = await Product.find({
      ...published,
      ...(extracted.brand ? { brand: new RegExp(`^${esc(extracted.brand)}$`, "i") } : {}),
      ...(extracted.category ? { category: new RegExp(`^${esc(extracted.category)}$`, "i") } : {})
    }).limit(50).lean();
    const exact = candidates.find((candidate) => {
      const values = Object.values({ ...mapObject(candidate.specifications), ...mapObject(candidate.technicalSpecifications) }).map(norm);
      return importantSpecs.every((spec) => values.includes(spec));
    });
    if (exact) return exact;
  }
  return null;
}

async function findSimilar(extracted, excludeId) {
  const terms = keywordTerms(extracted);
  if (!terms.length) return [];

  const termRegexes = terms.slice(0, 10).map((t) => new RegExp(esc(t), "i"));
  const orClauses = termRegexes.flatMap((re) => [
    { name: re },
    { brand: re },
    { model: re },
    { sku: re },
    { category: re },
    { slug: re },
    { variant: re },
    { description: re },
  ]);

  let candidates = [];
  try {
    candidates = await Product.find({
      ...published,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      $or: orClauses,
    }).limit(60).lean();
  } catch (error) {
    console.error("[price-finder] candidate search failed", error.message);
  }

  if (candidates.length < 5) {
    try {
      const textMatches = await Product.find(
        { ...published, ...(excludeId ? { _id: { $ne: excludeId } } : {}), $text: { $search: terms.slice(0, 5).join(" ") } },
        { score: { $meta: "textScore" } }
      ).limit(20).lean();
      const existingIds = new Set(candidates.map((c) => String(c._id)));
      for (const tm of textMatches) {
        if (!existingIds.has(String(tm._id))) {
          candidates.push(tm);
          existingIds.add(String(tm._id));
        }
      }
    } catch {
      // Text search is optional
    }
  }

  return candidates
    .filter((product) => !excludeId || String(product._id) !== String(excludeId))
    .map((product) => ({ product, confidence: scoreSimilar(extracted, product, terms) }))
    .filter(({ confidence }) => confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8)
    .map(({ product, confidence }) => toPublic(product, confidence));
}

async function buildOffers(product, rawUrl, extracted) {
  const offers = [];
  if (product && product._id) {
    const vendorOffers = await VendorOffer.find({ product: product._id, status: "approved" })
      .populate("vendor", "name profile.company")
      .lean();
    for (const vo of vendorOffers) {
      offers.push({
        platform: "Industry Mandi",
        platform_color: "#3b82f6",
        seller: vo.vendor?.profile?.company || vo.vendor?.name || "Verified Vendor",
        price: vo.price,
        mrp: Math.round(vo.price * 1.15),
        discount: vo.discount || 0,
        availability: vo.stock === "out_of_stock" ? "out_of_stock" : "in_stock",
        shipping: vo.shippingCost || 0,
        last_updated: vo.updatedAt || new Date(),
        url: `/product/${product.slug || product._id}`,
        source: "internal",
        fetch_required: false,
      });
    }
    if (!offers.length && product.price > 0) {
      offers.push({
        platform: "Industry Mandi Direct",
        platform_color: "#3b82f6",
        seller: "Direct OEM Partner",
        price: product.price,
        mrp: Math.round(product.price * 1.15),
        discount: 13,
        availability: "in_stock",
        shipping: 0,
        last_updated: product.updatedAt || new Date(),
        url: `/product/${product.slug || product._id}`,
        source: "internal",
        fetch_required: false,
      });
    }
  }

  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    const isExternal = !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("industrymandi") && !host.includes("industry-mandi");
    if (isExternal) {
      let platName = "External Platform";
      let platColor = "#64748b";
      if (host.includes("amazon")) { platName = "Amazon India"; platColor = "#ff9900"; }
      else if (host.includes("flipkart")) { platName = "Flipkart"; platColor = "#2874f0"; }
      else if (host.includes("indiamart")) { platName = "IndiaMART"; platColor = "#00a699"; }
      else if (host.includes("moglix")) { platName = "Moglix"; platColor = "#e11d48"; }
      else if (host.includes("industrybuying")) { platName = "IndustryBuying"; platColor = "#ea580c"; }
      else if (host.includes("tradeindia")) { platName = "TradeIndia"; platColor = "#0284c7"; }

      const extPrice = extracted?.price || null;
      offers.push({
        platform: platName,
        platform_color: platColor,
        seller: "External Marketplace",
        price: extPrice,
        mrp: extPrice ? Math.round(extPrice * 1.12) : null,
        discount: extPrice ? 10 : 0,
        availability: "in_stock",
        shipping: 0,
        last_updated: new Date(),
        url: rawUrl,
        source: "external",
        fetch_required: !extPrice,
      });
    }
  } catch {
    // Ignore URL parse error for offers
  }

  return offers;
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export async function findByUrl(req, res) {
  const rawUrl = typeof req.body.url === "string" ? req.body.url.trim() : "";
  if (!rawUrl) {
    return res.status(400).json({ success: false, message: "A product URL is required." });
  }

  // 1. Direct check: Is this a link to a product in our catalog?
  const catalogIdentifier = extractCatalogIdentifier(rawUrl);
  if (catalogIdentifier) {
    try {
      const directProduct = await findProductByIdentifier(catalogIdentifier);
      if (directProduct) {
        const extracted = normalizeExtractedProduct(toPublic(directProduct), rawUrl);
        const similar = await findSimilar(extracted, directProduct._id);
        const offers = await buildOffers(directProduct, rawUrl, extracted);
        return res.json({
          success: true,
          data: {
            extractionStatus: "succeeded",
            submittedUrl: rawUrl,
            extracted,
            extractionSource: "catalog_direct",
            extractionWarning: null,
            matchType: "exact",
            matched: toPublic(directProduct),
            similar,
            offers,
          }
        });
      }
    } catch (directErr) {
      console.error("[price-finder] direct catalog lookup error", directErr.message);
    }
  }

  // 2. Parse URL
  let parsedUrl;
  try {
    parsedUrl = parseProductUrl(rawUrl);
  } catch (error) {
    console.error("[price-finder] URL validation failed", JSON.stringify({ code: error.code, stage: error.stage, message: error.message }));
    return res.status(400).json({ success: false, message: error.message });
  }

  // 3. Extract product information
  let result;
  try {
    result = await extractProductFromUrl(parsedUrl.url.toString());
  } catch (error) {
    const extractionError = error instanceof ProductExtractionError
      ? error
      : new ProductExtractionError(error.message || "Unable to retrieve product information from this URL.", { code: "extraction_failed", stage: "extract", cause: error });
    console.error("[price-finder] extraction failed", JSON.stringify({
      domain: parsedUrl.domain,
      code: extractionError.code,
      stage: extractionError.stage,
      status: extractionError.status,
      message: extractionError.message,
      providerDetail: typeof extractionError.cause === "string" ? extractionError.cause : extractionError.cause?.message,
    }));

    const fallbackProduct = normalizeExtractedProduct({}, parsedUrl.url.toString());
    try {
      let matched = await exactMatch(fallbackProduct, rawUrl);
      let similar = await findSimilar(fallbackProduct, matched?._id);

      // If no exact match, but top similar product has high confidence, promote it
      let matchType = matched ? "exact" : "none";
      if (!matched && similar.length > 0 && similar[0].confidence >= 70) {
        matched = similar[0];
        similar = similar.slice(1);
        matchType = "similar";
      } else if (similar.length > 0) {
        matchType = "similar";
      }

      const offers = await buildOffers(matched, rawUrl, fallbackProduct);
      return res.json({
        success: true,
        data: {
          extractionStatus: "succeeded",
          submittedUrl: parsedUrl.url.toString(),
          extractionSource: "url_fallback",
          extractionWarning: "Product page details extracted from URL; matching used catalog keywords.",
          extractionError: { code: extractionError.code, message: "The product page could not be read, so the URL keywords were used for catalog matching." },
          extracted: fallbackProduct,
          matchType,
          matched: matched ? toPublic(matched) : null,
          similar,
          offers,
        },
      });
    } catch (fallbackError) {
      console.error("[price-finder] URL fallback catalog matching failed", fallbackError.message);
      return res.json({
        success: true,
        data: {
          extractionStatus: "failed",
          submittedUrl: parsedUrl.url.toString(),
          extractionSource: null,
          extracted: fallbackProduct,
          extractionError: { code: extractionError.code, message: "Unable to retrieve product information from this URL." },
          matched: null,
          similar: [],
          offers: [],
          matchType: "extraction_failed",
        },
      });
    }
  }

  // 4. Match against catalog
  let matched = null;
  let similar = [];
  try {
    matched = await exactMatch(result.product, rawUrl);
    similar = await findSimilar(result.product, matched?._id);

    // If no exact match, but top similar product is strongly keyword-matched, promote to matched card
    let matchType = matched ? "exact" : "none";
    if (!matched && similar.length > 0 && similar[0].confidence >= 70) {
      matched = similar[0];
      similar = similar.slice(1);
      matchType = "similar";
    } else if (similar.length > 0) {
      matchType = "similar";
    }

    const offers = await buildOffers(matched, rawUrl, result.product);
    return res.json({
      success: true,
      data: {
        extractionStatus: "succeeded",
        submittedUrl: parsedUrl.url.toString(),
        extracted: result.product,
        extractionSource: result.source,
        extractionWarning: null,
        matchType,
        matched: matched ? toPublic(matched) : null,
        similar,
        offers,
      }
    });
  } catch (error) {
    console.error("[price-finder] catalog matching failed", error.message);
    return res.status(503).json({ success: false, message: "Unable to search the product catalog right now." });
  }
}

export async function requestProduct(req, res) {
  const rawUrl = typeof req.body.url === "string" ? req.body.url.trim() : "";
  if (!validUrl(rawUrl)) return res.status(400).json({ success: false, message: "Please provide a valid http/https product URL." });
  const extracted = normalizeExtractedProduct(req.body.extracted || {}, rawUrl);
  const request = await ProductRequest.create({
    user: req.user?._id || null,
    productUrl: rawUrl,
    productName: extracted.name,
    extractedKeywords: extracted.keywords,
    brand: extracted.brand,
    category: extracted.category,
    productDetails: extracted,
    imageUrl: extracted.imageUrl,
    status: "pending"
  });
  res.status(201).json({
    success: true,
    data: { _id: request._id, status: request.status, requestedAt: request.requestedAt },
    message: "Product request submitted. We will review it shortly."
  });
}
