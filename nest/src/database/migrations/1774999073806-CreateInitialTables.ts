import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1774999073806 implements MigrationInterface {
    name = 'CreateInitialTables1774999073806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "atendimentos" ("id" SERIAL NOT NULL, "remoteJid" character varying NOT NULL, "nome" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'AGUARDANDO', "dataCriacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_80a70d057e68924b970871d9089" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "atendimentos"`);
    }

}
