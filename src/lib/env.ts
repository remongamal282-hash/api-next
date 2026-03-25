import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_API_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  APP_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().min(1),
  JWT_REFRESH_TTL: z.string().min(1),
  CORS_ALLOWED_ORIGINS: z.string().min(1),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/),
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/),
  LOG_LEVEL: z.string().optional()
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  ADMIN_API_KEY: process.env.ADMIN_API_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL,
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  LOG_LEVEL: process.env.LOG_LEVEL
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

const allowedOrigins = parsed.data.CORS_ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  ...parsed.data,
  CORS_ALLOWED_ORIGINS: allowedOrigins,
  RATE_LIMIT_WINDOW_MS: Number(parsed.data.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX: Number(parsed.data.RATE_LIMIT_MAX)
};
