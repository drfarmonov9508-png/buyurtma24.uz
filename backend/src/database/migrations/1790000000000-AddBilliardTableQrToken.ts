import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';

export class AddBilliardTableQrToken1790000000000 implements MigrationInterface {
  name = 'AddBilliardTableQrToken1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "billiard_tables"
      ADD COLUMN IF NOT EXISTS "qr_token" character varying(64)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_billiard_tables_qr_token"
      ON "billiard_tables" ("qr_token")
      WHERE "qr_token" IS NOT NULL
    `);

    const rows: { id: string }[] = await queryRunner.query(`SELECT id FROM "billiard_tables" WHERE "qr_token" IS NULL`);
    for (const row of rows) {
      await queryRunner.query(`UPDATE "billiard_tables" SET "qr_token" = $1 WHERE id = $2`, [randomUUID(), row.id]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_billiard_tables_qr_token"`);
    await queryRunner.query(`ALTER TABLE "billiard_tables" DROP COLUMN IF EXISTS "qr_token"`);
  }
}
