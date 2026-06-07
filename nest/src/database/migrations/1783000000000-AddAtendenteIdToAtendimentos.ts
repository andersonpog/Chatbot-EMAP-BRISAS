import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAtendenteIdToAtendimentos1783000000000 implements MigrationInterface {
    name = 'AddAtendenteIdToAtendimentos1783000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "atendimentos" ADD COLUMN IF NOT EXISTS "atendenteId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "atendimentos" DROP COLUMN IF EXISTS "atendenteId"`);
    }
}
