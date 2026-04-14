require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Car = require("../models/Car");
const Inspection = require("../models/Inspection");
const { Conversation, Message } = require("../models/Message");
const TestDrive = require("../models/TestDrive");

const ensureEnv = () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to run the seed script.");
  }
};

const connect = async () => {
  ensureEnv();
  await mongoose.connect(process.env.MONGO_URI);
};

const carImages = {
  nexon: [
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  ],
  creta: [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
  ],
  city: [
    "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
  ],
  mg4: [
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1617654112329-6e37f4c8baae?auto=format&fit=crop&w=1200&q=80",
  ],
  safari: [
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80",
  ],
  virtus: [
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1200&q=80",
  ],
  xuv700: [
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
  ],
  seltos: [
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=1200&q=80",
  ],
  fortuner: [
    "https://images.unsplash.com/photo-1486326658981-ed68abe5868e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
  ],
  baleno: [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=1200&q=80",
  ],
};

const seed = async () => {
  await connect();

  await Promise.all([
    TestDrive.deleteMany({}),
    Message.deleteMany({}),
    Conversation.deleteMany({}),
    Inspection.deleteMany({}),
    Car.deleteMany({}),
    User.deleteMany({}),
  ]);

  const [sellerA, sellerB, sellerC, buyerA, buyerB, admin] = await User.create([
    {
      name: "Arjun Auto House",
      email: "arjun.seller@carscout.dev",
      password: "password123",
      role: "seller",
      phone: "9876543210",
      city: "Mumbai",
      bio: "Premium used cars with verified service history and quick buyer response.",
      isVerified: true,
    },
    {
      name: "Riya Wheels",
      email: "riya.seller@carscout.dev",
      password: "password123",
      role: "seller",
      phone: "9898989898",
      city: "Pune",
      bio: "Curated city cars and family SUVs with transparent pricing.",
      isVerified: true,
    },
    {
      name: "Harsh Mobility",
      email: "harsh.seller@carscout.dev",
      password: "password123",
      role: "seller",
      phone: "9810012345",
      city: "Bengaluru",
      bio: "EV-focused independent seller with flexible appointments.",
      isVerified: true,
    },
    {
      name: "Neha Sharma",
      email: "neha.buyer@carscout.dev",
      password: "password123",
      role: "buyer",
      phone: "9123456780",
      city: "Thane",
      bio: "Looking for a family SUV with strong inspection history.",
    },
    {
      name: "Karan Mehta",
      email: "karan.buyer@carscout.dev",
      password: "password123",
      role: "buyer",
      phone: "9000011111",
      city: "Bengaluru",
      bio: "Comparing EV and sedan options for daily commute and weekend trips.",
    },
    {
      name: "Car Scout Admin",
      email: "admin@carscout.dev",
      password: "password123",
      role: "admin",
      city: "Ahmedabad",
      bio: "Admin account for moderation and QA.",
      isVerified: true,
    },
  ]);

  const cars = await Car.create([
    {
      seller: sellerA._id,
      make: "Tata",
      model: "Nexon EV Max",
      year: 2023,
      price: 1895000,
      mileage: 14200,
      fuelType: "electric",
      transmission: "automatic",
      condition: "like-new",
      bodyType: "suv",
      color: "Pristine White",
      description: "Single-owner EV with fast charging support, panoramic roof, and complete service documentation.",
      images: carImages.nexon,
      features: ["360 camera", "sunroof", "connected car tech", "fast charging"],
      city: "Mumbai",
      state: "Maharashtra",
      available: true,
      views: 124,
      aiScore: 8.8,
      negotiable: true,
    },
    {
      seller: sellerB._id,
      make: "Hyundai",
      model: "Creta SX(O)",
      year: 2022,
      price: 1790000,
      mileage: 21500,
      fuelType: "petrol",
      transmission: "automatic",
      condition: "good",
      bodyType: "suv",
      color: "Titan Grey",
      description: "Well-maintained SUV with ventilated seats, Bose audio, and dealership service record.",
      images: carImages.creta,
      features: ["ventilated seats", "Bose audio", "ADAS", "wireless charging"],
      city: "Pune",
      state: "Maharashtra",
      available: true,
      views: 98,
      aiScore: 7.4,
      negotiable: true,
    },
    {
      seller: sellerA._id,
      make: "Honda",
      model: "City ZX",
      year: 2021,
      price: 1280000,
      mileage: 29800,
      fuelType: "petrol",
      transmission: "cvt",
      condition: "good",
      bodyType: "sedan",
      color: "Lunar Silver",
      description: "Comfortable sedan with low maintenance cost, smooth CVT, and excellent cabin condition.",
      images: carImages.city,
      features: ["lane watch camera", "rear AC vents", "sunroof"],
      city: "Navi Mumbai",
      state: "Maharashtra",
      available: true,
      views: 67,
      aiScore: 7.1,
      negotiable: false,
    },
    {
      seller: sellerC._id,
      make: "MG",
      model: "ZS EV",
      year: 2024,
      price: 2240000,
      mileage: 9400,
      fuelType: "electric",
      transmission: "automatic",
      condition: "new",
      bodyType: "suv",
      color: "Starry Black",
      description: "Almost-new EV with extended battery warranty, premium interior, and dual-pane sunroof.",
      images: carImages.mg4,
      features: ["panoramic sunroof", "wireless Android Auto", "digital cluster", "ADAS"],
      city: "Bengaluru",
      state: "Karnataka",
      available: true,
      views: 88,
      aiScore: 9.1,
      negotiable: true,
    },
    {
      seller: sellerB._id,
      make: "Tata",
      model: "Safari Accomplished",
      year: 2023,
      price: 2625000,
      mileage: 18200,
      fuelType: "diesel",
      transmission: "automatic",
      condition: "like-new",
      bodyType: "suv",
      color: "Oberon Black",
      description: "Six-seater flagship SUV with captain seats, premium infotainment, and highway-ready comfort.",
      images: carImages.safari,
      features: ["captain seats", "360 camera", "ADAS", "ventilated seats"],
      city: "Pune",
      state: "Maharashtra",
      available: true,
      views: 136,
      aiScore: 8.1,
      negotiable: true,
    },
    {
      seller: sellerC._id,
      make: "Volkswagen",
      model: "Virtus GT",
      year: 2023,
      price: 1810000,
      mileage: 15600,
      fuelType: "petrol",
      transmission: "automatic",
      condition: "like-new",
      bodyType: "sedan",
      color: "Rising Blue",
      description: "Performance-focused sedan with full service history and enthusiast-owned maintenance.",
      images: carImages.virtus,
      features: ["digital cockpit", "wireless charging", "ventilated seats"],
      city: "Bengaluru",
      state: "Karnataka",
      available: true,
      views: 79,
      aiScore: 8.3,
      negotiable: true,
    },
    {
      seller: sellerB._id,
      make: "Mahindra",
      model: "XUV700 AX7",
      year: 2024,
      price: 2490000,
      mileage: 11800,
      fuelType: "petrol",
      transmission: "automatic",
      condition: "like-new",
      bodyType: "suv",
      color: "Midnight Black",
      description: "High-demand family SUV with ADAS, panoramic sunroof, and dealer-maintained service record.",
      images: carImages.xuv700,
      features: ["panoramic sunroof", "ADAS", "Sony audio", "360 camera"],
      city: "Pune",
      state: "Maharashtra",
      available: true,
      views: 112,
      aiScore: 8.5,
      negotiable: true,
    },
    {
      seller: sellerA._id,
      make: "Kia",
      model: "Seltos GTX+",
      year: 2022,
      price: 1690000,
      mileage: 22400,
      fuelType: "petrol",
      transmission: "automatic",
      condition: "good",
      bodyType: "suv",
      color: "Glacier White",
      description: "Feature-packed city SUV with ventilated seats, connected tech, and a clean ownership record.",
      images: carImages.seltos,
      features: ["ventilated seats", "Bose audio", "connected car tech", "wireless charging"],
      city: "Thane",
      state: "Maharashtra",
      available: true,
      views: 94,
      aiScore: 7.9,
      negotiable: true,
    },
    {
      seller: sellerC._id,
      make: "Toyota",
      model: "Fortuner 4x2 AT",
      year: 2021,
      price: 3180000,
      mileage: 36500,
      fuelType: "diesel",
      transmission: "automatic",
      condition: "good",
      bodyType: "suv",
      color: "Pearl White",
      description: "Reliable full-size SUV with highway comfort, service transparency, and strong resale value.",
      images: carImages.fortuner,
      features: ["4x2 drivetrain", "cruise control", "leather seats", "LED headlights"],
      city: "Bengaluru",
      state: "Karnataka",
      available: true,
      views: 144,
      aiScore: 7.8,
      negotiable: false,
    },
    {
      seller: sellerA._id,
      make: "Maruti Suzuki",
      model: "Baleno Alpha",
      year: 2023,
      price: 895000,
      mileage: 13400,
      fuelType: "petrol",
      transmission: "amt",
      condition: "like-new",
      bodyType: "hatchback",
      color: "Nexa Blue",
      description: "Ideal city hatchback with low running cost, fresh tyres, and excellent cabin upkeep.",
      images: carImages.baleno,
      features: ["heads-up display", "reverse camera", "Apple CarPlay", "push start"],
      city: "Mumbai",
      state: "Maharashtra",
      available: true,
      views: 72,
      aiScore: 8.0,
      negotiable: true,
    },
  ]);

  const [nexon, creta, city, zsEv, safari, virtus, xuv700, seltos, fortuner, baleno] = cars;

  await Inspection.create([
    {
      car: nexon._id,
      requestedBy: sellerA._id,
      conditionScore: 8.8,
      aiSummary: "Battery health and exterior condition are strong. A few cosmetic marks are present but the vehicle remains an above-market EV option.",
      issues: [{ category: "body", severity: "minor", description: "Minor scratch near rear bumper edge." }],
      strengths: ["Healthy battery range", "Strong service history", "Clean cabin and upholstery"],
      estimatedValue: 1920000,
      accidentHistory: false,
      serviceHistory: true,
      numberOfOwners: 1,
      status: "completed",
      certified: true,
    },
    {
      car: creta._id,
      requestedBy: sellerB._id,
      conditionScore: 7.4,
      aiSummary: "Well-kept SUV with healthy tyres and solid interior condition. Pricing is slightly above average but justified by features.",
      issues: [{ category: "electrical", severity: "minor", description: "One rear parking sensor shows intermittent warning." }],
      strengths: ["Premium variant features", "Documented dealer service", "No accident history"],
      estimatedValue: 1745000,
      accidentHistory: false,
      serviceHistory: true,
      numberOfOwners: 1,
      status: "completed",
      certified: true,
    },
    {
      car: zsEv._id,
      requestedBy: sellerC._id,
      conditionScore: 9.1,
      aiSummary: "Top-tier EV listing with excellent battery condition, low mileage, and premium ownership profile.",
      issues: [],
      strengths: ["Very low mileage", "Excellent battery condition", "Premium feature set"],
      estimatedValue: 2275000,
      accidentHistory: false,
      serviceHistory: true,
      numberOfOwners: 1,
      status: "completed",
      certified: true,
    },
    {
      car: safari._id,
      requestedBy: sellerB._id,
      conditionScore: 8.1,
      aiSummary: "Strong family SUV option with clean mechanicals and attractive resale positioning.",
      issues: [{ category: "interior", severity: "minor", description: "Light wear visible on second-row door trim." }],
      strengths: ["Strong diesel engine health", "High feature completeness", "Premium road presence"],
      estimatedValue: 2590000,
      accidentHistory: false,
      serviceHistory: true,
      numberOfOwners: 1,
      status: "completed",
      certified: true,
    },
    {
      car: xuv700._id,
      requestedBy: sellerB._id,
      conditionScore: 8.5,
      aiSummary: "Popular premium SUV with strong feature value, healthy mechanicals, and competitive pricing.",
      issues: [{ category: "body", severity: "minor", description: "Small paint chip on driver door edge." }],
      strengths: ["High buyer demand", "Clean service record", "ADAS package working normally"],
      estimatedValue: 2460000,
      accidentHistory: false,
      serviceHistory: true,
      numberOfOwners: 1,
      status: "completed",
      certified: true,
    },
    {
      car: fortuner._id,
      requestedBy: sellerC._id,
      conditionScore: 7.8,
      aiSummary: "Mechanically dependable SUV with above-average mileage but still a strong long-term ownership pick.",
      issues: [{ category: "interior", severity: "moderate", description: "Seat bolster wear visible on driver side." }],
      strengths: ["Strong diesel engine response", "Resale-friendly segment", "No structural accident history"],
      estimatedValue: 3090000,
      accidentHistory: false,
      serviceHistory: true,
      numberOfOwners: 1,
      status: "completed",
      certified: true,
    },
  ]);

  buyerA.savedCars = [nexon._id, safari._id, city._id, xuv700._id];
  buyerB.savedCars = [zsEv._id, virtus._id, creta._id, fortuner._id, baleno._id];
  await Promise.all([buyerA.save(), buyerB.save()]);

  const convA = await Conversation.create({
    buyer: buyerA._id,
    seller: sellerA._id,
    car: nexon._id,
    lastMessage: "Saturday morning works for me. Can we meet near Powai?",
    lastOffer: 1820000,
    status: "active",
    unreadBuyer: 0,
    unreadSeller: 1,
  });

  const convB = await Conversation.create({
    buyer: buyerB._id,
    seller: sellerC._id,
    car: zsEv._id,
    lastMessage: "Can you confirm battery warranty coverage before the visit?",
    status: "active",
    unreadBuyer: 0,
    unreadSeller: 1,
  });

  await Message.create([
    {
      conversation: convA._id,
      sender: buyerA._id,
      content: "Hi, I am interested in the Nexon EV Max. Is it still available?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    },
    {
      conversation: convA._id,
      sender: sellerA._id,
      content: "Yes, it is available and recently serviced.",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
    },
    {
      conversation: convA._id,
      sender: buyerA._id,
      content: "Offer: ₹18.20 L",
      type: "offer",
      offerAmount: 1820000,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      conversation: convA._id,
      sender: sellerA._id,
      content: "Saturday morning works for me. Can we meet near Powai?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      conversation: convB._id,
      sender: buyerB._id,
      content: "I am comparing this EV with a Virtus GT. What is the real-world range you are seeing?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
    },
    {
      conversation: convB._id,
      sender: sellerC._id,
      content: "Around 340 km in mixed city driving. The battery warranty is intact as well.",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 9),
    },
    {
      conversation: convB._id,
      sender: buyerB._id,
      content: "Can you confirm battery warranty coverage before the visit?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  ]);

  await TestDrive.create([
    {
      car: nexon._id,
      buyer: buyerA._id,
      seller: sellerA._id,
      conversation: convA._id,
      scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 48),
      location: "Powai Lake parking, Mumbai",
      notes: "Need enough time to check rear seat comfort for family use.",
      status: "confirmed",
      statusUpdatedBy: sellerA._id,
    },
    {
      car: zsEv._id,
      buyer: buyerB._id,
      seller: sellerC._id,
      conversation: convB._id,
      scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 72),
      location: "Indiranagar Metro parking, Bengaluru",
      notes: "Would like to review charging setup and warranty papers.",
      status: "requested",
      statusUpdatedBy: buyerB._id,
    },
  ]);

  console.log("\nSeed complete.");
  console.log("Demo accounts:");
  console.log("  Seller: arjun.seller@carscout.dev / password123");
  console.log("  Seller: riya.seller@carscout.dev / password123");
  console.log("  Seller: harsh.seller@carscout.dev / password123");
  console.log("  Buyer:  neha.buyer@carscout.dev / password123");
  console.log("  Buyer:  karan.buyer@carscout.dev / password123");
  console.log("  Admin:  admin@carscout.dev / password123");
};

seed()
  .catch((err) => {
    console.error(`Seed failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
