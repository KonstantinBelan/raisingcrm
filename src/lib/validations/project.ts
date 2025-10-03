import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200, 'Название слишком длинное'),
  description: z.string().max(2000, 'Описание слишком длинное').optional(),
  budget: z.number().positive('Бюджет должен быть положительным').optional(),
  currency: z.string().length(3, 'Валюта должна быть из 3 символов').default('RUB'),
  startDate: z.string().datetime('Неверный формат даты').optional(),
  endDate: z.string().datetime('Неверный формат даты').optional(),
  deadline: z.string().datetime('Неверный формат даты').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
  clientId: z.string().cuid('Неверный ID клиента').optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
