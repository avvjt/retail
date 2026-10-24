import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const BROKER_ENC_KEY = process.env.BROKER_ENC_KEY;
const APP_URL = process.env.APP_URL;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (!JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}
if (!REFRESH_SECRET) {
  throw new Error("Missing required environment variable: REFRESH_SECRET");
}
if (!ADMIN_PASSWORD) {
  throw new Error("Missing required environment variable: ADMIN_PASSWORD");
}

export {
  JWT_SECRET,
  REFRESH_SECRET,
  ADMIN_PASSWORD,
  ADMIN_EMAIL,
  BROKER_ENC_KEY,
  APP_URL,
  PORT,
};
