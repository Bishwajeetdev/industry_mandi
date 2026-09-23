import { Router } from "express";
import { body, param, query } from "express-validator";
import rateLimit from "express-rate-limit";
import * as auth from "../controllers/authController.js";
import * as products from "../controllers/productController.js";
import * as vendor from "../controllers/vendorController.js";
import * as admin from "../controllers/adminController.js";
import * as buyer from "../controllers/buyerController.js";
import * as account from "../controllers/accountController.js";
import * as order from "../controllers/orderController.js";
import { protect, allow } from "../middleware/auth.js";
import { asyncHandler as ah } from "../middleware/asyncHandler.js";
import { productImages } from "../middleware/upload.js";
import * as priceFinder from "../controllers/priceFinderController.js";

// ─── Per-route rate limiters ──────────────────────────────────────────────────

/** Strict: login / register / password-reset — 10 attempts per 15 min per IP */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // don't count successful logins against limit
});

/** Moderate: review submission — 20 per hour per IP */
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many review submissions. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Moderate: order creation — 30 per hour per IP */
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many order requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Moderate: product compare — 60 per 15 min per IP */
const compareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: "Too many comparison requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Moderate: file uploads — 20 per hour per IP */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many upload requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Router ───────────────────────────────────────────────────────────────────

const r = Router();

// Auth
r.post(
  "/auth/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("role").optional().isIn(["buyer", "vendor"]).withMessage("Role must be buyer or vendor"),
  ],
  ah(auth.register),
);
r.post(
  "/auth/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  ah(auth.login),
);
r.post("/auth/logout", (req, res) =>
  res.json({ success: true, message: "Logout successful" }),
);
r.get("/auth/me", protect, ah(auth.me));

// Account
r.get("/account", protect, allow("buyer", "vendor"), ah(account.get));
r.patch("/account", protect, allow("buyer", "vendor"), ah(account.update));
r.patch("/account/password", protect, allow("buyer", "vendor"), ah(account.password));
r.patch("/account/bank", protect, allow("vendor"), ah(account.updateBank));
r.patch("/account/orders/:id/cancel", protect, allow("buyer", "vendor"), ah(account.cancelOrder));
r.patch("/account/orders/:id", protect, allow("vendor"), ah(account.updateOrder));

// Products (public)
r.get("/products", ah(products.list));
r.get("/products/search", ah(products.search));
r.get("/products/compare", compareLimiter, ah(products.compare));
r.get("/recommendations", ah(products.recommendations));
r.get("/products/:slug/recommendations", ah(products.productRecommendations));
r.get("/products/:slug", ah(products.detail));

// Price Finder (public — no auth required)
r.post("/price-finder", ah(priceFinder.findByUrl));

// Product creation (admin or vendor — upload rate-limited)
r.post(
  "/products",
  protect,
  allow("admin", "vendor"),
  uploadLimiter,
  productImages,
  ah(products.create),
);

// Vendor routes
r.use("/vendor", protect, allow("vendor"));
r.get("/vendor/dashboard", ah(vendor.dashboard));
r.get("/vendor/products", ah(vendor.products));
r.patch("/vendor/products/:id", uploadLimiter, productImages, ah(products.vendorUpdate));
r.delete("/vendor/products/:id", ah(products.vendorDelete));
r.post("/vendor/products/:id/submit", ah(products.submit));
r.get("/vendor/offers", ah(vendor.offers));
r.post("/vendor/offers", ah(vendor.offer));
r.get("/vendor/pairings", ah(vendor.pairings));
r.get("/vendor/pairing/search", ah(vendor.pairingSearch));
r.post("/vendor/pairing", ah(vendor.pairing));

// Buyer routes
r.post("/buyer/wishlist/:productId", protect, allow("buyer"), ah(buyer.wishlist));
r.get("/buyer/wishlist", protect, allow("buyer"), ah(buyer.myWishlist));
r.get("/buyer/dashboard", protect, allow("buyer"), ah(buyer.dashboard));
r.get("/buyer/notifications", protect, allow("buyer"), ah(buyer.notifications));

// Reviews
r.get("/reviews", ah(buyer.reviews));
r.post("/reviews", protect, allow("buyer"), reviewLimiter, ah(buyer.review));

// Orders
r.post("/orders", protect, allow("buyer"), orderLimiter, ah(order.create));

// Admin routes
r.use("/admin", protect, allow("admin"));
r.get("/admin/dashboard", ah(admin.dashboard));
r.get("/admin/queue/:type", ah(admin.queue));
r.get("/admin/resources/:type", ah(admin.resourceList));
r.patch("/admin/resources/:type/:id", ah(admin.updateResource));
r.delete("/admin/resources/:type/:id", ah(admin.deleteResource));
r.patch("/admin/vendors/:id", ah(admin.updateVendor));
r.delete("/admin/vendors/:id", ah(admin.deleteUser));
r.patch("/admin/products/:id", ah(admin.editProduct));
r.delete("/admin/products/:id", ah(admin.deleteProduct));
r.post("/admin/products/:id/review", ah(admin.reviewProduct));
r.post(
  "/admin/products/:id/approve",
  (q, s, n) => { q.body.status = "approved"; n(); },
  ah(admin.reviewProduct),
);
r.post(
  "/admin/products/:id/reject",
  (q, s, n) => { q.body.status = "rejected"; n(); },
  ah(admin.reviewProduct),
);
r.post(
  "/admin/products/:id/publish",
  (q, s, n) => { q.body.status = "published"; n(); },
  ah(admin.reviewProduct),
);
r.post(
  "/admin/products/:id/archive",
  (q, s, n) => { q.body.status = "archived"; n(); },
  ah(admin.reviewProduct),
);
r.patch("/admin/offers/:id", ah(admin.updateOffer));
r.patch("/admin/pairing/:id", ah(admin.reviewPairing));
r.patch("/admin/reviews/:id", ah(admin.updateReview));
r.post(
  "/admin/vendors/:id/approve",
  (q, s, n) => { q.body.status = "approved"; n(); },
  ah(admin.updateVendor),
);
r.post(
  "/admin/pairing/:id/approve",
  (q, s, n) => { q.body.status = "approved"; n(); },
  ah(admin.updatePairing),
);
r.put("/admin/ranking", ah(admin.ranking));

export default r;
