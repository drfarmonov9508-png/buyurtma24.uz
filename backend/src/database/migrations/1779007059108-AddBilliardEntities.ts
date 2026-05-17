import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBilliardEntities1779007059108 implements MigrationInterface {
    name = 'AddBilliardEntities1779007059108'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."regions_type_enum" AS ENUM('region', 'district', 'neighborhood')`);
        await queryRunner.query(`CREATE TABLE "regions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "type" "public"."regions_type_enum" NOT NULL DEFAULT 'region', "parentId" uuid, "isActive" boolean NOT NULL DEFAULT true, "path" character varying, CONSTRAINT "PK_4fcd12ed6a046276e2deb08801c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0cdc4e441ca92c38b72d83881e" ON "regions" ("slug", "type") `);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "icon" character varying, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "metadata" jsonb, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_02cf0d0f46e11d22d952f62367" ON "services" ("slug") `);
        await queryRunner.query(`CREATE TABLE "billiard_table_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(80) NOT NULL, "pricePerHour" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_4d506ebcb5fe1e50cabe30abe25" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."billiard_tables_status_enum" AS ENUM('free', 'occupied', 'reserved')`);
        await queryRunner.query(`CREATE TABLE "billiard_tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "clubId" uuid NOT NULL, "name" character varying(80) NOT NULL, "capacity" integer NOT NULL DEFAULT '4', "status" "public"."billiard_tables_status_enum" NOT NULL DEFAULT 'free', "pricePerHour" numeric(12,2) NOT NULL DEFAULT '0', "typeId" uuid, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f46f8f88df6a86aa4dedaf5ca3f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "billiard_clubs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(120) NOT NULL, "slug" character varying(120) NOT NULL, "address" character varying, "phone" character varying, "coverImage" character varying, "description" character varying, "regionId" uuid, "serviceId" uuid, "workingHours" jsonb, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_6bdfaf8734ae8be65e17184c37d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_54d0409da4a51eccc80367a71b" ON "billiard_clubs" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."billiard_orders_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "billiard_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "clubId" uuid NOT NULL, "tableId" uuid NOT NULL, "status" "public"."billiard_orders_status_enum" NOT NULL DEFAULT 'pending', "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endAt" TIMESTAMP WITH TIME ZONE NOT NULL, "durationMinutes" integer NOT NULL DEFAULT '60', "pricePerHour" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "note" character varying, CONSTRAINT "PK_fb8be9d7ee5f3b6a4ca2f5d5309" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "billiard_extras" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(120) NOT NULL, "price" numeric(12,2) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b56353a5252ddf36547a2111b40" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "billiard_order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "orderId" uuid NOT NULL, "extraId" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "price" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_c67a655780c62466eba2fef4861" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "regionId" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."tenants_businesstype_enum" RENAME TO "tenants_businesstype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_businesstype_enum" AS ENUM('cafe', 'restaurant', 'oshxona', 'fastfood', 'market', 'supermarket', 'dokon', 'boshqa', 'sport')`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" TYPE "public"."tenants_businesstype_enum" USING "businessType"::"text"::"public"."tenants_businesstype_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" SET DEFAULT 'cafe'`);
        await queryRunner.query(`DROP TYPE "public"."tenants_businesstype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('superadmin', 'cafe_admin', 'manager', 'cashier', 'waiter', 'kitchen', 'sport_admin', 'billiard_admin', 'client', 'courier')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'client'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."tenants_businesstype_enum" RENAME TO "tenants_businesstype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_businesstype_enum" AS ENUM('cafe', 'restaurant', 'oshxona', 'fastfood', 'market', 'supermarket', 'dokon', 'boshqa', 'sport')`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" TYPE "public"."tenants_businesstype_enum" USING "businessType"::"text"::"public"."tenants_businesstype_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" SET DEFAULT 'cafe'`);
        await queryRunner.query(`DROP TYPE "public"."tenants_businesstype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('superadmin', 'cafe_admin', 'manager', 'cashier', 'waiter', 'kitchen', 'sport_admin', 'billiard_admin', 'client', 'courier')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'client'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "FK_a78bd616ea6104185f2ac3735e3" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "regions" ADD CONSTRAINT "FK_893e171fccde1ce0e47a06f14cd" FOREIGN KEY ("parentId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_tables" ADD CONSTRAINT "FK_a657edbb4ad2ad86dd0073cb947" FOREIGN KEY ("clubId") REFERENCES "billiard_clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_tables" ADD CONSTRAINT "FK_02f4f7bd0f8b5d9bf1bf8960a7f" FOREIGN KEY ("typeId") REFERENCES "billiard_table_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_clubs" ADD CONSTRAINT "FK_115929614d4ac4c3da9c04fb853" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_clubs" ADD CONSTRAINT "FK_9421a1742b780db5ae30047d500" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_orders" ADD CONSTRAINT "FK_c275a78efa217cad08a8119ca5d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_orders" ADD CONSTRAINT "FK_2a9fb6b8761af60dad5693cf672" FOREIGN KEY ("clubId") REFERENCES "billiard_clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_orders" ADD CONSTRAINT "FK_ec865411375ba4e1f52e1fc9bc4" FOREIGN KEY ("tableId") REFERENCES "billiard_tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_order_items" ADD CONSTRAINT "FK_122a220a92b12739d8008041ccb" FOREIGN KEY ("orderId") REFERENCES "billiard_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billiard_order_items" ADD CONSTRAINT "FK_473ba011cda67b611e048db1aff" FOREIGN KEY ("extraId") REFERENCES "billiard_extras"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "billiard_order_items" DROP CONSTRAINT "FK_473ba011cda67b611e048db1aff"`);
        await queryRunner.query(`ALTER TABLE "billiard_order_items" DROP CONSTRAINT "FK_122a220a92b12739d8008041ccb"`);
        await queryRunner.query(`ALTER TABLE "billiard_orders" DROP CONSTRAINT "FK_ec865411375ba4e1f52e1fc9bc4"`);
        await queryRunner.query(`ALTER TABLE "billiard_orders" DROP CONSTRAINT "FK_2a9fb6b8761af60dad5693cf672"`);
        await queryRunner.query(`ALTER TABLE "billiard_orders" DROP CONSTRAINT "FK_c275a78efa217cad08a8119ca5d"`);
        await queryRunner.query(`ALTER TABLE "billiard_clubs" DROP CONSTRAINT "FK_9421a1742b780db5ae30047d500"`);
        await queryRunner.query(`ALTER TABLE "billiard_clubs" DROP CONSTRAINT "FK_115929614d4ac4c3da9c04fb853"`);
        await queryRunner.query(`ALTER TABLE "billiard_tables" DROP CONSTRAINT "FK_02f4f7bd0f8b5d9bf1bf8960a7f"`);
        await queryRunner.query(`ALTER TABLE "billiard_tables" DROP CONSTRAINT "FK_a657edbb4ad2ad86dd0073cb947"`);
        await queryRunner.query(`ALTER TABLE "regions" DROP CONSTRAINT "FK_893e171fccde1ce0e47a06f14cd"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "FK_a78bd616ea6104185f2ac3735e3"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('superadmin', 'cafe_admin', 'manager', 'cashier', 'waiter', 'kitchen', 'client', 'courier')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'client'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_businesstype_enum_old" AS ENUM('cafe', 'restaurant', 'oshxona', 'fastfood', 'market', 'supermarket', 'dokon', 'boshqa')`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" TYPE "public"."tenants_businesstype_enum_old" USING "businessType"::"text"::"public"."tenants_businesstype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" SET DEFAULT 'cafe'`);
        await queryRunner.query(`DROP TYPE "public"."tenants_businesstype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tenants_businesstype_enum_old" RENAME TO "tenants_businesstype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('superadmin', 'cafe_admin', 'manager', 'cashier', 'waiter', 'kitchen', 'client', 'courier')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'client'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_businesstype_enum_old" AS ENUM('cafe', 'restaurant', 'oshxona', 'fastfood', 'market', 'supermarket', 'dokon', 'boshqa')`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" TYPE "public"."tenants_businesstype_enum_old" USING "businessType"::"text"::"public"."tenants_businesstype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "businessType" SET DEFAULT 'cafe'`);
        await queryRunner.query(`DROP TYPE "public"."tenants_businesstype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tenants_businesstype_enum_old" RENAME TO "tenants_businesstype_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "regionId"`);
        await queryRunner.query(`DROP TABLE "billiard_order_items"`);
        await queryRunner.query(`DROP TABLE "billiard_extras"`);
        await queryRunner.query(`DROP TABLE "billiard_orders"`);
        await queryRunner.query(`DROP TYPE "public"."billiard_orders_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_54d0409da4a51eccc80367a71b"`);
        await queryRunner.query(`DROP TABLE "billiard_clubs"`);
        await queryRunner.query(`DROP TABLE "billiard_tables"`);
        await queryRunner.query(`DROP TYPE "public"."billiard_tables_status_enum"`);
        await queryRunner.query(`DROP TABLE "billiard_table_types"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02cf0d0f46e11d22d952f62367"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cdc4e441ca92c38b72d83881e"`);
        await queryRunner.query(`DROP TABLE "regions"`);
        await queryRunner.query(`DROP TYPE "public"."regions_type_enum"`);
    }

}
