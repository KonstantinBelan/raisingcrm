import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1, 'TELEGRAM_WEBHOOK_SECRET is required'),

  // OpenRouter AI (optional)
  OPENROUTER_API_KEY: z.string().optional(),

  // Auth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Optional
  USE_MOCK_AUTH: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach((err: z.ZodIssue) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('⚠️  Running in development mode with invalid env vars');
        // В разработке возвращаем частично валидные данные
        return {
          DATABASE_URL: process.env.DATABASE_URL || '',
          TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
          TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || '',
          OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-must-be-changed-in-production',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
          PORT: process.env.PORT || '3000',
          USE_MOCK_AUTH: process.env.USE_MOCK_AUTH,
          REDIS_URL: process.env.REDIS_URL,
          SENTRY_DSN: process.env.SENTRY_DSN,
        };
      }
    }
    throw error;
  }
}

export const env = validateEnv();
