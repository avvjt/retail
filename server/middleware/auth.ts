import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { subscriptions } from "../schema";
import { eq } from "drizzle-orm";
import { JWT_SECRET } from "../config";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    isAdmin?: boolean;
  };
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token missing or malformed" });
  }

  const token = authHeader.substring(7); // Extract token after "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: number; email: string; isAdmin?: boolean };
    (req as AuthenticatedRequest).user = {
      userId: Number(decoded.userId),
      email: decoded.email,
      isAdmin: decoded.isAdmin,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired access token. Please log in again." });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: number; email: string; isAdmin?: boolean };
    (req as AuthenticatedRequest).user = {
      userId: Number(decoded.userId),
      email: decoded.email,
      isAdmin: decoded.isAdmin,
    };
  } catch (error) {
    // Non-fatal for optional auth
  }
  next();
}

export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  return next();
}
