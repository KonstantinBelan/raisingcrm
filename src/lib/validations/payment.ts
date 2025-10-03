import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().positive('Сумма должна быть положительной'),
  currency: z.string().length(3, 'Валюта должна быть из 3 символов').default('RUB'),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  description: z.string().max(500, 'Описание слишком длинное').optional(),
  dueDate: z.string().datetime('Неверный формат даты').optional(),
  paidDate: z.string().datetime('Неверный формат даты').optional(),
  projectId: z.string().cuid('Неверный ID проекта').optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
