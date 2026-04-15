import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastSeenToFuncionarios1776221100882 implements MigrationInterface {
    name = 'AddLastSeenToFuncionarios1776221100882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Funcionarios" ADD "lastSeen" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Funcionarios" DROP COLUMN "lastSeen"`);
    }

}
