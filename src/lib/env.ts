import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_API_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  APP_URL: z.string().min(1)
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  ADMIN_API_KEY: process.env.ADMIN_API_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;
