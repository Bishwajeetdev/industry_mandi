import User from "../models/User.js";
import Product from "../models/Product.js";
import VendorOffer from "../models/VendorOffer.js";
import PairingRequest from "../models/PairingRequest.js";
import Review from "../models/Review.js";
import RankingConfiguration from "../models/RankingConfiguration.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
const recipients = {
  User: (x) => x._id,
  Product: (x) => x.submittedBy,
  VendorOffer: (x) => x.vendor,
  PairingRequest: (x) => x.vendor,
  Review: (x) => x.buyer,
};
const set =
  (Model, field = "status") =>
  async (req, res) => {
    const status = req.body.status || "approved";
    if (
      ![
        "approved",
        "rejected",
        "pending",
        "suspended",
        "inactive",
        "changes_requested",
      ].includes(status)
    )
      return res
        .status(422)
        .json({ success: false, message: "Invalid status" });
    const x = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: { [field]: status } },
      { new: true },
    );
    if (!x)
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    await AuditLog.create({
      user: req.user._id,
      action: `${Model.modelName}_${status}`,
      entityId: x._id,
      ip: req.ip,
    });
    const recipient = recipients[Model.modelName]?.(x);
    if (recipient)
      await Notification.create({
        user: recipient,
        type: `${Model.modelName}_${status}`,
        message: `Your ${Model.modelName.toLowerCase()} was ${status.replace("_", " ")}.`,
        entityId: x._id,
      });
    res.json({ success: true, message: "Status updated", data: x });
  };
export const updateVendor = set(User),
  updateProduct = set(Product),
  updateOffer = set(VendorOffer),
  updatePairing = set(PairingRequest),
  updateReview = set(Review);
export async function reviewPairing(req, res) {
  const status = req.body.status;
  if (!["approved", "rejected", "changes_requested"].includes(status))
    return res.status(422).json({ success: false, message: "Invalid pairing status" });
  const pairing = await PairingRequest.findById(req.params.id);
  if (!pairing) return res.status(404).json({ success: false, message: "Pairing request not found" });
  pairing.status = status;
  pairing.reviewReason = (req.body.reason || "").trim() || undefined;
  pairing.reviewedBy = req.user._id;
  pairing.reviewedAt = new Date();
  if (status === "approved") {
    await VendorOffer.findOneAndUpdate(
      { vendor: pairing.vendor, product: pairing.product },
      { $set: { ...pairing.offer.toObject(), vendor: pairing.vendor, product: pairing.product, status: "approved" } },
      { upsert: true, new: true, runValidators: true },
    );
  }
  await pairing.save();
  await Notification.create({ user: pairing.vendor, type: `PairingRequest_${status}`, message: `Your product pairing was ${status.replace("_", " ")}${pairing.reviewReason ? `: ${pairing.reviewReason}` : ""}.`, entityId: pairing._id });
  res.json({ success: true, message: status === "approved" ? "Pairing approved and vendor offer activated" : "Pairing review saved", data: pairing });
}
export async function reviewProduct(req, res) {
  const status = req.body.status;
  if (
    ![
      "approved",
      "rejected",
      "changes_requested",
      "published",
      "archived",
    ].includes(status)
  )
    return res
      .status(422)
      .json({ success: false, message: "Invalid product status" });
  const product = await Product.findById(req.params.id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  product.status = status;
  product.reviewReason = (req.body.reason || "").trim() || undefined;
  product.reviewedBy = req.user._id;
  product.reviewedAt = new Date();
  if (status === "published") product.publishedAt = new Date();
  await product.save();
  await AuditLog.create({
    user: req.user._id,
    action: `Product_${status}`,
    entityId: product._id,
    ip: req.ip,
  });
  if (product.submittedBy)
    await Notification.create({
      user: product.submittedBy,
      type: `Product_${status}`,
      message: `Your product was ${status.replace("_", " ")}${product.reviewReason ? `: ${product.reviewReason}` : ""}`,
      entityId: product._id,
    });
  res.json({ success: true, message: "Product review saved", data: product });
}
export async function editProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  const allowed = [
    "name",
    "brand",
    "model",
    "category",
    "subcategory",
    "description",
    "technicalSpecifications",
    "specifications",
    "price",
    "stock",
    "images",
    "metrics",
    "pros",
    "cons",
    "seo",
  ];
  for (const key of allowed)
    if (req.body[key] !== undefined) product[key] = req.body[key];
  if (
    req.body.status &&
    [
      "approved",
      "rejected",
      "changes_requested",
      "published",
      "archived",
    ].includes(req.body.status)
  ) {
    product.status = req.body.status;
    product.reviewReason = (req.body.reason || "").trim() || undefined;
    product.reviewedBy = req.user._id;
    product.reviewedAt = new Date();
  }
  if (req.body.status === "published") product.publishedAt = new Date();
  await product.save();
  res.json({ success: true, message: "Product updated", data: product });
}
export async function deleteProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });

  await product.deleteOne();
  await AuditLog.create({
    user: req.user._id,
    action: "Product_deleted",
    entityId: product._id,
    ip: req.ip,
  });
  res.json({ success: true, message: "Product deleted" });
}

