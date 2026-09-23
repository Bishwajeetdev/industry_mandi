import mongoose from "mongoose";
import Product from "../models/Product.js";
import VendorOffer from "../models/VendorOffer.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

const orderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

const CATALOG_PRODUCTS = [
  {
    slug: "siemens-motor",
    name: "Siemens IE3 Severe Duty Three Phase Motor",
    brand: "Siemens",
    category: "Motors",
    price: 74999,
    sku: "SIE-IE3-15KW",
    description: "Industrial three phase motor for severe duty applications.",
    status: "approved",
  },
  {
    slug: "crompton-motor",
    name: "Crompton IE3 Premium Efficiency Induction Motor",
    brand: "Crompton",
    category: "Motors",
    price: 38500,
    sku: "CRO-IE3-11KW",
    description: "Premium efficiency induction motor.",
    status: "approved",
  },
  {
    slug: "danfoss-vlt",
    name: "Danfoss VLT HVAC Drive FC102 Fan & Pump Drive",
    brand: "Danfoss",
    category: "Motors",
    price: 62000,
    sku: "DAN-FC102-45KW",
    description: "Variable frequency drive for fans and pumps.",
    status: "approved",
  },
  {
    slug: "haas-cnc",
    name: "Haas VF-2 Vertical CNC Machining Center",
    brand: "Haas",
    category: "Testing Instruments",
    price: 2450000,
    sku: "HAAS-VF2-2026",
    description: "Vertical CNC machining center.",
    status: "approved",
  },
  {
    slug: "kirloskar-pump",
    name: "Kirloskar End-Suction Industrial Centrifugal Pump",
    brand: "Kirloskar",
    category: "Industrial Sensors",
    price: 42500,
    sku: "KIR-ES-100X80",
    description: "End-suction industrial centrifugal pump.",
    status: "approved",
  },
  {
    slug: "schneider-vfd",
    name: "Schneider Altivar Process 630 Variable Frequency Drive",
    brand: "Schneider",
    category: "Motors",
    price: 88900,
    sku: "SE-ATV630-75KW",
    description: "Variable frequency drive for process automation.",
    status: "approved",
  },
  {
    slug: "abb-switchgear",
    name: "ABB SafeRing 12kV Medium Voltage Gas Insulated Switchgear",
    brand: "ABB",
    category: "Switchgear",
    price: 185000,
    sku: "ABB-SR12-GIS",
    description: "Medium voltage gas insulated switchgear.",
    status: "approved",
  },
  {
    slug: "lt-starter",
    name: "L&T Fully Compartmentalized Motor Control Center MCC",
    brand: "L&T",
    category: "Motor Starters",
    price: 135000,
    sku: "LT-MCC-FC-400A",
    description: "Compartmentalized motor control center.",
    status: "approved",
  },
];

