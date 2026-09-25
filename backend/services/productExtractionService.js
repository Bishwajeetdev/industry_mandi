const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const schema = { type: "OBJECT", properties: { name: { type: "STRING" }, brand: { type: "STRING" }, model: { type: "STRING" }, sku: { type: "STRING" }, gtin: { type: "STRING" }, category: { type: "STRING" }, variant: { type: "STRING" }, color: { type: "STRING" }, capacity: { type: "STRING" }, keywords: { type: "ARRAY", items: { type: "STRING" } }, specifications: { type: "OBJECT", additionalProperties: { type: "STRING" } }, imageUrl: { type: "STRING" } }, required: ["name", "brand", "model", "sku", "gtin", "category", "variant", "color", "capacity", "keywords", "specifications", "imageUrl"] };
const clean = (value, max = 240) => typeof value === "string" ? value.trim().slice(0, max) : "";
const identifier = (value) => clean(value, 80).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
const words = (value = "") => String(value).toLowerCase().match(/[a-z0-9]+(?:[.-][a-z0-9]+)*/g) || [];
const inferCategory = (value) => {
  const text = String(value || "").toLowerCase();
  const categories = [
    ["Motors", ["motor", "motors", "vfd", "drive", "starter", "pump"]],
    ["Switchgear", ["switchgear", "switch", "breaker", "panel", "mcc"]],
    ["Industrial Sensors", ["sensor", "proximity", "photoelectric", "transmitter"]],
    ["Testing Instruments", ["tester", "testing", "meter", "multimeter", "oscilloscope", "instrument"]],
    ["Power & Automation", ["automation", "plc", "power supply", "contactor", "relay"]],
  ];
  return categories.find(([, terms]) => terms.some((term) => text.includes(term)))?.[0] || "";
};

export class ProductExtractionError extends Error {
  constructor(message, { code = "extraction_failed", stage = "extract", status, cause } = {}) {
    super(message);
    this.name = "ProductExtractionError";
    this.code = code;
    this.stage = stage;
    this.status = status;
    this.cause = cause;
  }
}

export function parseProductUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw new ProductExtractionError("A product URL is required.", { code: "invalid_url", stage: "validate" });
  }

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch (cause) {
    throw new ProductExtractionError("Please provide a valid product URL.", { code: "invalid_url", stage: "validate", cause });
  }

  if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
    throw new ProductExtractionError("Please provide a valid http/https product URL.", { code: "invalid_url", stage: "validate" });
  }

  return {
    url,
    domain: url.hostname.replace(/^www\./i, "").toLowerCase(),
  };
}

