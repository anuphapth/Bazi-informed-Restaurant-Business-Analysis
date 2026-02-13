import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import { readdirSync } from "fs";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import cors from 'cors'

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = process.env.ALLOW_URL
  ? process.env.ALLOW_URL.split(",")
  : [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("combined"));

// API routes
const routeFiles = readdirSync("./routes");
for (const r of routeFiles) {
  const router = await import(`./routes/${r}`);
  app.use("/api", router.default);
}

// serve React
app.use(express.static(path.join(__dirname, "public")));

// React router fallback (Express 5+)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

export default app;
