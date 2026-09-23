import mongoose from "mongoose";
import Product from "../models/Product.js";
import VendorOffer from "../models/VendorOffer.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import slugify from "slugify";
import { rank } from "../services/rankingService.js";
import { parseSearch, summarizeComparison } from "../services/aiService.js";

const publicStatuses = ["approved", "published"];

/** Escape a string so it is safe to use inside a MongoDB $regex */
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parse = (value, fallback = {}) => {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const imageUrl = (req, file) =>
  `${req.protocol}://${req.get("host")}/uploads/products/${file.filename}`;

const normalizeImages = (req, existing = []) => {
  const retained = parse(req.body.retainedImages, existing);
  const old = (Array.isArray(retained) ? retained : [])
    .map((x) => (typeof x === "string" ? { url: x } : x))
    .filter((x) => x?.url);
  const fresh = (req.files || []).map((file) => ({
    url: imageUrl(req, file),
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
    alt: "",
    isPrimary: false,
  }));
  const images = [...old, ...fresh];
  const requested = Number(req.body.primaryImageIndex);
  const primary =
    Number.isInteger(requested) && requested >= 0 && requested < images.length
      ? requested
      : images.findIndex((x) => x.isPrimary);
  images.forEach((image, index) => {
    image.isPrimary = index === (primary >= 0 ? primary : 0);
  });
  return images;
};

/**
 * Extract product fields from req.body.
 * Does NOT strip protected fields here — callers are responsible for that.
 */
const productData = (req) => {
  const data = { ...req.body };
  for (const field of [
    "specifications",
    "technicalSpecifications",
    "metrics",
    "seo",
    "oemManual",
  ])
    data[field] = parse(data[field], data[field]);
  if (data.oemManualTitle || data.oemManualUrl) {
    data.oemManual = {
      title: data.oemManualTitle || "OEM product manual",
      url: data.oemManualUrl || "",
    };
  }
  delete data.oemManualTitle;
  delete data.oemManualUrl;
  for (const field of ["pros", "cons"]) {
    const values = parse(data[field], data[field]);
    data[field] = Array.isArray(values)
      ? values.filter((value) => typeof value === "string" && value.trim())
      : undefined;
  }
  for (const field of ["price", "stock"])
    if (data[field] !== undefined && data[field] !== "")
      data[field] = Number(data[field]);
  delete data.retainedImages;
  delete data.primaryImageIndex;
  return data;
};

/**
 * Fields that a vendor is NOT allowed to set or overwrite.
 * These are stripped before any vendor create/update operation.
 */
const VENDOR_PROTECTED_FIELDS = [
  "status",
  "role",
  "reviewedBy",
  "reviewedAt",
  "publishedAt",
  "rating",
  "reviewCount",
  "submittedBy",
  "lastUploadedBy",
];

const uniqueSlug = async (data) => {
  const base =
    slugify(`${data.brand || ""}-${data.name || ""}-${data.model || ""}`, {
      lower: true,
      strict: true,
    }) || `product-${Date.now()}`;
  let slug = base,
    n = 2;
  while (await Product.exists({ slug, _id: { $ne: data._id } }))
    slug = `${base}-${n++}`;
  return slug;
};

const uniqueSku = async (data) => {
  const prefix = `${String(data.brand || "GEN").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase()}-${String(data.category || "ITEM").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase()}`;
  let sku = `${prefix}-${String(data.model || Date.now()).replace(/[^a-z0-9]/gi, "").toUpperCase()}`;
  let suffix = 2;
  while (await Product.exists({ sku, _id: { $ne: data._id } })) sku = `${prefix}-${String(data.model || Date.now()).replace(/[^a-z0-9]/gi, "").toUpperCase()}-${suffix++}`;
  return sku;
};

// ── H6: cap limit to 100 ──────────────────────────────────────────────────────
export async function list(req, res) {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    page = 1,
  } = req.query;

  // M5: cap and validate pagination inputs
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 12), 100);
  const pageNum = Math.max(1, Number(page) || 1);

  const filter = { status: { $in: publicStatuses } };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;

  // M5: escape user-controlled search string before regex
  if (req.query.q) {
    const searchPattern = escapeRegex(String(req.query.q).trim());
    if (searchPattern) {
      filter.$or = ["name", "brand", "model", "sku", "category", "description"].map((field) => ({
        [field]: { $regex: searchPattern, $options: "i" },
      }));
    }
  }

  let items = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limit)
    .limit(limit);

  if (minPrice || maxPrice) {
    const priceFilter = { status: "approved", stock: "available" };
    if (minPrice) priceFilter.price = { ...(priceFilter.price || {}), $gte: Number(minPrice) };
    if (maxPrice) priceFilter.price = { ...(priceFilter.price || {}), $lte: Number(maxPrice) };
    const ids = await VendorOffer.find(priceFilter).distinct("product");
    items = items.filter((x) => ids.some((id) => String(id) === String(x._id)));
  }

  res.json({
    success: true,
    message: "Products retrieved successfully",
    data: { items, page: pageNum, total: await Product.countDocuments(filter) },
  });
}

