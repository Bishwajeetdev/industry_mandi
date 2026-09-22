import "../config/env.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import VendorOffer from "../models/VendorOffer.js";
import Review from "../models/Review.js";
import PriceHistory from "../models/PriceHistory.js";
import RankingConfiguration from "../models/RankingConfiguration.js";
import slugify from "slugify";
const categories = [
  "Motors",
  "Space Heaters",
  "LED Lighting",
  "Testing Instruments",
  "MCBs",
  "Motor Starters",
  "Contactors",
  "Switchgear",
  "Industrial Sensors",
  "Cables",
];
const brands = [
  "Siemens",
  "Schneider",
  "ABB",
  "L&T",
  "Havells",
  "Polycab",
  "Crompton",
  "Bajaj",
  "Fluke",
  "Yokogawa",
  "Phoenix",
  "Wipro",
  "Finolex",
  "Legrand",
  "Orient",
  "Meco",
  "Hager",
  "HPL",
  "BCH",
  "IndoAsian",
];
const productNames = [
  "IE2 Three Phase Motor",
  "Industrial PTC Space Heater",
  "High Bay LED Light",
  "Digital Clamp Meter",
  "Single Pole MCB",
  "DOL Motor Starter",
  "AC Power Contactor",
  "Automatic Transfer Switch",
  "Temperature Proximity Sensor",
  "Heavy Duty Copper Cable",
];
await connectDB();
await Promise.all([
  User.deleteMany({}),
  Product.deleteMany({}),
  VendorOffer.deleteMany({}),
  Review.deleteMany({}),
  PriceHistory.deleteMany({}),
  RankingConfiguration.deleteMany({}),
]);
const admin = await User.create({
  name: "Platform Admin",
  email: "admin@example.com",
  password: "Admin@123456",
  role: "admin",
  status: "approved",
});
const vendors = await Promise.all(
  Array.from({ length: 10 }, (_, i) =>
    User.create({
      name: `Vendor ${i + 1}`,
      email: `vendor${i + 1}@example.com`,
      password: "Vendor@123456",
      role: "vendor",
      status: "approved",
      profile: { company: `${brands[i]} Electricals` },
    }),
  ),
);
const buyers = await Promise.all(
  Array.from({ length: 10 }, (_, i) =>
    User.create({
      name: `Buyer ${i + 1}`,
      email: `buyer${i + 1}@example.com`,
      password: "Buyer@123456",
      role: "buyer",
    }),
  ),
);
const products = [];
for (let i = 0; i < 30; i++) {
  const category = categories[i % categories.length],
    brand = brands[i % brands.length],
    name = `${brand} ${productNames[i % productNames.length]} ${i + 1}`;
  products.push(
    await Product.create({
      name,
      slug: slugify(name, { lower: true, strict: true }),
      brand,
      model: `${brand.toUpperCase()}-${2025 + i}`,
      sku: `${brand.slice(0, 4).toUpperCase()}-${category.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
      category,
      description: `A verified ${category.toLowerCase()} built for reliable electrical and industrial applications, maintenance, and plant operations.`,
      specifications: {
        Voltage: category === "Cables" ? "1100V" : "415V",
        Power: category === "Motors" ? "7.5 kW" : "Industrial grade",
        Protection: category === "MCBs" ? "C curve IP20" : "IP54",
        Warranty: "2 years",
      },
      metrics: {
        performance: 70 + (i % 30),
        display: 65 + (i % 30),
        battery: 60 + (i % 35),
        build: 70 + (i % 25),
        features: 65 + (i % 30),
        camera: 60 + (i % 35),
      },
      rating: Math.round((3.8 + (i % 12) / 10) * 10) / 10,
      reviewCount: 12 + i * 7,
      status: "approved",
      submittedBy: admin._id,
      pros: ["Reliable industrial performance", "Verified electrical specifications"],
      cons: ["Availability varies by region"],
    }),
  );
}
for (let i = 0; i < 20; i++) {
  const p = products[i % products.length],
    offer = await VendorOffer.create({
      product: p._id,
      vendor: vendors[i % 10]._id,
      price: 49999 + i * 1850,
      stock: "available",
      sellerUrl: "https://example.com",
      shippingCost: 0,
      deliveryEstimate: "2–4 business days",
      warranty: "1 year",
      status: "approved",
    });
  await PriceHistory.create({
    product: p._id,
    offer: offer._id,
    price: offer.price + 2500,
  });
  await PriceHistory.create({
    product: p._id,
    offer: offer._id,
    price: offer.price,
  });
}
for (let i = 0; i < 10; i++)
  await Review.create({
    product: products[i]._id,
    buyer: buyers[i]._id,
    rating: 4 + (i % 2),
    title: "Verified buyer feedback",
    review: "Excellent performance and a thoughtful feature set for the price.",
    pros: ["Performance"],
    cons: ["Could be lighter"],
    status: "approved",
  });
await RankingConfiguration.create({
  category: "Motors",
  weights: {
    performance: 30,
    price: 25,
    display: 15,
    battery: 15,
    build: 10,
    features: 5,
  },
});
console.log(
  "Seed complete. Development admin: admin@example.com / Admin@123456",
);
await mongoose.disconnect();
