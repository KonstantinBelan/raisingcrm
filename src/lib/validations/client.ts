import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(200, 'Имя слишком длинное'),
  email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  phone: z.string().max(50, 'Телефон слишком длинный').optional(),
  company: z.string().max(200, 'Название компании слишком длинное').optional(),
  notes: z.string().max(2000, 'Заметки слишком длинные').optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