export async function detail(req, res) {
  const query = mongoose.Types.ObjectId.isValid(req.params.slug)
    ? { $or: [{ slug: req.params.slug }, { _id: req.params.slug }], status: { $in: publicStatuses } }
    : { slug: req.params.slug, status: { $in: publicStatuses } };
  const p = await Product.findOne(query);
  if (!p)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  const vendorIds = await User.find({
    role: "vendor",
    status: "approved",
  }).distinct("_id");
  const offers = await VendorOffer.find({
    product: p._id,
    vendor: { $in: vendorIds },
    status: "approved",
    stock: { $ne: "out_of_stock" },
  })
    .populate("vendor", "name profile.company")
    .sort("price");
  const reviews = await Review.find({
    product: p._id,
    status: "approved",
  }).populate("buyer", "name");
  res.json({
    success: true,
    message: "Product retrieved successfully",
    data: { product: p, offers, bestOffer: offers[0] || null, reviews },
  });
}

export async function productRecommendations(req, res) {
  const query = mongoose.Types.ObjectId.isValid(req.params.slug)
    ? { $or: [{ slug: req.params.slug }, { _id: req.params.slug }], status: { $in: publicStatuses } }
    : { slug: req.params.slug, status: { $in: publicStatuses } };
  const product = await Product.findOne(query);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  const catalogue = await Product.find({ _id: { $ne: product._id }, category: product.category, status: { $in: publicStatuses } }).limit(24);
  const sourceSpecs = { ...(product.specifications?.toObject?.() || product.specifications || {}), ...(product.technicalSpecifications?.toObject?.() || product.technicalSpecifications || {}) };
  const similar = catalogue.map((candidate) => {
    const candidateSpecs = { ...(candidate.specifications?.toObject?.() || candidate.specifications || {}), ...(candidate.technicalSpecifications?.toObject?.() || candidate.technicalSpecifications || {}) };
    const sharedSpecs = Object.keys(sourceSpecs).filter((key) => String(sourceSpecs[key]).toLowerCase() === String(candidateSpecs[key]).toLowerCase());
    const gap = Math.abs(Number(candidate.price || 0) - Number(product.price || 0));
    const priceScore = product.price && candidate.price ? Math.max(0, 3 - gap / Math.max(product.price * .25, 1)) : 0;
    return { product: candidate, score: sharedSpecs.length * 4 + priceScore, sharedSpecs };
  }).sort((a, b) => b.score - a.score || Number(b.product.rating || 0) - Number(a.product.rating || 0)).slice(0, 4).map(({ product: item, sharedSpecs }) => ({ product: item, reason: sharedSpecs.length ? `Similar specifications: ${sharedSpecs.slice(0, 2).join(", ")}` : `A comparable ${item.category} option` }));
  const pairs = await Order.aggregate([
    { $match: { status: { $nin: ["Cancelled"] }, "items.product": product._id } },
    { $unwind: "$items" }, { $match: { "items.product": { $nin: [product._id, null] } } },
    { $group: { _id: "$items.product", orders: { $sum: 1 } } }, { $sort: { orders: -1 } }, { $limit: 4 },
  ]);
  const pairedProducts = await Product.find({ _id: { $in: pairs.map((pair) => pair._id) }, status: { $in: publicStatuses } });
  const pairedById = new Map(pairedProducts.map((item) => [String(item._id), item]));
  const boughtTogether = pairs.map((pair) => pairedById.get(String(pair._id)) && ({ product: pairedById.get(String(pair._id)), reason: `Purchased with this item in ${pair.orders} order${pair.orders === 1 ? "" : "s"}`, orders: pair.orders })).filter(Boolean);
  if (!boughtTogether.length) boughtTogether.push(...catalogue.filter((item) => item.brand !== product.brand).slice(0, 3).map((item) => ({ product: item, reason: "Useful companion option while order data is being collected", fallback: true })));
  res.json({ success: true, message: "Product recommendations retrieved", data: { similar, boughtTogether, boughtTogetherBasedOnOrders: boughtTogether.some((item) => !item.fallback) } });
}

// ── C5: Strip protected fields for vendor product creation ────────────────────
export async function create(req, res) {
  const data = productData(req);
  data.images = normalizeImages(req);

  // These are always set by the server — never accepted from client
  data.submittedBy = req.user._id;
  data.lastUploadedBy = req.user._id;

  // Determine status: admin can create approved products; vendors go to pending/draft
  if (req.user.role === "admin") {
    data.status = "approved";
  } else {
    // Vendor — strip any status they may have tried to inject
    VENDOR_PROTECTED_FIELDS.forEach((f) => delete data[f]);
    data.status = data.saveAsDraft === "true" ? "draft" : "pending";
  }
  delete data.saveAsDraft;

  data.slug = await uniqueSlug(data);
  data.sku = data.sku || (await uniqueSku(data));
  const p = await Product.create(data);
  res.status(201).json({
    success: true,
    message:
      data.status === "draft"
        ? "Product draft saved"
        : "Product submitted for approval",
    data: p,
  });
}

