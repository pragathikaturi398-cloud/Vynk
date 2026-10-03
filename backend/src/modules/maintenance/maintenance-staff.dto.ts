import { z } from 'zod';

export const CreateMaintenanceStaffDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  team_id: z.string().uuid('Valid team ID is required'),
  phone: z.string().optional(),
});

export const UpdateMaintenanceStaffDto = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  team_id: z.string().uuid().optional().nullable(),
});

export const ToggleStaffStatusDto = z.object({
  is_active: z.boolean(),
});

export const ResetStaffPasswordDto = z.object({
  temporary_password: z.string().min(6, 'Temporary password must be at least 6 characters'),
});

export type CreateMaintenanceStaffInput = z.infer<typeof CreateMaintenanceStaffDto>;
export type UpdateMaintenanceStaffInput = z.infer<typeof UpdateMaintenanceStaffDto>;
export type ToggleStaffStatusInput = z.infer<typeof ToggleStaffStatusDto>;
export type ResetStaffPasswordInput = z.infer<typeof ResetStaffPasswordDto>;
