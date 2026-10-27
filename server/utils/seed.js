/**
 * Seeds the database with demo accounts so the app can be explored
 * immediately without manually registering every role.
 * Run with: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const InterpreterProfile = require("../models/InterpreterProfile");

const DEMO_PASSWORD = "Demo@1234";

async function seed() {
  await connectDB();

  console.log("🧹 Clearing existing demo data...");
  await User.deleteMany({});
  await DoctorProfile.deleteMany({});
  await InterpreterProfile.deleteMany({});

  console.log("👤 Creating patients...");
  const patient1 = await User.create({
    name: "Arun Kumar",
    email: "patient@medibridge.demo",
    password: DEMO_PASSWORD,
    role: "patient",
    preferredLanguage: "ta",
  });

  console.log("🩺 Creating doctors...");
  const doctorUser1 = await User.create({
    name: "Dr. Priya Sharma",
    email: "doctor@medibridge.demo",
    password: DEMO_PASSWORD,
    role: "doctor",
    preferredLanguage: "en",
  });
  await DoctorProfile.create({
    user: doctorUser1._id,
    specialization: "General Physician",
    qualifications: "MBBS, MD (Internal Medicine)",
    experience: 9,
    languages: ["en", "hi"],
    bio: "Dr. Priya focuses on preventive care and chronic disease management, with a special interest in serving multilingual patient communities.",
    consultationFee: 500,
    availability: [
      { day: "Mon", slots: ["09:00", "09:30", "10:00", "10:30", "11:00"] },
      { day: "Wed", slots: ["14:00", "14:30", "15:00", "15:30"] },
      { day: "Fri", slots: ["09:00", "09:30", "10:00"] },
    ],
  });

  const doctorUser2 = await User.create({
    name: "Dr. Karthik Raghavan",
    email: "doctor2@medibridge.demo",
    password: DEMO_PASSWORD,
    role: "doctor",
    preferredLanguage: "ta",
  });
  await DoctorProfile.create({
    user: doctorUser2._id,
    specialization: "Pediatrics",
    qualifications: "MBBS, DCH",
    experience: 12,
    languages: ["en", "ta"],
    bio: "Dr. Karthik has spent over a decade caring for children and works closely with interpreters to support Tamil-speaking families.",
    consultationFee: 600,
    availability: [
      { day: "Tue", slots: ["10:00", "10:30", "11:00"] },
      { day: "Thu", slots: ["16:00", "16:30", "17:00", "17:30"] },
    ],
  });

  const doctorUser3 = await User.create({
    name: "Dr. Meera Nair",
    email: "doctor3@medibridge.demo",
    password: DEMO_PASSWORD,
    role: "doctor",
    preferredLanguage: "en",
  });
  await DoctorProfile.create({
    user: doctorUser3._id,
    specialization: "Dermatology",
    qualifications: "MBBS, MD (Dermatology)",
    experience: 6,
    languages: ["en", "hi", "ta"],
    bio: "Dr. Meera specializes in skin, hair, and nail conditions and is fluent in three languages to better serve diverse patients.",
    consultationFee: 700,
    availability: [
      { day: "Mon", slots: ["15:00", "15:30", "16:00"] },
      { day: "Fri", slots: ["11:00", "11:30", "12:00"] },
    ],
  });

  console.log("🗣️  Creating interpreters...");
  const interpreterUser1 = await User.create({
    name: "Lakshmi Venkatesh",
    email: "interpreter@medibridge.demo",
    password: DEMO_PASSWORD,
    role: "interpreter",
    preferredLanguage: "ta",
  });
  await InterpreterProfile.create({
    user: interpreterUser1._id,
    languages: ["en", "ta"],
    experience: 5,
    bio: "Certified medical interpreter specializing in Tamil-English consultations.",
    isAvailable: true,
  });

  const interpreterUser2 = await User.create({
    name: "Rohit Mehta",
    email: "interpreter2@medibridge.demo",
    password: DEMO_PASSWORD,
    role: "interpreter",
    preferredLanguage: "hi",
  });
  await InterpreterProfile.create({
    user: interpreterUser2._id,
    languages: ["en", "hi"],
    experience: 3,
    bio: "Healthcare interpreter supporting Hindi-speaking patients across specialties.",
    isAvailable: false,
  });

  console.log("\n✅ Seed complete! Demo accounts (all use password: " + DEMO_PASSWORD + "):");
  console.log("   Patient:      patient@medibridge.demo");
  console.log("   Doctor:       doctor@medibridge.demo   (General Physician, en/hi)");
  console.log("   Doctor:       doctor2@medibridge.demo  (Pediatrics, en/ta)");
  console.log("   Doctor:       doctor3@medibridge.demo  (Dermatology, en/hi/ta)");
  console.log("   Interpreter:  interpreter@medibridge.demo  (en/ta, available)");
  console.log("   Interpreter:  interpreter2@medibridge.demo (en/hi, unavailable)\n");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
