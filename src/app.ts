import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import routes from "./routes";
import { connectDB } from "./config/connectDB";

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
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
