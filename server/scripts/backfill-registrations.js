require("dotenv").config();
const mongoose = require("mongoose");
const Car = require("../models/Car");

const stateCodes = {
  Maharashtra: "MH",
  Karnataka: "KA",
  Gujarat: "GJ",
  Delhi: "DL",
  Rajasthan: "RJ",
  "Tamil Nadu": "TN",
  Telangana: "TS",
  Kerala: "KL",
};

const buildRegistrationNumber = (state, index) => {
  const prefix = stateCodes[state] || "DL";
  const district = String((index % 20) + 1).padStart(2, "0");
  const series = String.fromCharCode(65 + (index % 26)) + String.fromCharCode(65 + ((index + 11) % 26));
  const number = String(3001 + index).padStart(4, "0");
  return `${prefix}${district}${series}${number}`;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to backfill registration numbers.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const cars = await Car.find({
    $or: [{ registrationNumber: { $exists: false } }, { registrationNumber: "" }, { registrationNumber: null }],
  }).sort({ createdAt: 1 });

  let updated = 0;
  for (let index = 0; index < cars.length; index += 1) {
    const car = cars[index];
    car.registrationNumber = buildRegistrationNumber(car.state, index);
    await car.save();
    updated += 1;
  }

  console.log(JSON.stringify({ updated }, null, 2));
};

run()
  .catch((error) => {
    console.error(`Registration backfill failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
