const dotenv = require("dotenv");
dotenv.config();

const requiredEnvVars = [
  "DATABASE_URL",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
};

module.exports = env;