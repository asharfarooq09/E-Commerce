import type { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "./error-handler";
import { authCookieName, verifyAuthToken } from "../utils/jwt";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role: Role;
    email: string;
    name: string;
  };
};

function readToken(req: Request) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return req.cookies?.[authCookieName] as string | undefined;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = readToken(req);
    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, email: true, name: true },
    });

    if (!user) {
      throw new AppError("Invalid session", 401);
    }

    req.user = user;
    next();
  } catch {
    next(new AppError("Authentication required", 401));
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user || req.user.role !== Role.ADMIN) {
    return next(new AppError("Admin access required", 403));
  }
  next();
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = readToken(req);
    if (!token) {
      return next();
    }

    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, email: true, name: true },
    });

    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid tokens for optional auth.
  }
  next();
}
