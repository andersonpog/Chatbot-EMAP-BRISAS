import { MigrationInterface, QueryRunner } from "typeorm";

export class AtualizaTabelaConfiguracoes1779654637054 implements MigrationInterface {
    name = 'AtualizaTabelaConfiguracoes1779654637054'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "configuracoes" DROP COLUMN "diasFuncionamento"`);
        await queryRunner.query(`ALTER TABLE "configuracoes" DROP COLUMN "horarioInicio"`);
        await queryRunner.query(`ALTER TABLE "configuracoes" DROP COLUMN "horarioFim"`);
        await queryRunner.query(`ALTER TABLE "configuracoes" ADD "horarios" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "configuracoes" DROP COLUMN "horarios"`);
        await queryRunner.query(`ALTER TABLE "configuracoes" ADD "horarioFim" character varying NOT NULL DEFAULT '18:00'`);
        await queryRunner.query(`ALTER TABLE "configuracoes" ADD "horarioInicio" character varying NOT NULL DEFAULT '08:00'`);
        await queryRunner.query(`ALTER TABLE "configuracoes" ADD "diasFuncionamento" integer array NOT NULL DEFAULT '{1,2,3,4,5}'`);
    }

}
