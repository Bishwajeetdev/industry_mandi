import "../config/env.js";
import { v2 as cloudinary } from "cloudinary";

export const getCleanCloudinaryUrl = () => {
  let val = String(process.env.CLOUDINARY_URL || "").trim();
  if (!val) return "";
  val = val.replace(/^CLOUDINARY_URL\s*=\s*/i, "").trim();
  val = val.replace(/^['"]|['"]$/g, "").trim();
  if (val.startsWith("cloudinary:/") && !val.startsWith("cloudinary://")) {
    val = val.replace(/^cloudinary:\/+/i, "cloudinary://");
  } else if (!val.startsWith("cloudinary://") && val.includes("@") && val.includes(":")) {
    val = `cloudinary://${val}`;
  }
  return val;
};

const hasDiscreteConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

export const configureCloudinary = () => {
  const url = getCleanCloudinaryUrl();
  if (url.startsWith("cloudinary://")) {
    try {
      cloudinary.config({ cloudinary_url: url, secure: true });
      return true;
    } catch (err) {
      console.error("Failed to configure Cloudinary with URL:", err.message);
      return false;
    }
  } else if (hasDiscreteConfig()) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
        api_key: process.env.CLOUDINARY_API_KEY.trim(),
        api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
        secure: true,
      });
      return true;
    } catch (err) {
      console.error("Failed to configure Cloudinary with discrete credentials:", err.message);
      return false;
    }
  }
  return false;
};

// Initial configuration attempt on module load
configureCloudinary();

export const isCloudinaryConfigured = () => {
  const url = getCleanCloudinaryUrl();
  return url.startsWith("cloudinary://") || hasDiscreteConfig();
};

const safeFolderPart = (value, fallback) =>
  String(value || fallback).replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 80);

export const productImageFolder = ({ productId, vendorId, role }) =>
  role === "vendor"
    ? `techlens/vendors/${safeFolderPart(vendorId, "unknown")}/products/${safeFolderPart(productId, "new")}`
    : `techlens/products/${safeFolderPart(productId, "new")}`;

export const uploadProductImage = (file, context) => {
  if (!isCloudinaryConfigured() || !configureCloudinary()) {
    throw new Error(
      "Image hosting is not configured. Please add CLOUDINARY_URL to your environment variables (e.g. in your Render dashboard under techlens-api -> Environment)."
    );
  }
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

export const uploadVendorAsset = (file, { vendorId, assetType }) => {
  if (!isCloudinaryConfigured() || !configureCloudinary()) {
    throw new Error("Image hosting is not configured. Please add CLOUDINARY_URL to your environment variables.");
  }
  const safeType = ["logo", "banner", "document"].includes(assetType) ? assetType : "document";
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: `techlens/vendors/${safeFolderPart(vendorId, "unknown")}/${safeType}`,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
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
