import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExtractedProduct } from "../services/productExtractionService.js";

test("product URL fallback preserves readable product words for matching", () => {
  const product = normalizeExtractedProduct({}, "https://shop.example.com/products/siemens-three-phase-motor-7-5kw");
  assert.match(product.name, /siemens three phase motor 7 5kw/i);
  assert.ok(product.keywords.includes("siemens"));
  assert.ok(product.keywords.includes("motor"));
});

test("normalized extraction keeps valid product attributes and discards unsafe image URLs", () => {
  const product = normalizeExtractedProduct({ name: "  ABB Motor  ", brand: "ABB", specifications: { Voltage: "415V" }, imageUrl: "javascript:alert(1)" }, "https://shop.example.com/p/abb-motor");
  assert.equal(product.name, "ABB Motor");
  assert.equal(product.specifications.Voltage, "415V");
  assert.equal(product.imageUrl, "");
});
