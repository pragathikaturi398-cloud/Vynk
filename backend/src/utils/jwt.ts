import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as TokenPayload;
}
