import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "express-async-errors";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import facultyRoutes from "./routes/faculty.routes";
import availabilityRoutes from "./routes/availability.routes";
import appointmentsRoutes from "./routes/appointments.routes";
import followsRoutes from "./routes/follows.routes";
import notificationsRoutes from "./routes/notifications.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { CORS_ORIGIN, NODE_ENV } from "./config/env";

const app = express();

app.use(helmet());
app.use(morgan(NODE_ENV === "development" ? "dev" : "combined"));
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ success: true, data: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/follows", followsRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(errorMiddleware);

export default app;
