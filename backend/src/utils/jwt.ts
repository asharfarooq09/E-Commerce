import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../../generated/prisma/client";

export type AuthTokenPayload = {
  userId: string;
  role: Role;
};

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_MAX_AGE });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

export const authCookieName = "shopai_token";
export const authCookieMaxAgeMs = TOKEN_MAX_AGE * 1000;
