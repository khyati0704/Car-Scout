// Format price to Indian Rupee format
export const formatPrice = (amount) => {
  const value = Number(amount || 0);
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
};

export const formatMileage = (km) => `${Number(km || 0).toLocaleString("en-IN")} km`;

export const timeAgo = (date) => {
  const seconds = Math.max(0, Math.floor((new Date() - new Date(date)) / 1000));
  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "week", secs: 604800 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "minute", secs: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.secs);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
  }

  return "just now";
};

export const conditionInfo = (condition) => {
  const map = {
    new: { label: "New", color: "#4ade80" },
    "like-new": { label: "Like New", color: "#86efac" },
    good: { label: "Good", color: "#fbbf24" },
    fair: { label: "Fair", color: "#f97316" },
    poor: { label: "Poor", color: "#ef4444" },
  };

  return map[condition] || { label: condition || "Unknown", color: "#94a3b8" };
};

export const scoreColor = (score) => {
  if (score >= 8) return "#4ade80";
  if (score >= 6) return "#fbbf24";
  if (score >= 4) return "#f97316";
  return "#ef4444";
};

export const capitalize = (str) => (str ? `${str.charAt(0).toUpperCase()}${str.slice(1)}` : "");

export const buildQuery = (obj) =>
  Object.entries(obj)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

export const calculateMonthlyEMI = (price, downPayment = 0, annualRate = 9.5, months = 60) => {
  const principal = Math.max(0, Number(price || 0) - Number(downPayment || 0));
  if (!principal || !months) return 0;

  const monthlyRate = annualRate / 12 / 100;
  if (!monthlyRate) return Math.round(principal / months);

  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Math.round(emi);
};

export const getFinanceSnapshot = (price) => {
  const downPayment = Math.round(Number(price || 0) * 0.2);
  const monthly = calculateMonthlyEMI(price, downPayment, 9.5, 60);
  return { downPayment, monthly, annualRate: 9.5, termMonths: 60 };
};

export const getPriceBand = (car) => {
  if (!car) return { label: "Awaiting insight", tone: "neutral" };
  const score = Number(car.aiScore || 0);
  if (score >= 8) return { label: "High confidence buy", tone: "good" };
  if (score >= 6) return { label: "Worth comparing", tone: "watch" };
  if (score > 0) return { label: "Inspect carefully", tone: "risk" };
  return { label: "Fresh listing", tone: "neutral" };
};

export const getCompareSpecs = (car) => [
  { label: "Price", value: formatPrice(car.price) },
  { label: "Year", value: car.year || "-" },
  { label: "Mileage", value: formatMileage(car.mileage) },
  { label: "Fuel", value: capitalize(car.fuelType) || "-" },
  { label: "Gearbox", value: car.transmission?.toUpperCase() || "-" },
  { label: "AI score", value: car.aiScore ? `${car.aiScore}/10` : "Pending" },
];
