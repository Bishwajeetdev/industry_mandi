import mongoose from "mongoose";

const extractedProductSchema = new mongoose.Schema({
  name: String,
  brand: String,
  model: String,
  sku: String,
  gtin: String,
  category: String,
  variant: String,
  color: String,
  capacity: String,
  keywords: { type: [String], default: [] },
  specifications: { type: Map, of: String, default: {} },
  imageUrl: String,
}, { _id: false });

const productRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  productUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  productName: { type: String, trim: true },
  extractedKeywords: { type: [String], default: [] },
  brand: String,
  category: String,
  productDetails: { type: extractedProductSchema, required: true },
  imageUrl: String,
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "approved", "added", "cancelled"], default: "pending", index: true },
  cancelledAt: Date,
}, { timestamps: true });

productRequestSchema.index({ productUrl: 1, user: 1, status: 1 });
export default mongoose.model("ProductRequest", productRequestSchema);
