import { z } from 'zod';
import { Role } from '../../types';

export const RegisterDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).default(Role.STUDENT),
  phone: z.string().optional(),
  roomId: z.string().optional(),
});

export const StudentSignUpDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const StudentOnboardingDto = z.object({
  name: z.string().min(1, 'Name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  hostelName: z.string().min(1, 'Hostel name is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
});

export const SetPasswordDto = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const LoginDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
