import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import routes from "./routes";
import { connectDB } from "./config/connectDB";

dotenv.config();

const app = express();
// CORS: allow multiple origins via CLIENT_URLS (comma-separated) or single via CLIENT_URL
const allowed = process.env.CLIENT_URLS || process.env.CLIENT_URL || "*";
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser or same-origin
    if (allowed === "*") return callback(null, true);
    const list = allowed.split(",").map((s) => s.trim());
    if (list.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};
app.use(cors(corsOptions));
// Helmet with CSP that allows embedding from configured origins
const frameAncestors =
  allowed === "*"
    ? ["'self'"]
    : ["'self'", ...allowed.split(",").map((s) => s.trim())];
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", ...frameAncestors.filter((o) => o !== "'self'")],
        frameAncestors,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  const uri = process.env.MONGO_URI as string;
  await connectDB(uri);
});