// ── H2 / M14: Order price is ALWAYS sourced from the server-side DB ───────────
// The frontend sends only { product: id, quantity: n }.
// We look up the best approved offer price (or product.price as DB fallback).
// Client-supplied prices are completely ignored.
export async function create(req, res) {
  const requested = Array.isArray(req.body.items) ? req.body.items : [];
  if (!requested.length)
    return res.status(422).json({ success: false, message: "Your cart is empty" });

  // Separate valid ObjectIds from string identifiers (slugs, SKUs, or custom IDs like "danfoss-vlt")
  const validObjectIds = [];
  const stringIdentifiers = [];

  for (const item of requested) {
    const rawId = String(item.product || item._id || "").trim();
    if (!rawId) continue;
    if (mongoose.Types.ObjectId.isValid(rawId) && String(new mongoose.Types.ObjectId(rawId)) === rawId) {
      validObjectIds.push(rawId);
    } else {
      stringIdentifiers.push(rawId);
    }
    if (item.slug && !stringIdentifiers.includes(item.slug)) stringIdentifiers.push(item.slug);
    if (item.sku && !stringIdentifiers.includes(item.sku)) stringIdentifiers.push(item.sku);
  }

  const queryConditions = [];
  if (validObjectIds.length > 0) {
    queryConditions.push({ _id: { $in: validObjectIds } });
  }
  if (stringIdentifiers.length > 0) {
    queryConditions.push({ slug: { $in: stringIdentifiers } });
    queryConditions.push({ sku: { $in: stringIdentifiers } });
  }

  const products = queryConditions.length > 0
    ? await Product.find({
        $or: queryConditions,
        status: { $in: ["approved", "published"] },
      })
    : [];

  const productMap = new Map();
  for (const p of products) {
    productMap.set(String(p._id), p);
    if (p.slug) productMap.set(p.slug, p);
    if (p.sku) productMap.set(p.sku, p);
  }

  // Auto-resolve any known catalog products not yet in the DB
  for (const strId of stringIdentifiers) {
    if (!productMap.has(strId)) {
      const match = CATALOG_PRODUCTS.find(
        (c) => c.slug === strId || c.sku === strId || strId.includes(c.slug)
      );
      if (match) {
        let p = await Product.findOne({
          $or: [{ slug: match.slug }, { sku: match.sku }, { name: match.name }],
        });
        if (!p) {
          const adminUser = await User.findOne({ role: "admin" });
          p = await Product.create({
            ...match,
            submittedBy: adminUser?._id || req.user._id,
            status: "approved",
          });
        }
        productMap.set(strId, p);
        productMap.set(String(p._id), p);
        if (p.slug) productMap.set(p.slug, p);
        if (p.sku) productMap.set(p.sku, p);
      }
    }
  }

  const grouped = new Map();
  for (const item of requested) {
    const pid = String(item.product || item._id || "").trim();
    let product = productMap.get(pid);
    if (!product && item.slug) product = productMap.get(item.slug);
    if (!product && item.sku) product = productMap.get(item.sku);
    if (!product) continue;

    const quantity = Math.max(1, Number(item.quantity) || 1);

    // Always fetch the price from the DB — never from the client
    const offer = await VendorOffer.findOne({
      product: product._id,
      status: "approved",
      stock: { $ne: "out_of_stock" },
    }).sort("price");

    // Determine trusted server-side price
    const trustedPrice = offer?.price ?? product.price;

    // Skip items with no valid server-side price
    if (!trustedPrice || trustedPrice <= 0) continue;

    const vendorKey = offer?.vendor ? String(offer.vendor) : "platform";
    if (!grouped.has(vendorKey)) grouped.set(vendorKey, []);
    grouped.get(vendorKey).push({
      name: product.name,
      product: product._id,
      quantity,
      price: trustedPrice,   // ← always DB-sourced
    });
  }

  if (!grouped.size)
    return res.status(422).json({ success: false, message: "No purchasable products found" });

  const admins = await User.find({ role: "admin", status: "approved" }).select("_id");
  const orders = [];
  for (const [vendorKey, items] of grouped) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({
      orderNumber: orderNumber(),
      buyer: req.user._id,
      vendor: vendorKey === "platform" ? undefined : vendorKey,
      items,
      total,  // ← computed from DB prices, not client
      invoiceNumber: `INV-${Date.now()}`,
    });
    orders.push(order);
    await Promise.all([
      ...admins.map((admin) =>
        Notification.create({
          user: admin._id,
          type: "Order_created",
          message: `New order ${order.orderNumber} requires processing.`,
          entityId: order._id,
        }),
      ),
      vendorKey === "platform"
        ? Promise.resolve()
        : Notification.create({
            user: vendorKey,
            type: "Order_created",
            message: `New order ${order.orderNumber} is ready for processing.`,
            entityId: order._id,
          }),
    ]);
  }
  res.status(201).json({ success: true, message: "Order placed successfully", data: { orders } });
}