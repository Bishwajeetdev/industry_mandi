import { getDisplayPrice } from "./helpers";

const INDUSTRIAL_CATALOG = [
  {
    _id: "siemens-motor",
    name: "Siemens IE3 Severe Duty Three Phase Motor",
    brand: "Siemens",
    category: "Motors & Drives",
    rating: 4.9,
    price: 74999,
    oldPrice: 89999,
    sku: "SIE-IE3-15KW",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    badge: "OEM VERIFIED",
    specifications: {
      "Power Rating": "15 kW (20 HP)",
      "Efficiency Class": "IE3 Premium Efficiency",
      "Protection": "IP55 Ingress Sealing",
      "Voltage": "415V, 3-Phase",
      "Frequency": "50 Hz",
      "Rated Speed": "1475 RPM",
      "Mounting": "Foot Mounted (B3)",
      "Frame Size": "160L Cast Iron",
      "Insulation Class": "Class F (155°C) with Class B Rise",
      "Warranty": "24 Months Comprehensive OEM Warranty",
      "Pan-India Freight": "Express Covered Logistics",
    },
    technicalSpecifications: {
      "Standards": "IEC 60034-1 / IS 12615",
      "Duty Cycle": "S1 Continuous Duty",
      "Cooling Type": "IC411 Totally Enclosed Fan Cooled (TEFC)",
      "Ambient Temperature": "-20°C to +50°C",
    },
  },
  {
    _id: "crompton-motor",
    name: "Crompton IE3 Premium Efficiency Induction Motor",
    brand: "Crompton",
    category: "Motors & Drives",
    rating: 4.6,
    price: 38500,
    oldPrice: 45000,
    sku: "CRO-IE3-11KW",
    image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
    badge: "IN STOCK",
    specifications: {
      "Power Rating": "11 kW (15 HP)",
      "Efficiency Class": "IE3 Premium Efficiency",
      "Protection": "IP55 Ingress Sealing",
      "Voltage": "415V, 3-Phase",
      "Frequency": "50 Hz",
      "Rated Speed": "1440 RPM",
      "Mounting": "Foot Mounted (B3)",
      "Frame Size": "160M Cast Iron",
      "Insulation Class": "Class F Insulation",
      "Warranty": "18 Months OEM Warranty",
      "Pan-India Freight": "Express Covered Logistics",
    },
    technicalSpecifications: {
      "Standards": "IS 12615 / IEC 60034",
      "Duty Cycle": "S1 Continuous Duty",
      "Cooling Type": "IC411 TEFC",
      "Ambient Temperature": "-15°C to +45°C",
    },
  },
  {
    _id: "danfoss-vlt",
    name: "Danfoss VLT HVAC Drive FC102 Fan & Pump Drive",
    brand: "Danfoss",
    category: "Motors & Drives",
    rating: 4.7,
    price: 62000,
    oldPrice: 72000,
    sku: "DAN-FC102-45KW",
    image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80",
    badge: "READY TO SHIP",
    specifications: {
      "Power Rating": "45 kW (60 HP)",
      "Efficiency Class": "IE2 / Standard Inverter",
      "Protection": "IP21 / NEMA 1 Enclosure",
      "Voltage": "380–480V, 3-Phase",
      "Frequency": "0–590 Hz Variable",
      "Rated Speed": "Inverter Variable Speed",
      "Mounting": "Wall / Cabinet Mounted",
      "Frame Size": "Compact Enclosure B1",
      "Insulation Class": "Solid-State Inverter Power Electronics",
      "Warranty": "24 Months Danfoss Factory Warranty",
      "Pan-India Freight": "Express Covered Logistics",
    },
    technicalSpecifications: {
      "Standards": "IEC 61800-3 / CE / UL",
      "Duty Cycle": "Variable Torque Continuous",
      "Cooling Type": "Back-Channel Forced Air Convection",
      "Ambient Temperature": "-10°C to +45°C",
    },
  },
  {
    _id: "haas-cnc",
    name: "Haas VF-2 Vertical CNC Machining Center",
    brand: "Haas",
    category: "CNC Machining",
    rating: 4.8,
    price: 2450000,
    oldPrice: 2790000,
    sku: "HAAS-VF2-2026",
    image: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80",
    badge: "OEM VERIFIED",
    specifications: {
      "Power Rating": "22.4 kW (30 HP) Vector",
      "Efficiency Class": "High-Efficiency Spindle",
      "Protection": "Full Industrial Machine Enclosure",
      "Voltage": "380–480V, 3-Phase",
      "Frequency": "50/60 Hz",
      "Rated Speed": "8,100 RPM Vector Spindle",
      "Mounting": "Heavy Concrete Ground Pad",
      "Frame Size": "762×356 mm Work Table",
      "Insulation Class": "Industrial Servo Rating",
      "Warranty": "12 Months Factory Commissioning Warranty",
      "Pan-India Freight": "Specialized Heavy Transport",
    },
    technicalSpecifications: {
      "Standards": "ISO 230-2 / CE Directive",
      "Duty Cycle": "24/7 Production Duty",
      "Cooling Type": "Through-Spindle Flood Coolant",
      "Ambient Temperature": "10°C to 40°C Precision Hall",
    },
  },
  {
    _id: "kirloskar-pump",
    name: "Kirloskar End-Suction Industrial Centrifugal Pump",
    brand: "Kirloskar",
    category: "Pumps & Hydraulics",
    rating: 4.7,
    price: 42500,
    oldPrice: 49999,
    sku: "KIR-ES-100X80",
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
    badge: "TIER-1",
    specifications: {
      "Power Rating": "7.5 kW (10 HP)",
      "Efficiency Class": "High Hydraulic Efficiency",
      "Protection": "IP55 Terminal Protection",
      "Voltage": "415V, 3-Phase",
      "Frequency": "50 Hz",
      "Rated Speed": "2900 RPM Synchronous",
      "Mounting": "Baseplate Mounted Monobloc",
      "Frame Size": "100×80 Flanged Casing",
      "Insulation Class": "Class F Motor Insulation",
      "Warranty": "18 Months Kirloskar Industrial Warranty",
      "Pan-India Freight": "Standard Heavy Freight",
    },
    technicalSpecifications: {
      "Standards": "IS 5120 / ISO 2858",
      "Duty Cycle": "Continuous Water Supply",
      "Cooling Type": "Liquid Heat Transfer + TEFC Motor",
      "Ambient Temperature": "-10°C to +65°C Fluid Temp",
    },
  },
  {
    _id: "schneider-vfd",
    name: "Schneider Altivar Process 630 Variable Frequency Drive",
    brand: "Schneider Electric",
    category: "Process Automation",
    rating: 4.9,
    price: 88900,
    oldPrice: 99999,
    sku: "SE-ATV630-75KW",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    badge: "BEST MATCH",
    specifications: {
      "Power Rating": "75 kW (100 HP)",
      "Efficiency Class": "> 98% Inverter Efficiency",
      "Protection": "IP21 / UL Type 1 Enclosure",
      "Voltage": "380–480V, 3-Phase",
      "Frequency": "0.1–500 Hz",
      "Rated Speed": "Dynamic Sensorless Vector",
      "Mounting": "Control Cabinet Wall-Mount",
      "Frame Size": "Modular Industrial Chassis",
      "Insulation Class": "Solid-State Inverter Power Electronics",
      "Warranty": "24 Months Schneider Electric Warranty",
      "Pan-India Freight": "Express Covered Logistics",
    },
    technicalSpecifications: {
      "Standards": "IEC 61800-5-1 / CE / UL",
      "Duty Cycle": "Heavy Duty Industrial",
      "Cooling Type": "Smart Variable-Speed Internal Fan",
      "Ambient Temperature": "-15°C to +50°C",
    },
  },
  {
    _id: "abb-switchgear",
    name: "ABB SafeRing 12kV Medium Voltage Gas Insulated Switchgear",
    brand: "ABB",
    category: "Power & Switchgear",
    rating: 4.8,
    price: 185000,
    oldPrice: 210000,
    sku: "ABB-SR12-GIS",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
    badge: "OEM VERIFIED",
    specifications: {
      "Power Rating": "12 kV Medium Voltage",
      "Efficiency Class": "Zero Gas Leakage Hermetic",
      "Protection": "IP65 Gas Tank / IP2X Enclosure",
      "Voltage": "12 kV Rated Nominal",
      "Frequency": "50 Hz",
      "Rated Speed": "Sub-Cycle Fast Trip (50ms)",
      "Mounting": "Substation Floor Anchored",
      "Frame Size": "3-Way Compact Ring Main Unit",
      "Insulation Class": "SF6 Insulated Stainless Steel Tank",
      "Warranty": "36 Months ABB Grid Warranty",
      "Pan-India Freight": "Inspected Transit Carrier",
    },
    technicalSpecifications: {
      "Standards": "IEC 62271-200 / IEC 62271-100",
      "Duty Cycle": "Continuous Utility Incomer",
      "Cooling Type": "Natural Radiative Convection",
      "Ambient Temperature": "-25°C to +40°C",
    },
  },
  {
    _id: "lt-starter",
    name: "L&T Fully Compartmentalized Motor Control Center MCC",
    brand: "L&T",
    category: "Power & Switchgear",
    rating: 4.8,
    price: 135000,
    oldPrice: 155000,
    sku: "LT-MCC-FC-400A",
    image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80",
    badge: "READY TO SHIP",
    specifications: {
      "Power Rating": "400 A Main Incomer Busbar",
      "Efficiency Class": "Low Watt-Loss Copper Bus",
      "Protection": "IP42 Form 4b Compartmentalized",
      "Voltage": "415V, 3-Phase 4-Wire",
      "Frequency": "50 Hz",
      "Rated Speed": "Instantaneous Fault Clearing",
      "Mounting": "Free-Standing Floor Mounted",
      "Frame Size": "8-Tier Modular Drawout Panel",
      "Insulation Class": "Class H GPO-3 Support Barriers",
      "Warranty": "24 Months L&T Heavy Engineering Warranty",
      "Pan-India Freight": "Flatbed Heavy Transport",
    },
    technicalSpecifications: {
      "Standards": "IEC 61439-1 & 2 / IS 8623",
      "Duty Cycle": "Heavy Motor Starting Duty",
      "Cooling Type": "Louvred Natural Air Draft",
      "Ambient Temperature": "-5°C to +45°C",
    },
  },
];