function fallback(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return { name: "", sku: "" };

  try {
    const url = new URL(rawUrl);
    const pathname = decodeURIComponent(url.pathname || "");
    const normalizedPath = pathname
      .replace(/\/+|[-_]+/g, " ")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\b(?:product|products|item|items|shop|search|category|categories|collection|collections|page|cart|p|pid|dp|gp)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const sku = pathname.match(/\/(?:dp|gp\/product|p)\/([a-z0-9]{8,20})/i)?.[1] || url.searchParams.get("sku") || "";
    return { name: normalizedPath, sku: clean(sku, 40) };
  } catch {
    const normalized = decodeURIComponent(String(rawUrl))
      .replace(/^https?:\/\//i, " ")
      .replace(/\/+|[-_]+/g, " ")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\b(?:product|products|item|items|shop|search|category|categories|collection|collections|page|cart|p|pid|dp|gp)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { name: normalized, sku: "" };
  }
}
export function normalizeExtractedProduct(raw, rawUrl) {
  const urlFallback = fallback(rawUrl);
  const specifications = Object.fromEntries(Object.entries(raw?.specifications || {}).slice(0, 30).map(([key, value]) => [clean(key, 80), clean(value, 240)]).filter(([key, value]) => key && value));
  const name = clean(raw?.name) || urlFallback.name;
  const product = { name, brand: clean(raw?.brand, 100), model: clean(raw?.model, 100), sku: identifier(raw?.sku || urlFallback.sku), gtin: identifier(raw?.gtin), category: clean(raw?.category, 120) || inferCategory([name, raw?.keywords, raw?.model].join(" ")), variant: clean(raw?.variant, 120), color: clean(raw?.color, 80), capacity: clean(raw?.capacity, 80), specifications, imageUrl: /^https:\/\//i.test(clean(raw?.imageUrl, 2048)) ? clean(raw.imageUrl, 2048) : "" };
  product.keywords = [...new Set([...(Array.isArray(raw?.keywords) ? raw.keywords : []), ...words([product.name, product.brand, product.model, product.variant, product.category, product.capacity, ...Object.values(specifications)].join(" "))].map((x) => clean(x, 60).toLowerCase()).filter((x) => x.length > 1))].slice(0, 30);
  return product;
}

// Gemini URL Context is the approved source; this service deliberately does not scrape URLs server-side.
function readJson(text) {
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("Product source did not return JSON");
  return JSON.parse(json);
}
async function callGemini({ apiKey, model, prompt, tools, structured = true }) {
  const generationConfig = structured
    ? { responseMimeType: "application/json", responseSchema: schema, temperature: 0 }
    : { responseMimeType: "application/json", temperature: 0 };
  const response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, signal: AbortSignal.timeout(20000),
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools, generationConfig }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ProductExtractionError(`Product source returned HTTP ${response.status}.`, {
      code: "upstream_http_error",
      stage: "provider",
      status: response.status,
      cause: body.slice(0, 500),
    });
  }
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  if (!text) throw new ProductExtractionError("Product source returned no product details.", { code: "missing_product_data", stage: "parse" });
  try {
    return readJson(text);
  } catch (cause) {
    throw new ProductExtractionError("Product source returned unreadable product data.", { code: "parser_failure", stage: "parse", cause });
  }
}

export async function extractProductFromUrl(rawUrl) {
  const { url, domain } = parseProductUrl(rawUrl);
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new ProductExtractionError("Product extraction is not configured on the server.", {
      code: "provider_not_configured",
      stage: "configuration",
    });
  }
  const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash";
  const instruction = "Extract only details explicitly found. Return one JSON object with name, brand, model, sku, gtin, category, variant, color, capacity, keywords, specifications, and imageUrl. Use blank strings or empty collections when unavailable; never invent a value.";
  // Keep provider selection behind this handler list so domain-specific extractors
  // can be added without changing the controller or matching pipeline.
  const attempts = [
    { source: `gemini_url_context:${domain}`, tools: [{ urlContext: {} }], prompt: `Use URL Context to read this product page: ${url.toString()}\n${instruction}`, structured: true },
    // Some Gemini model versions cannot combine URL Context and a response schema.
    { source: `gemini_url_context:${domain}`, tools: [{ urlContext: {} }], prompt: `Use URL Context to read this product page: ${url.toString()}\n${instruction}`, structured: false },
    // Retailers sometimes deny URL Context. Search is still an approved Google source
    // and can retrieve the indexed title/specification snippets for the exact URL.
    { source: `gemini_google_search:${domain}`, tools: [{ googleSearch: {} }], prompt: `Find the product represented by this exact URL: ${url.toString()}\n${instruction}`, structured: false },
  ];
  let lastError;
  for (const attempt of attempts) {
    try {
      const product = normalizeExtractedProduct(await callGemini({ apiKey, model, ...attempt }), rawUrl);
      if (!product.name && !product.brand && !product.model && !product.sku && !product.gtin && !product.keywords.length) {
        throw new ProductExtractionError("Product source returned no usable product information.", { code: "missing_product_data", stage: "normalize" });
      }
      return { product, source: attempt.source, domain };
    } catch (error) {
      lastError = error instanceof ProductExtractionError
        ? error
        : new ProductExtractionError(error.message || "Product extraction failed.", { code: "provider_failed", stage: "provider", cause: error });
      console.error("[price-finder] extraction attempt failed", JSON.stringify({
        domain,
        source: attempt.source,
        code: lastError.code,
        stage: lastError.stage,
        status: lastError.status,
        message: lastError.message,
        providerDetail: typeof lastError.cause === "string" ? lastError.cause : lastError.cause?.message,
      }));
    }
  }
  throw lastError || new ProductExtractionError("Unable to retrieve product information from this URL.");
}
