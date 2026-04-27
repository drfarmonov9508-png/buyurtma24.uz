import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncMissingColumns1745000000000 implements MigrationInterface {
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* ═══════════════════════════════════════════
       users table – add columns added after v1
    ═══════════════════════════════════════════ */
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "language"      varchar(255) NOT NULL DEFAULT 'uz',
        ADD COLUMN IF NOT EXISTS "permissions"   jsonb,
        ADD COLUMN IF NOT EXISTS "refreshToken"  varchar(255),
        ADD COLUMN IF NOT EXISTS "lastLoginAt"   timestamptz,
        ADD COLUMN IF NOT EXISTS "branchId"      varchar(255)
    `);

    /* ═══════════════════════════════════════════
       tables_status_enum – add 'cleaning' value
    ═══════════════════════════════════════════ */
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumtypid = 'tables_status_enum'::regtype
            AND enumlabel = 'cleaning'
        ) THEN
          ALTER TYPE "tables_status_enum" ADD VALUE 'cleaning';
        END IF;
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$
    `);

    /* ═══════════════════════════════════════════
       orders_paymentstatus_enum – create if absent
    ═══════════════════════════════════════════ */
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'orders_paymentstatus_enum'
        ) THEN
          CREATE TYPE "orders_paymentstatus_enum"
            AS ENUM('pending','paid','partially_paid','refunded','cancelled');
        END IF;
      END $$
    `);

    /* ═══════════════════════════════════════════
       orders table – add columns added after v1
    ═══════════════════════════════════════════ */
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN IF NOT EXISTS "clientId"            uuid,
        ADD COLUMN IF NOT EXISTS "cashierId"           uuid,
        ADD COLUMN IF NOT EXISTS "completedAt"         timestamptz,
        ADD COLUMN IF NOT EXISTS "cancelledAt"         timestamptz,
        ADD COLUMN IF NOT EXISTS "cancellationReason"  varchar(255),
        ADD COLUMN IF NOT EXISTS "deliveryAddress"     jsonb,
        ADD COLUMN IF NOT EXISTS "estimatedReadyAt"    timestamptz,
        ADD COLUMN IF NOT EXISTS "promoCodeId"         varchar(255)
    `);

    /* paymentStatus enum column – must be added separately */
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='orders' AND column_name='paymentStatus'
        ) THEN
          ALTER TABLE "orders"
            ADD COLUMN "paymentStatus" "orders_paymentstatus_enum" NOT NULL DEFAULT 'pending';
        END IF;
      END $$
    `);

    /* ═══════════════════════════════════════════
       order_items table – add extras/variant/status
    ═══════════════════════════════════════════ */
    await queryRunner.query(`
      ALTER TABLE "order_items"
        ADD COLUMN IF NOT EXISTS "extras"   jsonb,
        ADD COLUMN IF NOT EXISTS "variant"  jsonb,
        ADD COLUMN IF NOT EXISTS "note"     varchar(255)
    `);

    /* order_items status enum */
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='order_items' AND column_name='status'
        ) THEN
          ALTER TABLE "order_items"
            ADD COLUMN "status" "orders_status_enum" NOT NULL DEFAULT 'pending';
        END IF;
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "language",
        DROP COLUMN IF EXISTS "permissions",
        DROP COLUMN IF EXISTS "refreshToken",
        DROP COLUMN IF EXISTS "lastLoginAt",
        DROP COLUMN IF EXISTS "branchId"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
        DROP COLUMN IF EXISTS "clientId",
        DROP COLUMN IF EXISTS "cashierId",
        DROP COLUMN IF EXISTS "completedAt",
        DROP COLUMN IF EXISTS "cancelledAt",
        DROP COLUMN IF EXISTS "cancellationReason",
        DROP COLUMN IF EXISTS "deliveryAddress",
        DROP COLUMN IF EXISTS "estimatedReadyAt",
        DROP COLUMN IF EXISTS "promoCodeId",
        DROP COLUMN IF EXISTS "paymentStatus"
    `);
    await queryRunner.query(`
      ALTER TABLE "order_items"
        DROP COLUMN IF EXISTS "extras",
        DROP COLUMN IF EXISTS "variant",
        DROP COLUMN IF EXISTS "note",
        DROP COLUMN IF EXISTS "status"
    `);
  }
}
