import test from "node:test";
import assert from "node:assert/strict";
import { extractProductFromHtml, normalizeExtractedProduct } from "../services/productExtractionService.js";

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

test("public product metadata extracts price and specifications without an AI key", () => {
  const html = `
    <script type="application/ld+json">{
      "@context":"https://schema.org", "@type":"Product", "name":"ABB M2BAX Motor",
      "brand":{"@type":"Brand","name":"ABB"}, "sku":"M2BAX-90L",
      "offers":{"@type":"Offer","price":"12450"},
      "additionalProperty":[{"name":"Voltage","value":"415 V"}]
    }</script>
    <table><tr><th>Power</th><td>2.2 kW</td></tr></table>`;
  const product = extractProductFromHtml(html, "https://example.com/products/abb-motor");
  assert.equal(product.name, "ABB M2BAX Motor");
  assert.equal(product.price, 12450);
  assert.equal(product.specifications.Voltage, "415 V");
  assert.equal(product.specifications.Power, "2.2 kW");
});

test("extractCatalogIdentifier extracts slug or ObjectId from internal product URLs", async () => {
  const { extractCatalogIdentifier, parseProductUrl } = await import("../services/productExtractionService.js");
  assert.equal(extractCatalogIdentifier("http://localhost:5173/product/siemens-ie2-motor-1"), "siemens-ie2-motor-1");
  assert.equal(extractCatalogIdentifier("http://localhost:5173/product/6ab0c571a2165be0e587295c"), "6ab0c571a2165be0e587295c");
  assert.equal(extractCatalogIdentifier("https://industry-mandi01.onrender.com/products/abb-light-3"), "abb-light-3");
  assert.equal(extractCatalogIdentifier("https://industrymandi.com/product?id=6ab0c571a2165be0e587295c"), "6ab0c571a2165be0e587295c");

  const parsed = parseProductUrl("http://localhost:5173/product/siemens-ie2-motor-1");
  assert.equal(parsed.isLocal, true);
  assert.equal(parsed.domain, "localhost");
});
