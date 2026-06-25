import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  decryptMessageContent,
  encryptMessageContent,
} from '../../common/crypto/message-content.transformer';

type MensagemRow = {
  id: number;
  conteudo: string;
};

export class EncryptMensagensConteudo1785000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const mensagens = (await queryRunner.query(`
      SELECT "id", "conteudo"
      FROM "mensagens"
      WHERE "conteudo" NOT LIKE 'enc:v1:%'
    `)) as unknown as MensagemRow[];

    for (const mensagem of mensagens) {
      await queryRunner.query(
        `UPDATE "mensagens" SET "conteudo" = $1 WHERE "id" = $2`,
        [encryptMessageContent(mensagem.conteudo), mensagem.id],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const mensagens = (await queryRunner.query(`
      SELECT "id", "conteudo"
      FROM "mensagens"
      WHERE "conteudo" LIKE 'enc:v1:%'
    `)) as unknown as MensagemRow[];

    for (const mensagem of mensagens) {
      await queryRunner.query(
        `UPDATE "mensagens" SET "conteudo" = $1 WHERE "id" = $2`,
        [decryptMessageContent(mensagem.conteudo), mensagem.id],
      );
    }
  }
}
