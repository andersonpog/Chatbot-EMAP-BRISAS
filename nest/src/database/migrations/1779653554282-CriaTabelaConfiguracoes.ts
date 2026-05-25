import { MigrationInterface, QueryRunner } from "typeorm";

export class CriaTabelaConfiguracoes1779653554282 implements MigrationInterface {
    name = 'CriaTabelaConfiguracoes1779653554282'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "configuracoes" ("id" SERIAL NOT NULL, "diasFuncionamento" integer array NOT NULL DEFAULT '{1,2,3,4,5}', "horarioInicio" character varying NOT NULL DEFAULT '08:00', "horarioFim" character varying NOT NULL DEFAULT '18:00', "mensagemForaHorario" character varying NOT NULL DEFAULT 'Nosso atendimento humano funciona de segunda a sexta, das 08h às 18h. Deixe sua dúvida e retornaremos em breve!', CONSTRAINT "PK_7640d21fdc17722366904769d9e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "configuracoes"`);
    }

}