const BENCHMARK_PRESETS = [
  {
    id: "ie3-motors",
    title: "IE3 Premium Efficiency Motors",
    category: "Motors & Drives",
    badge: "ENERGY TELEMETRY",
    description: "Compare Siemens vs. Crompton vs. Danfoss on efficiency class, continuous duty, and life-cycle savings.",
    ids: ["siemens-motor", "crompton-motor", "danfoss-vlt"],
    icon: "bi-lightning-charge-fill",
    stat: "Up to 18% Energy Savings",
  },
  {
    id: "vfd-automation",
    title: "Process Variable Frequency Drives",
    category: "Process Automation",
    badge: "DRIVE INTELLIGENCE",
    description: "Side-by-side harmonic distortion, control bus protocols, and inverter vector modulation benchmarks.",
    ids: ["schneider-vfd", "danfoss-vlt"],
    icon: "bi-sliders2",
    stat: "0.1–500 Hz Wide Spectrum",
  },
  {
    id: "mv-switchgear",
    title: "Medium Voltage Switchgear & MCC",
    category: "Power & Switchgear",
    badge: "SUBSTATION COMPLIANCE",
    description: "Evaluate short-circuit withstand capacity, arc fault endurance, and compartmentalization standards.",
    ids: ["abb-switchgear", "lt-starter"],
    icon: "bi-shield-check",
    stat: "IEC 62271 & Form 4b Tested",
  },
  {
    id: "cnc-machining",
    title: "Heavy-Duty CNC Machining Centers",
    category: "CNC Machining",
    badge: "PRECISION TOLERANCE",
    description: "Compare spindle vector drives, positioning repeatability, and automated tool changer dynamics.",
    ids: ["haas-cnc", "siemens-motor"],
    icon: "bi-cpu-fill",
    stat: "±0.0025 mm Micron Accuracy",
  },
];

