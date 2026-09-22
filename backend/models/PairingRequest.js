import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    // M11: vendor and product are required — a pairing without both is invalid
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    submittedName: { type: String, trim: true, maxlength: 500 },
    matchConfidence: { type: Number, min: 0, max: 100 },
    offer: {
      price: { type: Number, required: true, min: 0 },
      stock: { type: String, enum: ["available", "out_of_stock", "limited"], default: "available" },
      sku: { type: String, trim: true, maxlength: 100 },
      warranty: { type: String, trim: true, maxlength: 500 },
      shippingDetails: { type: String, trim: true, maxlength: 1000 },
      shippingCost: { type: Number, default: 0, min: 0 },
      deliveryEstimate: { type: String, trim: true, maxlength: 200 },
      sellerUrl: { type: String, trim: true, maxlength: 1000 },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "changes_requested"],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 2000 },
    reviewReason: { type: String, trim: true, maxlength: 2000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("PairingRequest", schema);
