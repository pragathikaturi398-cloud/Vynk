import { z } from 'zod';
import { Role } from '../../types';

export const RegisterDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).default(Role.STUDENT),
  phone: z.string().optional(),
  roomId: z.string().optional(), // For student automatic room allocation during registration
});

export const LoginDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
