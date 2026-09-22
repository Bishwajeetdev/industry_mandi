import Product from "../models/Product.js";
import VendorOffer from "../models/VendorOffer.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

const orderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

// ── H2 / M14: Order price is ALWAYS sourced from the server-side DB ───────────
// The frontend sends only { product: id, quantity: n }.
// We look up the best approved offer price (or product.price as DB fallback).
// Client-supplied prices are completely ignored.
export async function create(req, res) {
  const requested = Array.isArray(req.body.items) ? req.body.items : [];
  if (!requested.length)
    return res.status(422).json({ success: false, message: "Your cart is empty" });

  // Extract only the product IDs and quantities from the client — ignore any price
  const productIds = requested
    .map((item) => item.product || item._id)
    .filter(Boolean);

  const products = await Product.find({
    _id: { $in: productIds },
    status: { $in: ["approved", "published"] },
  });
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const grouped = new Map();
  for (const item of requested) {
    const pid = String(item.product || item._id || "");
    const product = productMap.get(pid);
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