import Product from "../models/Product.js";
import ProductRequest from "../models/ProductRequest.js";
import { extractProductFromUrl, normalizeExtractedProduct, parseProductUrl, ProductExtractionError } from "../services/productExtractionService.js";

const published = { status: { $in: ["published", "approved"] } };
const esc = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const tokens = (value) => String(value || "").toLowerCase().match(/[a-z0-9]+(?:[.-][a-z0-9]+)*/g) || [];
const mapObject = (value) => Object.fromEntries(value instanceof Map ? value : Object.entries(value || {}));
const asText = (product) => [product.name, product.brand, product.model, product.category, product.variant, product.color, product.capacity, ...Object.values(product.specifications || {})].join(" ");
const normalizedText = (value) => norm(value).replace(/^the/, "");
function toPublic(product, confidence) { return { _id: product._id, slug: product.slug, name: product.name, brand: product.brand, model: product.model, sku: product.sku, gtin: product.gtin, category: product.category, variant: product.variant, color: product.color, capacity: product.capacity, price: product.price, specifications: mapObject(product.specifications), technicalSpecifications: mapObject(product.technicalSpecifications), images: product.images || [], ...(confidence === undefined ? {} : { confidence }) }; }

function scoreSimilar(source, candidate) {
  // Keep title/identity terms separate from the long specification list: otherwise
  // a richly-described source product unfairly dilutes a very relevant title match.
  const sourceTokens = new Set(tokens([source.name, source.brand, source.model, source.variant, source.color, source.capacity].join(" ")));
  const candidateSpecs = { ...mapObject(candidate.specifications), ...mapObject(candidate.technicalSpecifications) };
  const candidateTokens = new Set(tokens([candidate.name, candidate.brand, candidate.model, candidate.variant, candidate.color, candidate.capacity].join(" ")));
  let score = [...sourceTokens].filter((token) => candidateTokens.has(token)).length / Math.max(sourceTokens.size, 1) * 55;
  if (source.brand && norm(source.brand) === norm(candidate.brand)) score += 15;
  if (source.category && norm(source.category) === norm(candidate.category)) score += 10;
  if (source.model && norm(source.model) === norm(candidate.model)) score += 10;
  for (const field of ["variant", "color", "capacity"]) if (source[field] && norm(source[field]) === norm(candidate[field])) score += 3;
  const sourceSpecs = Object.values(source.specifications || {}).map(norm).filter(Boolean), candidateValues = Object.values(candidateSpecs).map(norm);
  score += Math.min(7, sourceSpecs.filter((spec) => candidateValues.includes(spec)).length * 2);
  return Math.min(99, Math.round(score));
}

async function exactMatch(extracted) {
  const checks = [];
  if (extracted.gtin) checks.push({ gtin: new RegExp(`^${esc(extracted.gtin)}$`, "i") });
  if (extracted.sku) checks.push({ sku: new RegExp(`^${esc(extracted.sku)}$`, "i") });
  if (extracted.model) checks.push({ model: new RegExp(`^${esc(extracted.model)}$`, "i") });
  if (checks.length) { const direct = await Product.findOne({ ...published, $or: checks }).lean(); if (direct) return direct; }
  if (extracted.brand && extracted.model) {
    const brandModel = await Product.findOne({ ...published, brand: new RegExp(`^${esc(extracted.brand)}$`, "i"), model: new RegExp(`^${esc(extracted.model)}$`, "i"), ...(extracted.variant ? { variant: new RegExp(`^${esc(extracted.variant)}$`, "i") } : {}) }).lean();
    if (brandModel) return brandModel;
  }
  if (extracted.name) {
    const nameKey = normalizedText(extracted.name);
    if (nameKey.length >= 8) {
      const candidates = await Product.find(published).limit(200).lean();
      const nameMatch = candidates.find((candidate) => {
        const candidateKey = normalizedText(candidate.name);
        return candidateKey === nameKey || candidateKey.includes(nameKey) || nameKey.includes(candidateKey);
      });
      if (nameMatch) return nameMatch;
    }
  }
  // A product can also be exact when several distinctive page specifications agree.
  // Do this only with two or more values to avoid classifying a generic voltage/size as exact.
  const importantSpecs = Object.values(extracted.specifications || {}).map(norm).filter((value) => value.length > 2);
  if (importantSpecs.length >= 2) {
    const candidates = await Product.find({ ...published, ...(extracted.brand ? { brand: new RegExp(`^${esc(extracted.brand)}$`, "i") } : {}), ...(extracted.category ? { category: new RegExp(`^${esc(extracted.category)}$`, "i") } : {}) }).limit(50).lean();
    const exact = candidates.find((candidate) => {
      const values = Object.values({ ...mapObject(candidate.specifications), ...mapObject(candidate.technicalSpecifications) }).map(norm);
      return importantSpecs.every((spec) => values.includes(spec));
    });
    if (exact) return exact;
  }
  return null;
}
async function findSimilar(extracted, excludeId) {
  const terms = [...new Set([extracted.brand, extracted.category, extracted.model, ...extracted.keywords].filter(Boolean))].slice(0, 12);
  if (!terms.length) return [];
  const categoryTerms = tokens(extracted.category).filter((term) => term.length >= 4);
  const categoryScope = categoryTerms.length
    ? { $or: categoryTerms.map((term) => ({ category: { $regex: esc(term), $options: "i" } })) }
    : {};
  let candidates;
  try { candidates = await Product.find({ ...published, ...categoryScope, $text: { $search: terms.join(" ") } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).limit(30).lean(); }
  catch (error) {
    console.warn("[price-finder] text search unavailable; using regex similarity fallback", JSON.stringify({
      stage: "database_similarity",
      message: error.message,
    }));
    try {
      const termScope = {
        $or: terms.slice(0, 6).map((term) => ({
          $or: ["name", "brand", "model", "category", "variant"].map((field) => ({
            [field]: { $regex: esc(term), $options: "i" },
          })),
        })),
      };
      candidates = await Product.find({
        ...published,
        ...(categoryTerms.length ? { $and: [categoryScope, termScope] } : termScope),
      }).limit(30).lean();
    } catch (fallbackError) {
      console.error("[price-finder] regex similarity fallback failed", JSON.stringify({
        stage: "database_similarity",
        message: fallbackError.message,
      }));
      throw fallbackError;
    }
  }
  return candidates
    .filter((product) => !excludeId || String(product._id) !== String(excludeId))
    .map((product) => ({ product, confidence: scoreSimilar(extracted, product) }))
    .filter(({ confidence }) => confidence >= 35)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6)
    .map(({ product, confidence }) => toPublic(product, confidence));
}
function validUrl(value) { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol); } catch { return false; } }

