import express from "express";
import cors from "cors";
import logger from "./middleware/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import notFoundHandler from "./middleware/404handler.js";

import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.json({ message: "Event Registration & Ticketing API" });
});

app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;