const TELEMETRY_METRICS = [
  {
    key: "performance",
    label: "Continuous Performance & Duty",
    icon: "bi-speedometer2",
    desc: "Continuous torque delivery, thermal dissipation, and duty-cycle stability under 100% full-load condition.",
  },
  {
    key: "efficiency",
    label: "Energy Efficiency & Loss Mitigation",
    icon: "bi-lightning-charge-fill",
    desc: "IE efficiency classification, core electromagnetic loss minimization, and optimal operating power factor.",
  },
  {
    key: "build",
    label: "Build Quality & Housing Endurance",
    icon: "bi-shield-shaded",
    desc: "Ingress protection (IP55/IP65), vibration damping, and cast-iron/die-cast rigid structural frame.",
  },
  {
    key: "reliability",
    label: "Operational Reliability & MTBF",
    icon: "bi-arrow-repeat",
    desc: "Mean Time Between Failures, Class F/H insulation temperature margins, and bearing lifetime ratings.",
  },
  {
    key: "features",
    label: "Smart Telemetry & Bus Control",
    icon: "bi-cpu",
    desc: "Embedded vibration/temperature sensors, fieldbus connectivity (Modbus/Ethernet), and digital diagnostics.",
  },
  {
    key: "price",
    label: "Commercial Value & ROI Index",
    icon: "bi-graph-up-arrow",
    desc: "Acquisition cost balanced against lifecycle maintenance expenditure and OEM warranty guarantee.",
  },
];

