import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAtendenteId1777234703430 implements MigrationInterface {
    name = 'AddAtendenteId1777234703430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "atendimentos" ALTER COLUMN "status" SET DEFAULT 'BOT'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "atendimentos" ALTER COLUMN "status" SET DEFAULT 'AGUARDANDO'`);
    }

}