export async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  if (user.role === "admin")
    return res.status(403).json({ success: false, message: "Admin accounts cannot be deleted" });

  await user.deleteOne();
  await AuditLog.create({
    user: req.user._id,
    action: "User_deleted",
    entityId: user._id,
    ip: req.ip,
  });
  res.json({ success: true, message: "User deleted" });
}
export async function dashboard(req, res) {
  const [
    users,
    vendors,
    pendingVendors,
    products,
    pendingProducts,
    offers,
    reviews,
    pairings,
    orders,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "vendor" }),
    User.countDocuments({ role: "vendor", status: "pending" }),
    Product.countDocuments(),
    Product.countDocuments({ status: "pending" }),
    VendorOffer.countDocuments({ status: "approved" }),
    Review.countDocuments({ status: "pending" }),
    PairingRequest.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: { $nin: ["Delivered", "Cancelled"] } }),
  ]);
  res.json({
    success: true,
    message: "Admin dashboard retrieved",
    data: {
      users,
      vendors,
      pendingVendors,
      products,
      pendingProducts,
      offers,
      reviews,
      pairings,
      orders,
    },
  });
}
// ── C7: Whitelist allowed weight keys and use $set — never pass req.body directly ──
const ALLOWED_WEIGHT_KEYS = new Set(["performance", "price", "display", "battery", "build", "features", "camera"]);
export async function ranking(req, res) {
  const rawWeights = req.body.weights || {};

  // Only accept known weight keys with numeric values
  const weights = {};
  for (const [key, val] of Object.entries(rawWeights)) {
    if (!ALLOWED_WEIGHT_KEYS.has(key))
      return res.status(422).json({ success: false, message: `Unknown weight key: ${key}` });
    const num = Number(val);
    if (!Number.isFinite(num) || num < 0 || num > 100)
      return res.status(422).json({ success: false, message: `Weight "${key}" must be a number between 0 and 100` });
    weights[key] = num;
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.round(total) !== 100)
    return res
      .status(422)
      .json({ success: false, message: "Ranking weights must sum to 100" });

  // Safe category string — no operator injection
  const category = String(req.body.category || "").trim();
  if (!category)
    return res.status(422).json({ success: false, message: "Category is required" });

  // Use explicit $set with whitelisted data only — never pass req.body
  const x = await RankingConfiguration.findOneAndUpdate(
    { category },
    { $set: { category, weights } },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ success: true, message: "Ranking configuration saved", data: x });
}
const queues = {
  vendors: [
    User,
    { role: "vendor", status: "pending" },
    "name email profile createdAt",
    [],
  ],
  products: [
    Product,
    { status: "pending" },
    "name brand model category submittedBy createdAt",
    ["submittedBy"],
  ],
  offers: [
    VendorOffer,
    { status: "pending" },
    "product vendor price stock createdAt",
    ["product", "vendor"],
  ],
  pairings: [
    PairingRequest,
    { status: "pending" },
    "vendor product submittedName offer notes matchConfidence createdAt",
    ["vendor", "product"],
  ],
  reviews: [
    Review,
    { status: "pending" },
    "product buyer title rating createdAt",
    ["product", "buyer"],
  ],
  // H5: orders queue now limited to avoid full-table scans
  orders: [Order, {}, "orderNumber buyer vendor items total status createdAt", ["buyer", "vendor"]],
};
export async function queue(req, res) {
  const entry = queues[req.params.type];
  if (!entry)
    return res.status(404).json({ success: false, message: "Queue not found" });
  const [Model, filter, fields, populate] = entry;
  let query = Model.find(filter).select(fields);
  for (const field of populate)
    query = query.populate(
      field,
      field === "product" ? "name slug" : "name email profile.company",
    );
  // H5: always limit queue results to avoid full-table scan on large datasets
  const data = await query.sort("-createdAt").limit(200);
  res.json({
    success: true,
    message: `Pending ${req.params.type} retrieved`,
    data,
  });
}
const resources = {
  users: [User, {}, "name email role status profile createdAt", []],
  vendors: [
    User,
    { role: "vendor" },
    "name email role status profile createdAt",
    [],
  ],
  products: [
    Product,
    {},
    "name slug brand model category status rating submittedBy createdAt",
    ["submittedBy"],
  ],
  offers: [
    VendorOffer,
    {},
    "product vendor price stock status createdAt",
    ["product", "vendor"],
  ],
  pairings: [
    PairingRequest,
    {},
    "vendor product submittedName offer notes reviewReason matchConfidence status createdAt",
    ["vendor", "product"],
  ],
  reviews: [
    Review,
    {},
    "product buyer title rating status createdAt",
    ["product", "buyer"],
  ],
  orders: [Order, {}, "orderNumber buyer vendor items total status createdAt", ["buyer", "vendor"]],
};

