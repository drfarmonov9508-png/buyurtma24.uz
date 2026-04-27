# Buyurtma24.uz — Restaurant Management SaaS Platform

Production-ready multi-tenant SaaS platform for restaurant and cafe management.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript + TypeORM |
| Database | PostgreSQL 15 |
| Frontend | Next.js 14 + TailwindCSS |
| Cache | Redis |
| Real-time | Socket.io |
| Auth | JWT + Passport |
| Container | Docker + Docker Compose |
| Proxy | Nginx |

## Subdomains

| Subdomain | Purpose |
|-----------|---------|
| `api.buyurtma24.uz` | REST API |
| `superadmin.buyurtma24.uz` | SuperAdmin Panel |
| `admin.buyurtma24.uz` | Cafe Admin Panel |
| `client.buyurtma24.uz` | Guest Ordering + QR Menu |

## Frontend Routes

| Route | Panel | Role |
|-------|-------|------|
| `/login` | Login | All |
| `/superadmin` | SuperAdmin Dashboard | SUPERADMIN |
| `/superadmin/tenants` | Tenant Management | SUPERADMIN |
| `/superadmin/subscriptions` | Subscription Plans | SUPERADMIN |
| `/admin` | Cafe Admin Dashboard | CAFE_ADMIN |
| `/admin/products` | Product/Menu Management | CAFE_ADMIN |
| `/admin/categories` | Category Management | CAFE_ADMIN |
| `/admin/tables` | Table Management + QR | CAFE_ADMIN |
| `/admin/orders` | Order Management | CAFE_ADMIN |
| `/admin/staff` | Staff Management | CAFE_ADMIN |
| `/admin/reports` | Sales & Analytics Reports | CAFE_ADMIN |
| `/admin/settings` | Cafe Settings | CAFE_ADMIN |
| `/cashier` | Point of Sale (POS) | CASHIER |
| `/waiter` | Table & Order Taking | WAITER |
| `/kitchen` | Kitchen Display System | KITCHEN |
| `/menu/[tenantId]` | Guest QR Menu & Ordering | Public |

## Quick Start (Development)

```bash
# 1. Clone and configure env
cp .env.example .env
# Edit .env with your values

# 2. Start all services
docker-compose up -d

# 3. Run migrations
docker-compose exec backend npm run migration:run

# 4. Seed initial data
docker-compose exec backend npm run seed

# 5. Access
# API:          http://localhost:3000
# Frontend:     http://localhost:3001
# SuperAdmin:   http://localhost:3001/superadmin
# Admin:        http://localhost:3001/admin
# Cashier:      http://localhost:3001/cashier
# Waiter:       http://localhost:3001/waiter
# Kitchen:      http://localhost:3001/kitchen
```

## Frontend Setup (without Docker)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev      # development  →  http://localhost:3001
npm run build    # production build
npm run start    # production server
```

## Roles

| Role | Panel | Description |
|------|-------|-------------|
| `SUPERADMIN` | `/superadmin` | Platform owner — manages all cafes & subscriptions |
| `CAFE_ADMIN` | `/admin` | Manages one cafe (menu, staff, tables, reports) |
| `CASHIER` | `/cashier` | POS — takes payments and closes orders |
| `WAITER` | `/waiter` | Table selection, order creation and additions |
| `KITCHEN` | `/kitchen` | Kitchen Display System — prep queue by status |
| `CLIENT` | `/menu/[id]` | Guest — QR scan menu ordering (no login) |

## Project Structure

```
buyurtma24.uz/
├── backend/                  # NestJS API server
│   ├── src/
│   │   ├── modules/          # auth, users, tenants, menu, orders, payments …
│   │   ├── entities/         # TypeORM entities
│   │   └── seeds/            # database seed data
│   └── Dockerfile
├── frontend/                 # Next.js 14 application
│   ├── src/
│   │   ├── app/              # App Router pages (admin, cashier, waiter, kitchen, menu …)
│   │   ├── components/       # Shared layout components
│   │   └── lib/              # API client, utils, auth store
│   └── Dockerfile
├── nginx/
│   └── nginx.conf            # Reverse proxy config
├── docker-compose.yml        # Development
├── docker-compose.prod.yml   # Production
└── .env.example
```

## Subscription Plans

| Plan | Users | Tables | Branches | Analytics | Inventory | QR Menu |
|------|-------|--------|----------|-----------|-----------|---------|
| Basic | 5 | 10 | 1 | Basic | ✗ | ✓ |
| Standard | 15 | 30 | 3 | Advanced | ✓ | ✓ |
| Premium | 50 | 100 | 10 | Full | ✓ | ✓ |
| Enterprise | Unlimited | Unlimited | Unlimited | Full | ✓ | ✓ |

## Production Deployment

```bash
# 1. Set production env vars in .env
# 2. Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run

# 4. Seed
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

SSL certificates go in `nginx/ssl/`. See `nginx/nginx.conf` for reverse proxy configuration.
