require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Car = require("../models/Car");

const ensureEnv = () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to add demo cars.");
  }
};

const cityPairs = [
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Surat", state: "Gujarat" },
  { city: "Delhi", state: "Delhi" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Kochi", state: "Kerala" },
];

const templates = [
  {
    make: "Toyota",
    model: "Innova Hycross ZX",
    fuelType: "hybrid",
    transmission: "automatic",
    condition: "like-new",
    bodyType: "van",
    basePrice: 2890000,
    baseYear: 2024,
    baseMileage: 12000,
    color: "Attitude Black",
    aiScore: 8.6,
    views: 96,
    negotiable: true,
    features: ["captain seats", "360 camera", "panoramic sunroof", "wireless charging"],
    images: [
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "Mahindra",
    model: "Scorpio N Z8L",
    fuelType: "diesel",
    transmission: "automatic",
    condition: "good",
    bodyType: "suv",
    basePrice: 2140000,
    baseYear: 2023,
    baseMileage: 21000,
    color: "Everest White",
    aiScore: 7.7,
    views: 118,
    negotiable: true,
    features: ["sunroof", "Sony audio", "adventure mode", "reverse camera"],
    images: [
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "Hyundai",
    model: "Verna SX Turbo",
    fuelType: "petrol",
    transmission: "automatic",
    condition: "like-new",
    bodyType: "sedan",
    basePrice: 1640000,
    baseYear: 2023,
    baseMileage: 16800,
    color: "Fiery Red",
    aiScore: 8.0,
    views: 81,
    negotiable: true,
    features: ["ventilated seats", "Bose audio", "ADAS", "wireless charging"],
    images: [
      "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "Kia",
    model: "Carens Luxury Plus",
    fuelType: "diesel",
    transmission: "automatic",
    condition: "good",
    bodyType: "van",
    basePrice: 1795000,
    baseYear: 2022,
    baseMileage: 26500,
    color: "Imperial Blue",
    aiScore: 7.5,
    views: 74,
    negotiable: true,
    features: ["captain seats", "air purifier", "sunroof", "Bose audio"],
    images: [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "Tata",
    model: "Punch EV Empowered",
    fuelType: "electric",
    transmission: "automatic",
    condition: "new",
    bodyType: "suv",
    basePrice: 1490000,
    baseYear: 2024,
    baseMileage: 8200,
    color: "Seaweed Green",
    aiScore: 8.7,
    views: 103,
    negotiable: true,
    features: ["360 camera", "connected car tech", "wireless Android Auto", "fast charging"],
    images: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617654112329-6e37f4c8baae?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "MG",
    model: "Hector Sharp Pro",
    fuelType: "petrol",
    transmission: "cvt",
    condition: "good",
    bodyType: "suv",
    basePrice: 1990000,
    baseYear: 2023,
    baseMileage: 19000,
    color: "Candy White",
    aiScore: 7.8,
    views: 88,
    negotiable: true,
    features: ["panoramic sunroof", "ADAS", "wireless charging", "digital cluster"],
    images: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "Volkswagen",
    model: "Taigun GT Plus",
    fuelType: "petrol",
    transmission: "automatic",
    condition: "like-new",
    bodyType: "suv",
    basePrice: 1860000,
    baseYear: 2023,
    baseMileage: 14500,
    color: "Curcuma Yellow",
    aiScore: 8.1,
    views: 92,
    negotiable: true,
    features: ["digital cockpit", "wireless charging", "sunroof", "ventilated seats"],
    images: [
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "Honda",
    model: "Amaze VX CVT",
    fuelType: "petrol",
    transmission: "cvt",
    condition: "good",
    bodyType: "sedan",
    basePrice: 975000,
    baseYear: 2022,
    baseMileage: 24000,
    color: "Meteoroid Grey",
    aiScore: 7.2,
    views: 63,
    negotiable: true,
    features: ["rear camera", "push start", "cruise control", "touchscreen"],
    images: [
      "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "Maruti Suzuki",
    model: "Fronx Alpha Turbo",
    fuelType: "petrol",
    transmission: "automatic",
    condition: "like-new",
    bodyType: "suv",
    basePrice: 1230000,
    baseYear: 2024,
    baseMileage: 9800,
    color: "Earthen Brown",
    aiScore: 8.2,
    views: 86,
    negotiable: true,
    features: ["heads-up display", "360 camera", "wireless CarPlay", "LED headlights"],
    images: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    make: "BMW",
    model: "X1 sDrive18i",
    fuelType: "petrol",
    transmission: "automatic",
    condition: "like-new",
    bodyType: "suv",
    basePrice: 4290000,
    baseYear: 2022,
    baseMileage: 28000,
    color: "Storm Bay",
    aiScore: 8.4,
    views: 109,
    negotiable: true,
    features: ["panoramic sunroof", "digital cockpit", "wireless charging", "powered tailgate"],
    images: [
      "https://images.unsplash.com/photo-1486326658981-ed68abe5868e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

const targetCount = 50;

const buildCar = (template, sellerId, index) => {
  const location = cityPairs[index % cityPairs.length];
  const cycle = Math.floor(index / templates.length);
  const year = Math.max(2020, template.baseYear - (index % 3));
  const mileage = template.baseMileage + cycle * 1900 + (index % 5) * 350;
  const price = template.basePrice + cycle * 25000 - (index % 4) * 12000;
  const aiScore = Math.max(6.8, Math.min(9.4, Number((template.aiScore + cycle * 0.05 - (index % 4) * 0.08).toFixed(1))));

  return {
    seller: sellerId,
    make: template.make,
    model: template.model,
    year,
    price,
    mileage,
    fuelType: template.fuelType,
    transmission: template.transmission,
    condition: template.condition,
    bodyType: template.bodyType,
    color: template.color,
    description: `${template.model} in ${location.city} with a transparent seller profile, clean maintenance trail, and ready-to-drive condition.`,
    images: template.images,
    features: template.features,
    city: location.city,
    state: location.state,
    available: true,
    views: template.views + cycle * 9 + (index % 7) * 3,
    aiScore,
    negotiable: template.negotiable,
  };
};

const addDemoCars = async () => {
  ensureEnv();
  await mongoose.connect(process.env.MONGO_URI);

  const sellers = await User.find({ role: "seller" }).sort({ createdAt: 1 });
  if (!sellers.length) {
    throw new Error("No seller accounts found. Seed seller users first.");
  }

  let inserted = 0;
  for (let index = 0; index < targetCount; index += 1) {
    const template = templates[index % templates.length];
    const seller = sellers[index % sellers.length];
    const car = buildCar(template, seller._id, index);

    const exists = await Car.findOne({
      seller: seller._id,
      make: car.make,
      model: car.model,
      year: car.year,
      city: car.city,
      mileage: car.mileage,
    });

    if (!exists) {
      await Car.create(car);
      inserted += 1;
    }
  }

  const total = await Car.countDocuments();
  console.log(JSON.stringify({ inserted, total }, null, 2));
};

addDemoCars()
  .catch((err) => {
    console.error(`Add demo cars failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
