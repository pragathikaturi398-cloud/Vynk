import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://vynk_user:vynk_password@localhost:5432/vynk_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'vynk_jwt_default_secret_key_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'vynk_jwt_refresh_default_secret_key_2026',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
