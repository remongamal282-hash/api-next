import { env } from "@/lib/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const configuredLevel = (env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[configuredLevel];
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const payload = meta ? { ...meta } : undefined;
  const line = payload ? `${message} ${JSON.stringify(payload)}` : message;
  switch (level) {
    case "debug":
      console.debug(line);
      break;
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
  }
}

