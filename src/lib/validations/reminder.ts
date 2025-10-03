import { z } from 'zod';

export const createReminderSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен').max(200, 'Заголовок слишком длинный'),
  message: z.string().min(1, 'Сообщение обязательно').max(1000, 'Сообщение слишком длинное'),
  scheduledAt: z.string().datetime('Неверный формат даты'),
  projectId: z.string().cuid('Неверный ID проекта').optional(),
  taskId: z.string().cuid('Неверный ID задачи').optional(),
});

export const updateReminderSchema = createReminderSchema.partial();

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
