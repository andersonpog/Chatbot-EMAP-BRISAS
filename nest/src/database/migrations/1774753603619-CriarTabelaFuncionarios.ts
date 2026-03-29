import { MigrationInterface, QueryRunner } from "typeorm";

export class CriarTabelaFuncionarios1774753603619 implements MigrationInterface {
    name = 'CriarTabelaFuncionarios1774753603619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Funcionarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "senha" character varying NOT NULL, "nome" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'ATENDENTE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_09e9783b9cf08b330ec8d32a6d9" UNIQUE ("email"), CONSTRAINT "PK_302ee46cf537922edb91d8cbef7" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Funcionarios"`);
    }

}
