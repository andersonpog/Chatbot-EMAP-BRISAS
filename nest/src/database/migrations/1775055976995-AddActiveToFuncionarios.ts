import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActiveToFuncionarios1775055976995 implements MigrationInterface {
    name = 'AddActiveToFuncionarios1775055976995'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Funcionarios" ADD "active" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Funcionarios" DROP COLUMN "active"`);
    }

}