// ── H1: 'role' is intentionally NOT in editableResourceFields.users ─────────────
// Role changes must go through a dedicated, audited admin action, not the generic
// resource update endpoint, to prevent accidental privilege escalation.
const editableResourceFields = {
  users: ["name", "email", "status"],                   // 'role' excluded intentionally
  vendors: ["name", "email", "status"],                 // 'role' excluded intentionally
  products: ["name", "brand", "model", "sku", "category", "description", "price", "stock", "status"],
  offers: ["price", "discount", "stock", "status", "sku", "sellerUrl", "shippingCost", "deliveryEstimate", "warranty"],
  pairings: ["status", "notes", "reviewReason"],
  reviews: ["title", "review", "rating", "status"],
  orders: ["status", "returnStatus", "tracking"],
};
export async function resourceList(req, res) {
  const entry = resources[req.params.type];
  if (!entry)
    return res
      .status(404)
      .json({ success: false, message: "Resource not found" });
  const [Model, filter, fields, populate] = entry;
  let query = Model.find(filter).select(fields);
  for (const field of populate)
    query = query.populate(
      field,
      field === "product" ? "name slug" : "name email profile.company",
    );
  const data = await query.sort("-createdAt").limit(200);
  res.json({ success: true, message: `${req.params.type} retrieved`, data });
}

export async function updateResource(req, res) {
  const entry = resources[req.params.type];
  const allowed = editableResourceFields[req.params.type];
  if (!entry || !allowed)
    return res.status(404).json({ success: false, message: "Resource not found" });
  const [Model, filter] = entry;
  const changes = Object.fromEntries(
    allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]),
  );
  if (!Object.keys(changes).length)
    return res.status(422).json({ success: false, message: "No editable fields supplied" });
  const record = await Model.findOneAndUpdate(
    { _id: req.params.id, ...filter },
    { $set: changes },
    { new: true, runValidators: true },
  );
  if (!record)
    return res.status(404).json({ success: false, message: "Record not found" });
  await AuditLog.create({ user: req.user._id, action: `${Model.modelName}_edited`, entityId: record._id, ip: req.ip });
  res.json({ success: true, message: "Record updated", data: record });
}

export async function deleteResource(req, res) {
  const entry = resources[req.params.type];
  if (!entry) return res.status(404).json({ success: false, message: "Resource not found" });
  const [Model, filter] = entry;
  const record = await Model.findOne({ _id: req.params.id, ...filter });
  if (!record) return res.status(404).json({ success: false, message: "Record not found" });
  if (Model === User && record.role === "admin")
    return res.status(403).json({ success: false, message: "Admin accounts cannot be deleted" });
  await record.deleteOne();
  await AuditLog.create({ user: req.user._id, action: `${Model.modelName}_deleted`, entityId: record._id, ip: req.ip });
  res.json({ success: true, message: "Record deleted" });
}
