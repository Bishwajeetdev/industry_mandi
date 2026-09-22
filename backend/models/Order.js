import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [{ name: String, product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: Number, price: Number }],
    total: { type: Number, default: 0 },
    status: { type: String, enum: ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"], default: "Pending" },
    tracking: { carrier: String, number: String, url: String },
    returnStatus: { type: String, enum: ["Not requested", "Requested", "Approved", "Refunded", "Rejected"], default: "Not requested" },
    invoiceNumber: String,
    shippingAddress: { line1: String, city: String, state: String, postalCode: String, country: String },
  },
  { timestamps: true },
);

schema.index({ buyer: 1, createdAt: -1 });
schema.index({ vendor: 1, createdAt: -1 });
export default mongoose.model("Order", schema);