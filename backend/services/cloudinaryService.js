import "../config/env.js";
import { v2 as cloudinary } from "cloudinary";

// Render values are sometimes pasted as `CLOUDINARY_URL=...` or with quotes.
// Normalize those harmless wrappers, but never start with an invalid URL.
const cloudinaryUrl = String(process.env.CLOUDINARY_URL || "")
  .trim()
  .replace(/^CLOUDINARY_URL\s*=\s*/i, "")
  .replace(/^['"]|['"]$/g, "");

const hasDiscreteConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryUrl.startsWith("cloudinary://")) {
  try {
    cloudinary.config({ cloudinary_url: cloudinaryUrl, secure: true });
  } catch (err) {
    console.error("Failed to configure Cloudinary with URL:", err.message);
  }
} else if (hasDiscreteConfig) {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  } catch (err) {
    console.error("Failed to configure Cloudinary with discrete credentials:", err.message);
  }
} else if (cloudinaryUrl) {
  console.error("CLOUDINARY_URL is invalid. Product image uploads are disabled until it starts with cloudinary://");
}

export const isCloudinaryConfigured = () => {
  return (
    String(process.env.CLOUDINARY_URL || "").trim().startsWith("cloudinary://") ||
    Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
  );
};

const safeFolderPart = (value, fallback) =>
  String(value || fallback).replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 80);

export const productImageFolder = ({ productId, vendorId, role }) =>
  role === "vendor"
    ? `techlens/vendors/${safeFolderPart(vendorId, "unknown")}/products/${safeFolderPart(productId, "new")}`
    : `techlens/products/${safeFolderPart(productId, "new")}`;

export const uploadProductImage = (file, context) => {
  if (!isCloudinaryConfigured()) throw new Error("Image hosting is not configured. Please contact an administrator.");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: productImageFolder(context),
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        // Store a bounded, automatically compressed delivery variant; the
        // original remains managed by the same public id for deletion.
        eager: [{ width: 1600, height: 1600, crop: "limit", fetch_format: "auto", quality: "auto" }],
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(file.buffer);
  });
};

export const destroyProductImage = async (publicId) => {
  if (!publicId || !cloudinaryUrl) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
};

export const destroyProductImages = async (images = []) => {
  const results = await Promise.allSettled(images.map((image) => destroyProductImage(image?.publicId)));
  const failed = results.find((result) => result.status === "rejected");
  if (failed) throw failed.reason;
};
