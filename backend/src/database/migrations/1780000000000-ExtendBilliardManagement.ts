import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendBilliardManagement1780000000000 implements MigrationInterface {
  name = 'ExtendBilliardManagement1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "landmark" character varying`);
    await queryRunner.query(`ALTER TABLE "billiard_clubs" ADD COLUMN IF NOT EXISTS "tenantId" uuid`);
    await queryRunner.query(`ALTER TABLE "billiard_clubs" ADD COLUMN IF NOT EXISTS "city" character varying`);
    await queryRunner.query(`ALTER TABLE "billiard_clubs" ADD COLUMN IF NOT EXISTS "landmark" character varying`);
    await queryRunner.query(`ALTER TABLE "billiard_table_types" ADD COLUMN IF NOT EXISTS "clubId" uuid`);
    await queryRunner.query(`ALTER TABLE "billiard_table_types" ADD COLUMN IF NOT EXISTS "tier" character varying(40) NOT NULL DEFAULT 'oddiy'`);
    await queryRunner.query(`ALTER TABLE "billiard_table_types" ADD COLUMN IF NOT EXISTS "details" character varying`);
    await queryRunner.query(`ALTER TABLE "billiard_extras" ADD COLUMN IF NOT EXISTS "clubId" uuid`);
    await queryRunner.query(`ALTER TABLE "billiard_extras" ADD COLUMN IF NOT EXISTS "category" character varying`);
    await queryRunner.query(`ALTER TABLE "billiard_orders" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "billiard_orders" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "billiard_orders" ALTER COLUMN "endAt" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "billiard_order_items" ADD COLUMN IF NOT EXISTS "name" character varying`);
    await queryRunner.query(`ALTER TABLE "billiard_order_items" ADD COLUMN IF NOT EXISTS "note" character varying`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."billiard_order_items_status_enum" AS ENUM('pending', 'accepted'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`ALTER TABLE "billiard_order_items" ADD COLUMN IF NOT EXISTS "status" "public"."billiard_order_items_status_enum" NOT NULL DEFAULT 'accepted'`);
    await queryRunner.query(`ALTER TABLE "billiard_order_items" ALTER COLUMN "extraId" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "billiard_order_items" ALTER COLUMN "extraId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "billiard_order_items" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."billiard_order_items_status_enum"`);
    await queryRunner.query(`ALTER TABLE "billiard_order_items" DROP COLUMN IF EXISTS "note"`);
    await queryRunner.query(`ALTER TABLE "billiard_order_items" DROP COLUMN IF EXISTS "name"`);
    await queryRunner.query(`ALTER TABLE "billiard_orders" ALTER COLUMN "endAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "billiard_orders" DROP COLUMN IF EXISTS "closedAt"`);
    await queryRunner.query(`ALTER TABLE "billiard_orders" DROP COLUMN IF EXISTS "confirmedAt"`);
    await queryRunner.query(`ALTER TABLE "billiard_extras" DROP COLUMN IF EXISTS "category"`);
    await queryRunner.query(`ALTER TABLE "billiard_extras" DROP COLUMN IF EXISTS "clubId"`);
    await queryRunner.query(`ALTER TABLE "billiard_table_types" DROP COLUMN IF EXISTS "details"`);
    await queryRunner.query(`ALTER TABLE "billiard_table_types" DROP COLUMN IF EXISTS "tier"`);
    await queryRunner.query(`ALTER TABLE "billiard_table_types" DROP COLUMN IF EXISTS "clubId"`);
    await queryRunner.query(`ALTER TABLE "billiard_clubs" DROP COLUMN IF EXISTS "landmark"`);
    await queryRunner.query(`ALTER TABLE "billiard_clubs" DROP COLUMN IF EXISTS "city"`);
    await queryRunner.query(`ALTER TABLE "billiard_clubs" DROP COLUMN IF EXISTS "tenantId"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "landmark"`);
  }
}
