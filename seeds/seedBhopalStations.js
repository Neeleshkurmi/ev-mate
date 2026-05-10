const prisma = require("../config/prisma");

const bhopalStations = [
  {
    name: "Bhopal EV Hub MP Nagar",
    address: "Zone II, MP Nagar, Bhopal, Madhya Pradesh",
    latitude: 23.2334,
    longitude: 77.4347,
    chargerType: "DC Fast",
    totalSlots: 10,
    availableSlots: 6,
    pricePerKwh: 16.2,
  },
  {
    name: "LakeCity Charge Station",
    address: "Upper Lake Road, Bhopal, Madhya Pradesh",
    latitude: 23.2599,
    longitude: 77.4126,
    chargerType: "CCS2",
    totalSlots: 8,
    availableSlots: 4,
    pricePerKwh: 15.8,
  },
  {
    name: "Habibganj RapidCharge",
    address: "Rani Kamlapati Railway Station, Bhopal, Madhya Pradesh",
    latitude: 23.2215,
    longitude: 77.4419,
    chargerType: "DC Fast",
    totalSlots: 12,
    availableSlots: 7,
    pricePerKwh: 17.1,
  },
  {
    name: "New Market EV Point",
    address: "New Market, TT Nagar, Bhopal, Madhya Pradesh",
    latitude: 23.2337,
    longitude: 77.4011,
    chargerType: "Type 2",
    totalSlots: 6,
    availableSlots: 3,
    pricePerKwh: 14.9,
  },
  {
    name: "DB City Mall ChargeZone",
    address: "DB City Mall, Arera Hills, Bhopal, Madhya Pradesh",
    latitude: 23.2321,
    longitude: 77.4295,
    chargerType: "CCS2",
    totalSlots: 9,
    availableSlots: 5,
    pricePerKwh: 16.5,
  },
  {
    name: "Kolar Road GreenPlug",
    address: "Kolar Road, Bhopal, Madhya Pradesh",
    latitude: 23.1815,
    longitude: 77.418,
    chargerType: "AC Fast",
    totalSlots: 7,
    availableSlots: 2,
    pricePerKwh: 13.8,
  },
  {
    name: "Ayodhya Bypass EV Station",
    address: "Ayodhya Bypass Road, Bhopal, Madhya Pradesh",
    latitude: 23.2786,
    longitude: 77.4644,
    chargerType: "DC Fast",
    totalSlots: 10,
    availableSlots: 8,
    pricePerKwh: 16.9,
  },
  {
    name: "Bairagarh ChargePoint",
    address: "Bairagarh, Sant Hirdaram Nagar, Bhopal, Madhya Pradesh",
    latitude: 23.2878,
    longitude: 77.3379,
    chargerType: "Type 2",
    totalSlots: 6,
    availableSlots: 4,
    pricePerKwh: 14.2,
  },
  {
    name: "BHEL SmartCharge",
    address: "BHEL Township, Bhopal, Madhya Pradesh",
    latitude: 23.2474,
    longitude: 77.5024,
    chargerType: "CHAdeMO",
    totalSlots: 8,
    availableSlots: 3,
    pricePerKwh: 15.4,
  },
  {
    name: "Airport Road EV FastCharge",
    address: "Airport Road, Bhopal, Madhya Pradesh",
    latitude: 23.2872,
    longitude: 77.3498,
    chargerType: "CCS2",
    totalSlots: 11,
    availableSlots: 6,
    pricePerKwh: 17.3,
  },
];

const seedBhopalStations = async () => {
  const results = await prisma.$transaction(async (tx) => {
    const seededStations = [];

    for (const station of bhopalStations) {
      const existingStation = await tx.station.findFirst({
        where: { name: station.name },
        select: { id: true },
      });

      const seededStation = existingStation
        ? await tx.station.update({
            where: { id: existingStation.id },
            data: station,
          })
        : await tx.station.create({ data: station });

      seededStations.push(seededStation);
    }

    return seededStations;
  });

  console.log(`Seeded ${results.length} Bhopal EV charging stations.`);
  return results;
};

if (require.main === module) {
  seedBhopalStations()
    .catch((error) => {
      console.error("Bhopal station seeding failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  bhopalStations,
  seedBhopalStations,
};
