import { MigrationInterface, QueryRunner } from "typeorm";

export class CriarTabelaAtendimento1775053946272 implements MigrationInterface {
    name = 'CriarTabelaAtendimento1775053946272'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "atendimentos" ("id" SERIAL NOT NULL, "remoteJid" character varying NOT NULL, "nome" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'AGUARDANDO', "dataCriacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_80a70d057e68924b970871d9089" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "atendimentos"`);
    }

}
