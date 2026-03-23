import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";

const rootRouter = Router();

rootRouter.use("/auth", authRoutes);
rootRouter.use("/users", userRoutes);

export default rootRouter;