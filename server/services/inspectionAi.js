const OpenAI = require("openai");

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15000,
      maxRetries: 1,
    })
  : null;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const lower = (value) => String(value || "").toLowerCase();
const uniqueStrings = (values, limit = 5) => {
  const seen = new Set();
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

const conditionBaselines = {
  new: 9.5,
  "like-new": 9,
  good: 7.8,
  fair: 6.4,
  poor: 4.5,
};

const priceBandMultipliers = {
  new: 1.16,
  "like-new": 1.08,
  good: 1,
  fair: 0.9,
  poor: 0.78,
};

const baseContext = (car, inspection, sellerNotes) => ({
  make: car.make,
  model: car.model,
  year: car.year,
  price: car.price,
  mileage: car.mileage,
  fuelType: car.fuelType,
  transmission: car.transmission,
  condition: car.condition,
  bodyType: car.bodyType,
  color: car.color,
  features: car.features || [],
  city: car.city,
  state: car.state,
  sellerNotes: sellerNotes || inspection?.sellerNotes || car.description || "",
  accidentHistory: inspection?.accidentHistory ?? false,
  serviceHistory: inspection?.serviceHistory ?? false,
  numberOfOwners: inspection?.numberOfOwners ?? 1,
  registrationNumber: car.registrationNumber || inspection?.vin || "",
});

const buildHeuristicInspection = (car, inspection, sellerNotes) => {
  const context = baseContext(car, inspection, sellerNotes);
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - normalizeNumber(car.year, currentYear));
  const mileage = Math.max(0, normalizeNumber(car.mileage, 0));

  let conditionScore = conditionBaselines[lower(car.condition)] ?? 7;
  conditionScore -= age * 0.13;
  conditionScore -= (mileage / 10000) * 0.22;
  if (context.accidentHistory) conditionScore -= 0.9;
  if (context.serviceHistory) conditionScore += 0.35;
  if (context.numberOfOwners > 1) conditionScore -= Math.min(0.6, (context.numberOfOwners - 1) * 0.12);
  conditionScore = clamp(Number(conditionScore.toFixed(1)), 0, 10);

  const issues = [];
  if (context.accidentHistory) {
    issues.push({
      category: "body",
      severity: "major",
      description: "Accident history is recorded and should be reviewed carefully before booking.",
    });
  }
  if (mileage >= 60000) {
    issues.push({
      category: "mechanical",
      severity: mileage >= 90000 ? "major" : "moderate",
      description: "Mileage is on the higher side for this age, so wear-and-tear checks are important.",
    });
  }
  if (!context.serviceHistory) {
    issues.push({
      category: "documentation",
      severity: "moderate",
      description: "Service records are not attached, so maintenance history is harder to verify.",
    });
  }
  if (context.sellerNotes && /scratch|dent|paint|bump|tyre|tire|noise|warning|leak|rust/i.test(context.sellerNotes)) {
    issues.push({
      category: "seller notes",
      severity: "minor",
      description: "Seller notes mention an area that should be checked during a live inspection.",
    });
  }
  if (!issues.length) {
    issues.push({
      category: "general",
      severity: "minor",
      description: "No major red flags are visible from the listing data, but an in-person check is still recommended.",
    });
  }

  const strengths = uniqueStrings([
    context.serviceHistory ? "Service history is attached" : "",
    context.accidentHistory ? "" : "No accident history reported",
    mileage <= 25000 ? "Relatively low mileage for the year" : "",
    conditionScore >= 8 ? "Strong overall condition signal" : "",
    context.numberOfOwners === 1 ? "Single-owner profile" : `${context.numberOfOwners} previous owners`,
    Array.isArray(car.features) && car.features.length ? `Feature set includes ${car.features.slice(0, 2).join(", ")}` : "",
  ]);

  const estimatedValue = Math.max(
    0,
    Math.round(
      (normalizeNumber(car.price, 0) || 0) *
        (priceBandMultipliers[lower(car.condition)] ?? 1) *
        (1 - Math.min(0.16, age * 0.018 + mileage / 250000))
    )
  );

  const recommendation =
    conditionScore >= 8.2
      ? "buy"
      : conditionScore >= 6.5
        ? "consider"
        : "avoid";

  const aiSummary = [
    `${car.year} ${car.make} ${car.model} looks ${recommendation === "buy" ? "strong" : recommendation === "consider" ? "decent" : "risky"} on the available data.`,
    context.serviceHistory ? "Service coverage looks reassuring." : "Missing service history limits confidence.",
    context.accidentHistory ? "Accident history should be verified before commitment." : "No accident history is recorded in the report data.",
  ].join(" ");

  return {
    conditionScore,
    aiSummary,
    issues,
    strengths,
    estimatedValue,
    recommendation,
    certified: conditionScore >= 8,
  };
};

