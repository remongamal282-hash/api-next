# api-next

Next.js + Prisma + MySQL implementation matching the Laravel behavior/routes for `prodects`.

## Requirements

- Node.js 20+
- MySQL 8+

## Environment

Copy `.env.example` to `.env` and set values:

```bash
DATABASE_URL="mysql://root:password@localhost:3306/api_next"
ADMIN_API_KEY="change-me-admin-key"
SESSION_SECRET="change-me-at-least-32-characters-long"
APP_URL="http://localhost:3000"
```

## Install

```bash
npm install
```

## Migrate

```bash
npm run prisma:migrate
```

## Seed

```bash
npm run db:seed
```

## Run

```bash
npm run dev
```
