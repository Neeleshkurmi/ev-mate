const { execSync } = require("child_process");

const runMigrations = async () => {
  try {
    console.log("Running Prisma migrations...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✓ Prisma migrations completed successfully");
  } catch (error) {
    console.error("✗ Prisma migration failed:", error.message);
    throw new Error("Failed to run Prisma migrations");
  }
};

module.exports = runMigrations;
