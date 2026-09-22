import mongoose from "mongoose";
import Product from "../models/Product.js";
import VendorOffer from "../models/VendorOffer.js";
import PairingRequest from "../models/PairingRequest.js";
import { matchProducts } from "../services/aiService.js";

/** Escape a string so it is safe to use inside a MongoDB $regex */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── C2: Explicit field whitelist for offer creation ───────────────────────────
export async function offer(req, res) {
  const p = await Product.findById(req.body.product);
  if (!p)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });

  // H4: clamp price to > 0
  const price = Number(req.body.price);
  if (!price || price <= 0)
    return res.status(422).json({ success: false, message: "Price must be a positive number" });

  // Whitelist only safe fields — never accept vendor, status, or product from body
  const x = await VendorOffer.create({
    product: req.body.product,
    vendor: req.user._id,          // always from authenticated session
    price,
    discount: Number(req.body.discount) || 0,
    stock: req.body.stock,
    sku: req.body.sku,
    sellerUrl: req.body.sellerUrl,
    shippingCost: Number(req.body.shippingCost) || 0,
    deliveryEstimate: req.body.deliveryEstimate,
    warranty: req.body.warranty,
    status: "pending",             // always start as pending — never from body
  });
  res
    .status(201)
    .json({ success: true, message: "Offer submitted for approval", data: x });
}

export async function offers(req, res) {
  const data = await VendorOffer.find({ vendor: req.user._id }).populate(
    "product",
    "name slug",
  );
  res.json({ success: true, message: "Offers retrieved", data });
}

export async function pairing(req, res) {
  const product = await Product.findOne({
    _id: req.body.product,
    status: { $in: ["approved", "published"] },
  });
  if (!product)
    return res
      .status(404)
      .json({
        success: false,
        message: "Select an approved master product to pair.",
      });

  const existing = await PairingRequest.findOne({
    vendor: req.user._id,
    product: product._id,
    status: { $in: ["pending", "approved"] },
  });
  if (existing)
    return res
      .status(409)
      .json({
        success: false,
        message: "You already have an active pairing for this product.",
      });

  // H4: price must be positive
  const price = Number(req.body.price);
  if (!price || price <= 0)
    return res.status(422).json({ success: false, message: "Price must be a positive number" });

  const x = await PairingRequest.create({
    vendor: req.user._id,
    product: product._id,
    submittedName: req.body.submittedName || product.name,
    offer: {
      price,
      stock: req.body.stock,
      sku: req.body.sku,
      warranty: req.body.warranty,
      shippingDetails: req.body.shippingDetails,
      shippingCost: Number(req.body.shippingCost || 0),
      deliveryEstimate: req.body.deliveryEstimate,
      sellerUrl: req.body.sellerUrl,
    },
    notes: req.body.notes,
  });
  res.status(201).json({
    success: true,
    message: "Pairing request submitted",
    data: x,
  });
}

// ── C9: All user-supplied strings properly escaped before use in $regex ───────
export async function pairingSearch(req, res) {
  if (req.query.id) {
    // Validate that the provided id is a real ObjectId to avoid CastError
    if (!mongoose.Types.ObjectId.isValid(req.query.id))
      return res.json({ success: true, message: "Products retrieved", data: [] });

    const product = await Product.findOne({
      _id: req.query.id,
      status: { $in: ["approved", "published"] },
    }).select("name brand model sku images specifications category");
    return res.json({
      success: true,
      message: "Products retrieved",
      data: product ? [product] : [],
    });
  }

  const q = (req.query.q || "").trim();
  if (!q)
    return res.json({ success: true, message: "Products retrieved", data: [] });

  // Escape user input before building $regex — prevents ReDoS and injection
  const safeQ = escapeRegex(q);
  const terms = q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => ({ $regex: escapeRegex(term), $options: "i" }));

  const data = await Product.find({
    status: { $in: ["approved", "published"] },
    $or: [
      { name: { $regex: safeQ, $options: "i" } },
      { brand: { $regex: safeQ, $options: "i" } },
      { model: { $regex: safeQ, $options: "i" } },
      { sku: { $regex: safeQ, $options: "i" } },
      { $and: terms.map((term) => ({ name: term })) },
    ],
  })
    .select("name brand model sku images specifications category")
    .limit(12);
  res.json({ success: true, message: "Matching products retrieved", data });
}

export async function pairings(req, res) {
  const data = await PairingRequest.find({ vendor: req.user._id })
    .populate("product", "name brand model images")
    .sort("-createdAt");
  res.json({ success: true, message: "Pairing requests retrieved", data });
}

export async function dashboard(req, res) {
  const [products, offers, pairings] = await Promise.all([
    Product.countDocuments({ submittedBy: req.user._id }),
    VendorOffer.countDocuments({ vendor: req.user._id }),
    PairingRequest.countDocuments({ vendor: req.user._id }),
  ]);
  res.json({
    success: true,
    message: "Vendor dashboard retrieved",
    data: { products, offers, pairings },
  });
}

export async function products(req, res) {
  const data = await Product.find({ submittedBy: req.user._id }).sort(
    "-createdAt",
  );
  res.json({ success: true, message: "Vendor products retrieved", data });
}
