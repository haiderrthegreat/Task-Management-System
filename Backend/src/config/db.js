const { PrismaClient } = require("@prisma/client");
const env = require("./env");

const prisma = new PrismaClient({
  log: env.isDev ? ["query", "info", "warn", "error"] : ["error"],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log(" PostgreSQL is connected via Prisma ✅");
  } catch (error) {
    console.error(" Database connection failed: ❌", error.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