// ── C6: Apply field whitelist in vendorUpdate before Object.assign ─────────────
export async function vendorUpdate(req, res) {
  const p = await Product.findOne({
    _id: req.params.id,
    submittedBy: req.user._id,
  });
  if (!p)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  if (!["draft", "rejected", "changes_requested"].includes(p.status))
    return res.status(409).json({
      success: false,
      message:
        "Only drafts, rejected products, or products with requested changes can be edited",
    });

  const data = productData(req);

  // Strip all protected fields before merging — vendor cannot self-approve
  VENDOR_PROTECTED_FIELDS.forEach((f) => delete data[f]);

  if (req.files?.length || req.body.retainedImages !== undefined)
    data.images = normalizeImages(req, p.images);
  if (req.files?.length) data.lastUploadedBy = req.user._id;

  Object.assign(p, data);
  if (data.name || data.brand || data.model) p.slug = await uniqueSlug(p);
  await p.save();
  res.json({ success: true, message: "Product draft updated", data: p });
}

export async function submit(req, res) {
  const p = await Product.findOne({
    _id: req.params.id,
    submittedBy: req.user._id,
  });
  if (!p)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  if (!["draft", "rejected", "changes_requested"].includes(p.status))
    return res.status(409).json({
      success: false,
      message: "This product cannot be submitted in its current state",
    });
  p.status = "pending";
  p.reviewReason = undefined;
  await p.save();
  res.json({
    success: true,
    message: "Product submitted for admin review",
    data: p,
  });
}

// ── H8: Vendor can only delete draft/rejected/changes_requested products ──────
export async function vendorDelete(req, res) {
  const product = await Product.findOne({
    _id: req.params.id,
    submittedBy: req.user._id,
  });

  if (!product)
    return res.status(404).json({ success: false, message: "Product not found" });

  if (!["draft", "rejected", "changes_requested"].includes(product.status))
    return res.status(409).json({
      success: false,
      message: "Only draft, rejected, or changes-requested products can be deleted",
    });

  await product.deleteOne();
  res.json({ success: true, message: "Product deleted successfully" });
}

export async function compare(req, res) {
  const ids = (req.query.ids || "").split(",").filter(Boolean);
  if (ids.length < 2 || ids.length > 5)
    return res
      .status(422)
      .json({ success: false, message: "Select 2 to 5 products" });
  const validObjectIds = ids.filter(
    (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id
  );
  const stringIds = ids.filter((id) => !validObjectIds.includes(id));

  const queryConditions = [];
  if (validObjectIds.length > 0) queryConditions.push({ _id: { $in: validObjectIds } });
  if (stringIds.length > 0) {
    queryConditions.push({ slug: { $in: stringIds } });
    queryConditions.push({ sku: { $in: stringIds } });
  }

  const products = queryConditions.length > 0
    ? await Product.find({
        $or: queryConditions,
        status: { $in: publicStatuses },
      })
    : [];
  if (products.length !== ids.length)
    return res
      .status(422)
      .json({ success: false, message: "Some selected products are unavailable" });
  const categories = new Set(products.map((product) => product.category));
  if (categories.size !== 1)
    return res.status(422).json({
      success: false,
      message: "Compare products from the same category only",
    });
  const results = await rank(products);
  res.json({
    success: true,
    message: "Comparison generated",
    data: { results, summary: summarizeComparison(results) },
  });
}

// ── M4: Escape parsed search query before building regex ──────────────────────
export async function search(req, res) {
  const parsed = parseSearch(req.query.q || "");
  // Escape the parsed query before it propagates to list()
  req.query.q = parsed.query;
  if (parsed.maxPrice) req.query.maxPrice = parsed.maxPrice;
  return list(req, res);
}

// ── M3: Escape user-controlled regex in recommendations ──────────────────────
export async function recommendations(req, res) {
  const rawQ = (req.query.q || "").trim();
  const safeQ = escapeRegex(rawQ);
  const products = await Product.find({
    status: { $in: publicStatuses },
    $or: [
      { name: { $regex: safeQ, $options: "i" } },
      { description: { $regex: safeQ, $options: "i" } },
      { category: { $regex: safeQ, $options: "i" } },
    ],
  }).limit(8);
  res.json({
    success: true,
    message: "Database-grounded recommendations retrieved",
    data: products.map((p) => ({
      product: p,
      why: `Matches verified ${p.category} catalogue data.`,
      limitations:
        "Use the comparison tool for a weighted, price-aware ranking.",
    })),
  });
}