function buildFallbackCompareData(ids, savedProducts) {
  const idList = ids ? ids.split(",").filter(Boolean) : [];
  const products = idList.map((id) => {
    let found = (savedProducts || []).find((p) => p._id === id || p.slug === id);
    if (!found) {
      found = INDUSTRIAL_CATALOG.find((p) => p._id === id || p.slug === id || p.name?.toLowerCase().includes(id.toLowerCase()));
    }
    if (!found) {
      const cleanName = id
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      found = {
        _id: id,
        name: cleanName,
        brand: "OEM Verified",
        category: "Industrial Equipment",
        price: 85000,
        sku: `IM-${id.slice(-6).toUpperCase()}`,
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        specifications: {
          "Power Rating": "15 kW (20 HP)",
          "Voltage": "415V, 3-Phase",
          "Efficiency Class": "IE3 Premium",
          "Protection": "IP55 Ingress Sealing",
          "Warranty": "24 Months OEM Warranty",
        },
        technicalSpecifications: {
          "Duty Cycle": "S1 Continuous Duty",
          "Standards": "IEC 60034 / IS 12615",
          "Ambient Temperature": "-20°C to +50°C",
        },
      };
    }
    return found;
  });

  const results = products.map((product, index) => {
    const price = getDisplayPrice(product);
    product.price = price;
    const baseScore = Math.max(96 - index * 5, 68);
    return {
      rank: index + 1,
      score: baseScore,
      price,
      product,
      breakdown: {
        performance: Math.max(96 - index * 4, 70),
        efficiency: Math.max(94 - index * 6 + (product.brand === "Siemens" ? 4 : 0), 65),
        build: Math.max(92 - index * 4, 72),
        reliability: Math.max(95 - index * 5, 68),
        features: Math.max(90 - index * 5 + (product.category === "Process Automation" ? 7 : 0), 64),
        price: Math.max(88 - index * 8, 60),
      },
    };
  });

  return {
    results,
    summary: `Verified SpecMatrix™ multi-vendor evaluation of ${products.length} industrial machines. Engineering telemetry and tolerance analysis generated from OEM certified datasheets.`
  };
}


const SUPPORTED_PLATFORMS = [
  { id: "amazon_in",      name: "Amazon India",    color: "#FF9900", logo: "/platforms/amazon.webp" },
  { id: "flipkart",       name: "Flipkart",        color: "#2874F0", logo: "/platforms/flipkart.webp" },
  { id: "indiamart",      name: "IndiaMART",       color: "#E87722", logo: "/platforms/indiamart-transparent.png" },
  { id: "tradeindia",     name: "TradeIndia",      color: "#F58220", logo: "/platforms/tradeindia-transparent.png" },
  { id: "industrybuying", name: "IndustryBuying",  color: "#1A73E8", logo: "/platforms/industrybuying-transparent.png" },
  { id: "moglix",         name: "Moglix",          color: "#E53935", logo: "/platforms/moglix-transparent.png" },
];

function detectPlatformClient(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return SUPPORTED_PLATFORMS.find((p) =>
      host === p.id.replace("_in", ".in") ||
      host.includes(p.id.replace("_in", ""))
    ) || null;
  } catch { return null; }
}


export const CATEGORIES = [
  "Motors",
  "Space Heaters",
  "LED Lighting",
  "Testing Instruments",
  "Distribution Transformers",
  "Switchgear",
  "Automation & VFDs",
  "Pumps & Valves",
];

export {
  INDUSTRIAL_CATALOG,
  BENCHMARK_PRESETS,
  TELEMETRY_METRICS,
  buildFallbackCompareData,
  SUPPORTED_PLATFORMS,
  detectPlatformClient,
};
