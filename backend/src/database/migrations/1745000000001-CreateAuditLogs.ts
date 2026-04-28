import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1745000000001 implements MigrationInterface {
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt"   timestamptz NOT NULL DEFAULT now(),
        "updatedAt"   timestamptz NOT NULL DEFAULT now(),
        "deletedAt"   timestamptz,
        "tenantId"    uuid,
        "userId"      varchar(255),
        "action"      varchar(100) NOT NULL,
        "entity"      varchar(100) NOT NULL,
        "entityId"    varchar(255),
        "oldValue"    jsonb,
        "newValue"    jsonb,
        "ipAddress"   varchar(255),
        "userAgent"   varchar(255),
        "description" varchar(255),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