export async function findByUrl(req, res) {
  const rawUrl = typeof req.body.url === "string" ? req.body.url.trim() : "";
  let parsedUrl;
  try {
    parsedUrl = parseProductUrl(rawUrl);
  } catch (error) {
    console.error("[price-finder] URL validation failed", JSON.stringify({ code: error.code, stage: error.stage, message: error.message }));
    return res.status(400).json({ success: false, message: error.message });
  }
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

    // URL slugs are a safe, provider-independent fallback for catalog matching.
    // This does not claim that the external page was read; it only uses the URL
    // identity when the approved AI provider is unavailable or rejects the page.
    const fallbackProduct = normalizeExtractedProduct({}, parsedUrl.url.toString());
    if (fallbackProduct.name && fallbackProduct.name.length >= 4) {
      try {
        const matched = await exactMatch(fallbackProduct);
        const similar = await findSimilar(fallbackProduct, matched?._id);
        return res.json({
          success: true,
          data: {
            extractionStatus: "succeeded",
            submittedUrl: parsedUrl.url.toString(),
            extractionSource: "url_fallback",
            extractionWarning: "AI product-page extraction was unavailable; matching used the product URL.",
            extractionError: { code: extractionError.code, message: "The product page could not be read, so the URL was used for catalog matching." },
            extracted: fallbackProduct,
            matchType: matched ? "exact" : similar.length ? "similar" : "none",
            matched: matched ? toPublic(matched) : null,
            similar,
          },
        });
      } catch (fallbackError) {
        console.error("[price-finder] URL fallback catalog matching failed", JSON.stringify({
          domain: parsedUrl.domain,
          stage: "database_match_fallback",
          message: fallbackError.message,
        }));
      }
    }

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
        matchType: "extraction_failed",
      },
    });
  }

  let matched;
  let similar = [];
  try {
    matched = await exactMatch(result.product);
    similar = await findSimilar(result.product, matched?._id);
  } catch (error) {
    console.error("[price-finder] catalog matching failed", JSON.stringify({
      domain: result.domain || parsedUrl.domain,
      stage: "database_match",
      message: error.message,
    }));
    return res.status(503).json({ success: false, message: "Unable to search the product catalog right now." });
  }
  res.json({ success: true, data: { extractionStatus: "succeeded", submittedUrl: parsedUrl.url.toString(), extracted: result.product, extractionSource: result.source, extractionWarning: null, matchType: matched ? "exact" : similar.length ? "similar" : "none", matched: matched ? toPublic(matched) : null, similar } });
}
export async function requestProduct(req, res) {
  const rawUrl = typeof req.body.url === "string" ? req.body.url.trim() : "";
  if (!validUrl(rawUrl)) return res.status(400).json({ success: false, message: "Please provide a valid http/https product URL." });
  const extracted = normalizeExtractedProduct(req.body.extracted || {}, rawUrl);
  const request = await ProductRequest.create({ user: req.user?._id || null, productUrl: rawUrl, productName: extracted.name, extractedKeywords: extracted.keywords, brand: extracted.brand, category: extracted.category, productDetails: extracted, imageUrl: extracted.imageUrl, status: "pending" });
  res.status(201).json({ success: true, data: { _id: request._id, status: request.status, requestedAt: request.requestedAt }, message: "Product request submitted. We will review it shortly." });
}
