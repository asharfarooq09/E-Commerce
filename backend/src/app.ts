import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import cartRoutes from "./routes/cart.routes";
import catalogRoutes from "./routes/catalog.routes";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/product.routes";
import reviewRoutes from "./routes/review.routes";
import wishlistRoutes from "./routes/wishlist.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "shopai-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/catalog", catalogRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/reviews", reviewRoutes);

  // Index only — admin data lives on nested routes (browser GET /api/admin alone is not a resource).
  app.get("/api/admin", (_req, res) => {
    res.json({
      service: "ShopAI Admin API",
      message: "Use the paths below. Admin role and authentication are required for all of them.",
      ui: `${env.CLIENT_URL}/admin`,
      endpoints: [
        "GET /api/admin/dashboard",
        "GET|POST /api/admin/products",
        "PATCH|DELETE /api/admin/products/:id",
        "GET|POST /api/admin/categories",
        "GET /api/admin/orders",
        "PATCH /api/admin/orders/:id/status",
        "GET /api/admin/customers",
        "GET /api/admin/inventory",
        "PATCH /api/admin/inventory/:productId",
      ],
      auth: {
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        note: "Send session cookie (shopai_token) or Authorization: Bearer <token>. Logging in on localhost:3000 sets the cookie for API calls via the Next.js proxy.",
      },
    });
  });

  app.use("/api/admin", adminRoutes);

  app.use(errorHandler);
  return app;
}
