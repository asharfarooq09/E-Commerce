# ShopAI

ShopAI is a monorepo e-commerce foundation for a future AI-powered shopping experience.

## Architecture

```text
ShopAI
├── frontend/   Next.js + TypeScript + Tailwind
├── backend/    Node.js + Express + Prisma
└── PostgreSQL
```

## Phase 1 features

- Customer storefront: home, product listing, filters, product details, cart, wishlist, checkout, orders, reviews
- Authentication: register, login, logout, customer/admin roles
- Admin shell: dashboard, products, categories, orders, customers, inventory

## Prerequisites

- Node.js 20+
- PostgreSQL (choose one):
  - Docker Desktop: `npm run db:up`
  - Prisma local dev server: `npx prisma dev` in `backend/`
  - Railway or any hosted PostgreSQL connection string

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL and set `DATABASE_URL` in `backend/.env`.

If you use `npx prisma dev`, copy the printed `DATABASE_URL` into `backend/.env`.

3. Configure frontend env:

- Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `frontend/.env.local`

4. Generate schema and seed data:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Run the app:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Demo accounts

After seeding:

- Admin: `admin@shopai.local` / `Admin123!@#`
- Customer: `customer@shopai.local` / `Customer123!`
