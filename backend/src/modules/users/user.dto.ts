import { z } from 'zod';
import { Role } from '../../types';

export const CreateUserDto = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must have at least 6 characters'),
  role: z.enum([Role.STUDENT, Role.MAINTENANCE, Role.WARDEN, Role.SUPERADMIN]),
  phone: z.string().optional(),
});

export const UpdateUserRoleDto = z.object({
  role: z.enum([Role.STUDENT, Role.MAINTENANCE, Role.WARDEN, Role.SUPERADMIN]),
  hostel_id: z.string().optional(),
});
