const prisma = require("./prisma");

const connectDB = async () => {
  await prisma.$connect();
  console.log("PostgreSQL connected via Prisma");
};

module.exports = connectDB;
