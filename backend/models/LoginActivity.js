import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true },
    ip: String,
    userAgent: String,
    loggedInAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

schema.index({ user: 1, loggedInAt: -1 });
export default mongoose.model("LoginActivity", schema);
