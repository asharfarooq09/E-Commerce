import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { Role } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";
import {
  authCookieMaxAgeMs,
  authCookieName,
  signAuthToken,
} from "../utils/jwt";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setAuthCookie(res: import("express").Response, token: string) {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: authCookieMaxAgeMs,
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) {
      throw new AppError("Email is already registered", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: body.email.toLowerCase(),
        password: passwordHash,
        role: Role.CUSTOMER,
        cart: { create: {} },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = signAuthToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = signAuthToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(authCookieName);
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

export default router;
