import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUltimaMensagemEm1781000000000 implements MigrationInterface {
    name = 'AddUltimaMensagemEm1781000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "atendimentos"
            ADD COLUMN IF NOT EXISTS "ultimaMensagemEm" TIMESTAMP DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "atendimentos" DROP COLUMN IF EXISTS "ultimaMensagemEm"
        `);
    }
}
