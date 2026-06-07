import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMensagensTable1782000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "mensagens" (
        "id" SERIAL PRIMARY KEY,
        "atendimentoId" INTEGER,
        "remoteJid" VARCHAR NOT NULL,
        "fromMe" BOOLEAN NOT NULL DEFAULT false,
        "conteudo" TEXT NOT NULL,
        "tipo" VARCHAR NOT NULL DEFAULT 'text',
        "remetente" VARCHAR,
        "dataEnvio" TIMESTAMP NOT NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_mensagens_atendimento" ON "mensagens" ("atendimentoId")`);
    await queryRunner.query(`CREATE INDEX "IDX_mensagens_remotejid" ON "mensagens" ("remoteJid")`);
    await queryRunner.query(`CREATE INDEX "IDX_mensagens_dataEnvio" ON "mensagens" ("dataEnvio")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "mensagens"`);
  }
}
