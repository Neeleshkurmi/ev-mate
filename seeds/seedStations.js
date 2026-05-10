const prisma = require("../config/prisma");

const dummyStations = [
  {
    name: "VoltHub Connaught Place",
    address: "Block A, Connaught Place, New Delhi",
    latitude: 28.6315,
    longitude: 77.2167,
    chargerType: "DC Fast",
    totalSlots: 12,
    availableSlots: 5,
    pricePerKwh: 17.5,
  },
  {
    name: "GreenCharge Koramangala",
    address: "5th Block, Koramangala, Bengaluru",
    latitude: 12.9352,
    longitude: 77.6245,
    chargerType: "Type 2",
    totalSlots: 8,
    availableSlots: 2,
    pricePerKwh: 15,
  },
  {
    name: "ChargePoint Bandra West",
    address: "Linking Road, Bandra West, Mumbai",
    latitude: 19.0607,
    longitude: 72.8362,
    chargerType: "CCS2",
    totalSlots: 10,
    availableSlots: 7,
    pricePerKwh: 18,
  },
  {
    name: "SparkEV Jubilee Hills",
    address: "Road No. 45, Jubilee Hills, Hyderabad",
    latitude: 17.433,
    longitude: 78.407,
    chargerType: "CHAdeMO",
    totalSlots: 6,
    availableSlots: 1,
    pricePerKwh: 16.5,
  },
  {
    name: "E-Motion T Nagar",
    address: "Usman Road, T Nagar, Chennai",
    latitude: 13.0418,
    longitude: 80.2341,
    chargerType: "AC Fast",
    totalSlots: 9,
    availableSlots: 4,
    pricePerKwh: 14.2,
  },
  {
    name: "PowerGrid Viman Nagar",
    address: "Viman Nagar Junction, Pune",
    latitude: 18.5679,
    longitude: 73.9143,
    chargerType: "DC Fast",
    totalSlots: 14,
    availableSlots: 9,
    pricePerKwh: 17.8,
  },
  {
    name: "UrbanCharge SG Highway",
    address: "Sarkhej-Gandhinagar Highway, Ahmedabad",
    latitude: 23.047,
    longitude: 72.515,
    chargerType: "Type 2",
    totalSlots: 7,
    availableSlots: 0,
    pricePerKwh: 13.9,
  },
  {
    name: "RapidEV Salt Lake",
    address: "Sector V, Salt Lake, Kolkata",
    latitude: 22.5726,
    longitude: 88.433,
    chargerType: "CCS2",
    totalSlots: 11,
    availableSlots: 6,
    pricePerKwh: 16.8,
  },
  {
    name: "ElectraCharge Bani Park",
    address: "Bani Park, Jaipur",
    latitude: 26.9221,
    longitude: 75.802,
    chargerType: "AC Fast",
    totalSlots: 5,
    availableSlots: 3,
    pricePerKwh: 14.8,
  },
  {
    name: "ChargeNest Hazratganj",
    address: "Hazratganj Market, Lucknow",
    latitude: 26.8467,
    longitude: 80.9462,
    chargerType: "CHAdeMO",
    totalSlots: 10,
    availableSlots: 8,
    pricePerKwh: 15.6,
  },
];

const seedStations = async () => {
  try {
    await prisma.$connect();
    await prisma.station.deleteMany();
    await prisma.station.createMany({
      data: dummyStations,
    });

    console.log("Successfully seeded 10 EV charging stations.");
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Station seeding failed:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seedStations();
