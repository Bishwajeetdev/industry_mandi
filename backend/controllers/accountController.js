import User from "../models/User.js";
import Order from "../models/Order.js";

// ── Safe fields exposed to the public ─────────────────────────────────────────
const publicProfile = (user) => ({
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.profile?.phone || "",
  company: user.profile?.company || "",
  ownerName: user.profile?.ownerName || "",
  gstNumber: user.profile?.gstNumber || "",
  businessAddress: user.profile?.businessAddress || {},
  billingAddress: user.profile?.billingAddress || {},
  shippingAddress: user.profile?.shippingAddress || {},
  // Documents returned — URLs validated on write (no write-path vuln)
  documents: user.profile?.documents || [],
  // Never expose full account number — only last 4 digits
  bankAccount:
    user.role === "vendor"
      ? {
          accountName: user.profile?.bankAccount?.accountName || "",
          bankName: user.profile?.bankAccount?.bankName || "",
          accountNumberMasked: user.profile?.bankAccount?.accountNumber
            ? `•••• ${user.profile.bankAccount.accountNumber.slice(-4)}`
            : "",
        }
      : undefined,
});

export async function get(req, res) {
  const orders =
    req.user.role === "buyer"
      ? await Order.find({ buyer: req.user._id }).populate("items.product", "name slug")
      : await Order.find({ vendor: req.user._id })
          .populate("buyer", "name email")
          .populate("items.product", "name slug");
  res.json({
    success: true,
    message: "Account retrieved",
    data: { profile: publicProfile(req.user), orders },
  });
}

// ── C4: Validate and sanitize mutable profile fields ─────────────────────────
// Protected fields (role, status, email-change, etc.) are never accepted here
const SAFE_ADDRESS_KEYS = ["label", "line1", "line2", "city", "state", "postalCode", "country"];

function sanitizeAddress(raw) {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    SAFE_ADDRESS_KEYS
      .filter((k) => raw[k] !== undefined)
      .map((k) => [k, String(raw[k]).trim().slice(0, 200)]),
  );
}

function sanitizeDocuments(raw) {
  if (!Array.isArray(raw)) return [];
  // Each document must be { name: string, url: string (https only), status: string }
  return raw
    .slice(0, 20) // hard cap on document count
    .map((doc) => {
      if (!doc || typeof doc !== "object") return null;
      const url = String(doc.url || "").trim();
      // Only allow https:// or relative /uploads/ paths — prevent SSRF / arbitrary URLs
      const urlSafe =
        url.startsWith("https://") || url.startsWith("/uploads/") ? url : "";
      if (!urlSafe) return null;
      return {
        name: String(doc.name || "Document").trim().slice(0, 200),
        url: urlSafe,
        status: ["pending", "approved", "rejected"].includes(doc.status)
          ? doc.status
          : "pending",
      };
    })
    .filter(Boolean);
}

export async function update(req, res) {
  const profile = { ...(req.user.profile?.toObject?.() || {}) };

  // Name — safe string update
  if (req.body.name !== undefined)
    req.user.name = String(req.body.name).trim().slice(0, 200);

  // String profile fields — length-capped
  for (const field of ["phone", "company", "ownerName", "gstNumber"]) {
    if (req.body[field] !== undefined)
      profile[field] = String(req.body[field]).trim().slice(0, 200);
  }

  // Nested address objects — key-whitelisted
  for (const field of ["businessAddress", "billingAddress", "shippingAddress"]) {
    if (req.body[field] !== undefined)
      profile[field] = sanitizeAddress(req.body[field]);
  }

  // C4: Documents — validate URL safety before persisting
  if (req.body.documents !== undefined)
    profile.documents = sanitizeDocuments(req.body.documents);

  // Explicitly never allow: role, status, password, bankAccount (separate endpoint)
  req.user.profile = profile;
  await req.user.save();
  res.json({
    success: true,
    message: "Account details updated",
    data: publicProfile(req.user),
  });
}

export async function updateBank(req, res) {
  if (req.user.role !== "vendor")
    return res.status(403).json({ success: false, message: "Vendor access required" });

  // Validate IFSC format (India standard: 4 alpha + 0 + 6 alphanumeric)
  const ifsc = String(req.body.ifsc || "").trim().toUpperCase();
  if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
    return res.status(422).json({ success: false, message: "Invalid IFSC code format" });

  req.user.profile = {
    ...(req.user.profile?.toObject?.() || {}),
    bankAccount: {
      accountName: String(req.body.accountName || "").trim().slice(0, 200),
      bankName: String(req.body.bankName || "").trim().slice(0, 200),
      accountNumber: String(req.body.accountNumber || "").trim().slice(0, 30),
      ifsc,
    },
  };
  await req.user.save();
  res.json({
    success: true,
    message: "Payout details updated securely",
    data: publicProfile(req.user),
  });
}

// ── M7: Password strength validation ──────────────────────────────────────────
export async function password(req, res) {
  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.matchPassword(req.body.currentPassword || "")))
    return res.status(422).json({ success: false, message: "Current password is incorrect" });

  const newPassword = req.body.newPassword || "";
  if (newPassword.length < 8)
    return res.status(422).json({ success: false, message: "New password must be at least 8 characters" });

  // M7: require at least one uppercase, one digit or special character
  if (!/[A-Z]/.test(newPassword) || !/[\d@$!%*?&_\-#^]/.test(newPassword))
    return res.status(422).json({
      success: false,
      message: "New password must contain at least one uppercase letter and one number or special character",
    });

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password changed successfully" });
}

export async function cancelOrder(req, res) {
  const filter =
    req.user.role === "buyer"
      ? { _id: req.params.id, buyer: req.user._id }
      : { _id: req.params.id, vendor: req.user._id };
  const order = await Order.findOne(filter);
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  if (["Shipped", "Out for Delivery", "Delivered", "Cancelled"].includes(order.status))
    return res.status(409).json({ success: false, message: "This order cannot be cancelled" });
  order.status = "Cancelled";
  await order.save();
  res.json({ success: true, message: "Order cancelled", data: order });
}

export async function updateOrder(req, res) {
  if (req.user.role !== "vendor")
    return res.status(403).json({ success: false, message: "Vendor access required" });
  const order = await Order.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  const allowed = ["Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (req.body.status && !allowed.includes(req.body.status))
    return res.status(422).json({ success: false, message: "Invalid order status" });
  if (req.body.status) order.status = req.body.status;
  if (req.body.tracking) order.tracking = req.body.tracking;
  if (req.body.returnStatus) order.returnStatus = req.body.returnStatus;
  await order.save();
  res.json({ success: true, message: "Order updated", data: order });
}