const buildHeuristicPriceHint = (payload) => {
  const year = normalizeNumber(payload.year, new Date().getFullYear());
  const mileage = Math.max(0, normalizeNumber(payload.mileage, 0));
  const condition = lower(payload.condition);
  const transmission = lower(payload.transmission);
  const fuelType = lower(payload.fuelType);
  const make = lower(payload.make);
  const model = lower(payload.model);

  let base = 850000;
  base += Math.max(0, year - 2018) * 130000;
  base -= (mileage / 1000) * 2200;
  base *= priceBandMultipliers[condition] ?? 1;

  if (["hybrid", "electric"].includes(fuelType)) base *= fuelType === "electric" ? 1.14 : 1.09;
  if (transmission === "automatic" || transmission === "cvt" || transmission === "dct") base *= 1.05;
  if (/(bmw|audi|mercedes|volvo|jaguar|lexus|land rover|porsche)/i.test(`${make} ${model}`)) base *= 1.22;
  if (/(suv|van)/i.test(payload.bodyType || "")) base *= 1.06;

  const suggestedPrice = Math.max(150000, Math.round(base / 1000) * 1000);
  const minPrice = Math.round((suggestedPrice * 0.9) / 1000) * 1000;
  const maxPrice = Math.round((suggestedPrice * 1.08) / 1000) * 1000;

  return {
    suggestedPrice,
    minPrice,
    maxPrice,
    reasoning:
      "Estimated from the listing inputs, vehicle age, mileage, fuel type, transmission, and overall condition signal.",
  };
};

const normalizeInspectionReport = (report, fallback) => {
  const heuristic = buildHeuristicInspection(fallback.car, fallback.inspection, fallback.sellerNotes);
  const source = report && typeof report === "object" ? report : {};
  const issues = Array.isArray(source.issues)
    ? source.issues
        .map((issue) => ({
          category: String(issue?.category || "general").trim() || "general",
          severity: ["minor", "moderate", "major"].includes(lower(issue?.severity))
            ? lower(issue.severity)
            : "minor",
          description: String(issue?.description || "").trim(),
        }))
        .filter((issue) => issue.description)
        .slice(0, 5)
    : heuristic.issues;
  const strengths = Array.isArray(source.strengths) ? uniqueStrings(source.strengths, 5) : heuristic.strengths;

  return {
    conditionScore: clamp(
      Number.isFinite(Number(source.conditionScore)) ? Number(source.conditionScore) : heuristic.conditionScore,
      0,
      10
    ),
    aiSummary: String(source.aiSummary || source.summary || heuristic.aiSummary).trim(),
    issues: issues.length ? issues : heuristic.issues,
    strengths: strengths.length ? strengths : heuristic.strengths,
    estimatedValue: Math.max(
      0,
      Math.round(Number.isFinite(Number(source.estimatedValue)) ? Number(source.estimatedValue) : heuristic.estimatedValue)
    ),
    recommendation: ["buy", "consider", "avoid"].includes(lower(source.recommendation))
      ? lower(source.recommendation)
      : heuristic.recommendation,
    certified: Boolean(source.certified ?? heuristic.certified),
  };
};

const normalizePriceHint = (hint, payload) => {
  const heuristic = buildHeuristicPriceHint(payload);
  const source = hint && typeof hint === "object" ? hint : {};
  const suggestedPrice = Number.isFinite(Number(source.suggestedPrice))
    ? Number(source.suggestedPrice)
    : heuristic.suggestedPrice;
  const minPrice = Number.isFinite(Number(source.minPrice)) ? Number(source.minPrice) : heuristic.minPrice;
  const maxPrice = Number.isFinite(Number(source.maxPrice)) ? Number(source.maxPrice) : heuristic.maxPrice;

  return {
    suggestedPrice: Math.max(0, Math.round(suggestedPrice / 1000) * 1000),
    minPrice: Math.max(0, Math.round(minPrice / 1000) * 1000),
    maxPrice: Math.max(0, Math.round(maxPrice / 1000) * 1000),
    reasoning: String(source.reasoning || heuristic.reasoning).trim(),
  };
};

const generateInspectionReport = async (car, inspection, sellerNotes = "") => {
  const fallback = { car, inspection, sellerNotes };

  if (!client) {
    return buildHeuristicInspection(car, inspection, sellerNotes);
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an automotive inspection analyst for a car marketplace. Return only JSON with keys conditionScore, aiSummary, issues, strengths, estimatedValue, recommendation, certified.",
        },
        {
          role: "user",
          content: JSON.stringify({
            car: {
              make: car.make,
              model: car.model,
              year: car.year,
              price: car.price,
              mileage: car.mileage,
              fuelType: car.fuelType,
              transmission: car.transmission,
              condition: car.condition,
              bodyType: car.bodyType,
              color: car.color,
              features: car.features || [],
              city: car.city,
              state: car.state,
              registrationNumber: car.registrationNumber || "",
            },
            inspection: {
              accidentHistory: inspection?.accidentHistory ?? false,
              serviceHistory: inspection?.serviceHistory ?? false,
              numberOfOwners: inspection?.numberOfOwners ?? 1,
              sellerNotes: sellerNotes || inspection?.sellerNotes || car.description || "",
            },
          }),
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return normalizeInspectionReport(parsed, fallback);
  } catch (error) {
    console.warn(`AI inspection generation fell back to heuristics: ${error.message}`);
    return buildHeuristicInspection(car, inspection, sellerNotes);
  }
};

const generatePriceHint = async (payload) => {
  if (!client) {
    return buildHeuristicPriceHint(payload);
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a used-car pricing assistant for India. Return only JSON with keys suggestedPrice, minPrice, maxPrice, reasoning.",
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return normalizePriceHint(parsed, payload);
  } catch (error) {
    console.warn(`AI price hint generation fell back to heuristics: ${error.message}`);
    return buildHeuristicPriceHint(payload);
  }
};

module.exports = {
  generateInspectionReport,
  generatePriceHint,
};
