const prisma = require("../config/prisma");

const madhyaPradeshStations = [
  {
    name: "Bhopal EV Hub MP Nagar",
    address: "Zone II, MP Nagar, Bhopal, Madhya Pradesh",
    latitude: 23.2334,
    longitude: 77.4347,
    chargerType: "DC Fast",
    totalSlots: 10,
    pricePerKwh: 16.2,
  },
  {
    name: "LakeCity Charge Station",
    address: "Upper Lake Road, Bhopal, Madhya Pradesh",
    latitude: 23.2599,
    longitude: 77.4126,
    chargerType: "CCS2",
    totalSlots: 8,
    pricePerKwh: 15.8,
  },
  {
    name: "Habibganj RapidCharge",
    address: "Rani Kamlapati Railway Station, Bhopal, Madhya Pradesh",
    latitude: 23.2215,
    longitude: 77.4419,
    chargerType: "DC Fast",
    totalSlots: 12,
    pricePerKwh: 17.1,
  },
  {
    name: "New Market EV Point",
    address: "New Market, TT Nagar, Bhopal, Madhya Pradesh",
    latitude: 23.2337,
    longitude: 77.4011,
    chargerType: "Type 2",
    totalSlots: 6,
    pricePerKwh: 14.9,
  },
  {
    name: "DB City Mall ChargeZone",
    address: "DB City Mall, Arera Hills, Bhopal, Madhya Pradesh",
    latitude: 23.2321,
    longitude: 77.4295,
    chargerType: "CCS2",
    totalSlots: 9,
    pricePerKwh: 16.5,
  },
  {
    name: "Kolar Road GreenPlug",
    address: "Kolar Road, Bhopal, Madhya Pradesh",
    latitude: 23.1815,
    longitude: 77.418,
    chargerType: "AC Fast",
    totalSlots: 7,
    pricePerKwh: 13.8,
  },
  {
    name: "Ayodhya Bypass EV Station",
    address: "Ayodhya Bypass Road, Bhopal, Madhya Pradesh",
    latitude: 23.2786,
    longitude: 77.4644,
    chargerType: "DC Fast",
    totalSlots: 10,
    pricePerKwh: 16.9,
  },
  {
    name: "Bairagarh ChargePoint",
    address: "Bairagarh, Sant Hirdaram Nagar, Bhopal, Madhya Pradesh",
    latitude: 23.2878,
    longitude: 77.3379,
    chargerType: "Type 2",
    totalSlots: 6,
    pricePerKwh: 14.2,
  },
  {
    name: "BHEL SmartCharge",
    address: "BHEL Township, Bhopal, Madhya Pradesh",
    latitude: 23.2474,
    longitude: 77.5024,
    chargerType: "CHAdeMO",
    totalSlots: 8,
    pricePerKwh: 15.4,
  },
  {
    name: "Airport Road EV FastCharge",
    address: "Airport Road, Bhopal, Madhya Pradesh",
    latitude: 23.2872,
    longitude: 77.3498,
    chargerType: "CCS2",
    totalSlots: 11,
    pricePerKwh: 17.3,
  },
  {
    name: "Indore RapidCharge Vijay Nagar",
    address: "Vijay Nagar Square, Indore, Madhya Pradesh",
    latitude: 22.7533,
    longitude: 75.8937,
    chargerType: "DC Fast",
    totalSlots: 12,
    pricePerKwh: 17,
  },
  {
    name: "Indore EV Plug Palasia",
    address: "Old Palasia, Indore, Madhya Pradesh",
    latitude: 22.7244,
    longitude: 75.8839,
    chargerType: "CCS2",
    totalSlots: 9,
    pricePerKwh: 16.6,
  },
  {
    name: "Vidisha ChargeHub",
    address: "Civil Lines, Vidisha, Madhya Pradesh",
    latitude: 23.5236,
    longitude: 77.8139,
    chargerType: "Type 2",
    totalSlots: 7,
    pricePerKwh: 14.7,
  },
  {
    name: "Vidisha Railway EV Point",
    address: "Railway Station Road, Vidisha, Madhya Pradesh",
    latitude: 23.5271,
    longitude: 77.8081,
    chargerType: "AC Fast",
    totalSlots: 6,
    pricePerKwh: 13.9,
  },
  {
    name: "Ujjain Green Plug Freeganj",
    address: "Freeganj, Ujjain, Madhya Pradesh",
    latitude: 23.1765,
    longitude: 75.7885,
    chargerType: "Type 2",
    totalSlots: 6,
    pricePerKwh: 14.5,
  },
  {
    name: "Mahakal EV FastCharge",
    address: "Mahakaleshwar Temple Corridor, Ujjain, Madhya Pradesh",
    latitude: 23.1828,
    longitude: 75.7682,
    chargerType: "CCS2",
    totalSlots: 8,
    pricePerKwh: 16.1,
  },
  {
    name: "Jabalpur Civic Center ChargeZone",
    address: "Civic Center, Jabalpur, Madhya Pradesh",
    latitude: 23.1686,
    longitude: 79.9339,
    chargerType: "DC Fast",
    totalSlots: 10,
    pricePerKwh: 16.8,
  },
  {
    name: "Jabalpur Napier Town EV Point",
    address: "Napier Town, Jabalpur, Madhya Pradesh",
    latitude: 23.1609,
    longitude: 79.9499,
    chargerType: "CHAdeMO",
    totalSlots: 7,
    pricePerKwh: 15.6,
  },
  {
    name: "Gwalior City Center EV Hub",
    address: "City Center, Gwalior, Madhya Pradesh",
    latitude: 26.2183,
    longitude: 78.1828,
    chargerType: "CCS2",
    totalSlots: 10,
    pricePerKwh: 16.4,
  },
  {
    name: "Gwalior Railway RapidCharge",
    address: "Railway Station Road, Gwalior, Madhya Pradesh",
    latitude: 26.2144,
    longitude: 78.1827,
    chargerType: "DC Fast",
    totalSlots: 12,
    pricePerKwh: 17.2,
  },
  {
    name: "Sagar SmartCharge Civil Lines",
    address: "Civil Lines, Sagar, Madhya Pradesh",
    latitude: 23.8388,
    longitude: 78.7378,
    chargerType: "Type 2",
    totalSlots: 8,
    pricePerKwh: 14.8,
  },
  {
    name: "Sagar Bus Stand EV Station",
    address: "Main Bus Stand, Sagar, Madhya Pradesh",
    latitude: 23.8315,
    longitude: 78.746,
    chargerType: "AC Fast",
    totalSlots: 6,
    pricePerKwh: 13.7,
  },
  {
    name: "Dewas Industrial EV Point",
    address: "Industrial Area, Dewas, Madhya Pradesh",
    latitude: 22.9676,
    longitude: 76.0534,
    chargerType: "DC Fast",
    totalSlots: 9,
    pricePerKwh: 16.3,
  },
  {
    name: "Dewas AB Road ChargeHub",
    address: "AB Road, Dewas, Madhya Pradesh",
    latitude: 22.9623,
    longitude: 76.0508,
    chargerType: "CCS2",
    totalSlots: 8,
    pricePerKwh: 15.9,
  },
  {
    name: "Sehore Highway EV Station",
    address: "Bhopal-Indore Highway, Sehore, Madhya Pradesh",
    latitude: 23.2032,
    longitude: 77.0844,
    chargerType: "DC Fast",
    totalSlots: 10,
    pricePerKwh: 16.7,
  },
  {
    name: "Sehore Town GreenCharge",
    address: "Englishpura, Sehore, Madhya Pradesh",
    latitude: 23.2002,
    longitude: 77.087,
    chargerType: "Type 2",
    totalSlots: 6,
    pricePerKwh: 14.4,
  },
  {
    name: "Narmadapuram Riverfront EV Hub",
    address: "Sethani Ghat Road, Narmadapuram, Madhya Pradesh",
    latitude: 22.7441,
    longitude: 77.7369,
    chargerType: "CCS2",
    totalSlots: 8,
    pricePerKwh: 15.7,
  },
  {
    name: "Narmadapuram Railway ChargePoint",
    address: "Railway Station Road, Narmadapuram, Madhya Pradesh",
    latitude: 22.7523,
    longitude: 77.7225,
    chargerType: "AC Fast",
    totalSlots: 6,
    pricePerKwh: 14.1,
  },
  {
    name: "Raisen Fort Road EV Point",
    address: "Fort Road, Raisen, Madhya Pradesh",
    latitude: 23.3318,
    longitude: 77.7811,
    chargerType: "Type 2",
    totalSlots: 6,
    pricePerKwh: 14.3,
  },
  {
    name: "Raisen Bhopal Road ChargeHub",
    address: "Bhopal Road, Raisen, Madhya Pradesh",
    latitude: 23.3292,
    longitude: 77.7931,
    chargerType: "CCS2",
    totalSlots: 7,
    pricePerKwh: 15.2,
  },
  {
    name: "Satna Rewa Road RapidCharge",
    address: "Rewa Road, Satna, Madhya Pradesh",
    latitude: 24.6005,
    longitude: 80.8322,
    chargerType: "DC Fast",
    totalSlots: 10,
    pricePerKwh: 16.6,
  },
  {
    name: "Satna Civil Lines EV Station",
    address: "Civil Lines, Satna, Madhya Pradesh",
    latitude: 24.5797,
    longitude: 80.8329,
    chargerType: "CHAdeMO",
    totalSlots: 7,
    pricePerKwh: 15.5,
  },
];

const seedBhopalStations = async () => {
  const results = await prisma.$transaction(async (tx) => {
    const seededStations = [];

    for (const station of madhyaPradeshStations) {
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

  console.log(`Seeded ${results.length} Madhya Pradesh EV charging stations.`);
  return results;
};

if (require.main === module) {
  seedBhopalStations()
    .catch((error) => {
      console.error("Madhya Pradesh station seeding failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  bhopalStations: madhyaPradeshStations,
  madhyaPradeshStations,
  seedBhopalStations,
};
