import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'buyurtma24',
  entities: [__dirname + '/../../**/*.entity.ts'],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('DB connected. Seeding...');

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // SuperAdmin user (no tenant)
  await AppDataSource.query(`
    INSERT INTO users (id, "firstName", "lastName", phone, email, password, role, "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Super', 'Admin', '+998900000000', 'admin@buyurtma24.uz', $1, 'superadmin', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
  `, [passwordHash]);

  // Demo tenant
  const rows = await AppDataSource.query(`
    INSERT INTO tenants (id, name, slug, status, "trialEndsAt", currency, timezone, "defaultLanguage", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Demo Café', 'demo', 'active', NOW() + interval '30 days', 'UZS', 'Asia/Tashkent', 'uz', NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING
    RETURNING *;
  `);
  const tenant = rows[0];

  if (tenant) {
    // Cafe admin for demo tenant
    await AppDataSource.query(`
      INSERT INTO users (id, "tenantId", "firstName", "lastName", phone, password, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, 'Demo', 'Admin', '+998901234567', $2, 'cafe_admin', true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `, [tenant.id, passwordHash]);

    // Demo staff
    await AppDataSource.query(`
      INSERT INTO users (id, "tenantId", "firstName", "lastName", phone, password, role, "isActive", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), $1, 'Kassir', 'Demo', '+998901111111', $2, 'cashier', true, NOW(), NOW()),
        (gen_random_uuid(), $1, 'Ofitsiant', 'Demo', '+998902222222', $2, 'waiter', true, NOW(), NOW()),
        (gen_random_uuid(), $1, 'Oshpaz', 'Demo', '+998903333333', $2, 'kitchen', true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `, [tenant.id, passwordHash]);

    // Tables
    await AppDataSource.query(`
      INSERT INTO tables (id, "tenantId", name, capacity, status, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), $1, '1-stol', 4, 'free', NOW(), NOW()),
        (gen_random_uuid(), $1, '2-stol', 2, 'free', NOW(), NOW()),
        (gen_random_uuid(), $1, '3-stol', 6, 'free', NOW(), NOW()),
        (gen_random_uuid(), $1, '4-stol', 4, 'free', NOW(), NOW()),
        (gen_random_uuid(), $1, 'Terassa', 8, 'free', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `, [tenant.id]);

    // Category
    const cats = await AppDataSource.query(`
      INSERT INTO categories (id, "tenantId", name, "sortOrder", "isActive", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), $1, 'Ichimliklar', 1, true, NOW(), NOW()),
        (gen_random_uuid(), $1, 'Ovqatlar', 2, true, NOW(), NOW()),
        (gen_random_uuid(), $1, 'Shirinliklar', 3, true, NOW(), NOW())
      RETURNING *;
    `, [tenant.id]);

    if (cats.length) {
      await AppDataSource.query(`
        INSERT INTO products (id, "tenantId", "categoryId", name, price, "isActive", "createdAt", "updatedAt")
        VALUES
          (gen_random_uuid(), $1, $2, 'Kofe', 15000, true, NOW(), NOW()),
          (gen_random_uuid(), $1, $2, 'Choy', 8000, true, NOW(), NOW()),
          (gen_random_uuid(), $1, $2, 'Coca-Cola', 12000, true, NOW(), NOW()),
          (gen_random_uuid(), $1, $3, 'Osh', 35000, true, NOW(), NOW()),
          (gen_random_uuid(), $1, $3, 'Lagmon', 28000, true, NOW(), NOW()),
          (gen_random_uuid(), $1, $3, 'Manti', 25000, true, NOW(), NOW()),
          (gen_random_uuid(), $1, $4, 'Tort', 18000, true, NOW(), NOW()),
          (gen_random_uuid(), $1, $4, 'Samsa', 12000, true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `, [tenant.id, cats[0].id, cats[1].id, cats[2].id]);
    }
  }

  // Subscription plans
  await AppDataSource.query(`
    INSERT INTO plans (id, name, "displayName", "priceMonthly", "priceYearly", "maxUsers", "maxTables", "maxBranches", "hasInventory", "hasQrMenu", "hasAdvancedAnalytics", "isActive", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid(), 'basic', 'Basic', 99000, 990000, 5, 10, 1, false, true, false, true, NOW(), NOW()),
      (gen_random_uuid(), 'standard', 'Standard', 299000, 2990000, 15, 30, 3, true, true, true, true, NOW(), NOW()),
      (gen_random_uuid(), 'premium', 'Premium', 699000, 6990000, 50, 100, 10, true, true, true, true, NOW(), NOW()),
      (gen_random_uuid(), 'enterprise', 'Enterprise', 1499000, 14990000, 999, 999, 999, true, true, true, true, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  `);

  console.log('✅ Seed complete!');
  console.log('   SuperAdmin: admin@buyurtma24.uz / Admin123!');
  console.log('   Cafe Admin: +998901234567 / Admin123!');
  await AppDataSource.destroy();
}

seed().catch(console.error);
