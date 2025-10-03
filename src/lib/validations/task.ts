import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200, 'Название слишком длинное'),
  description: z.string().max(2000, 'Описание слишком длинное').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedHours: z.number().positive('Количество часов должно быть положительным').optional(),
  actualHours: z.number().nonnegative('Количество часов не может быть отрицательным').optional(),
  deadline: z.string().datetime('Неверный формат даты').optional(),
  dueDate: z.string().datetime('Неверный формат даты').optional(),
  source: z.enum(['MANUAL', 'TELEGRAM', 'AI_GENERATED']).default('MANUAL'),
  projectId: z.string().cuid('Неверный ID проекта').optional(),
  parentTaskId: z.string().cuid('Неверный ID родительской задачи').optional(),
  telegramChatId: z.string().optional(),
  telegramMessageId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createTimeSessionSchema = z.object({
  startTime: z.string().datetime('Неверный формат даты'),
  endTime: z.string().datetime('Неверный формат даты'),
  duration: z.number().positive('Продолжительность должна быть положительной'),
  comment: z.string().max(500, 'Комментарий слишком длинный').optional(),
  taskId: z.string().cuid('Неверный ID задачи'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTimeSessionInput = z.infer<typeof createTimeSessionSchema>;
