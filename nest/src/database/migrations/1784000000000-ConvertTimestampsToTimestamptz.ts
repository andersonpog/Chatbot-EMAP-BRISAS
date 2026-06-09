import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertTimestampsToTimestamptz1784000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // dataCriacao was stored as UTC (Postgres CURRENT_TIMESTAMP with UTC session)
    await queryRunner.query(`
      ALTER TABLE "atendimentos"
        ALTER COLUMN "dataCriacao" TYPE timestamptz
          USING "dataCriacao" AT TIME ZONE 'UTC'
    `);

    // ultimaMensagemEm was stored as local time (TypeORM serialises new Date() as local)
    await queryRunner.query(`
      ALTER TABLE "atendimentos"
        ALTER COLUMN "ultimaMensagemEm" TYPE timestamptz
          USING CASE WHEN "ultimaMensagemEm" IS NULL THEN NULL
                     ELSE "ultimaMensagemEm" AT TIME ZONE 'America/Sao_Paulo'
                END
    `);

    // dataEnvio was stored as local time (same TypeORM behaviour)
    await queryRunner.query(`
      ALTER TABLE "mensagens"
        ALTER COLUMN "dataEnvio" TYPE timestamptz
          USING "dataEnvio" AT TIME ZONE 'America/Sao_Paulo'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atendimentos"
        ALTER COLUMN "dataCriacao" TYPE timestamp WITHOUT TIME ZONE
          USING "dataCriacao" AT TIME ZONE 'UTC'
    `);

    await queryRunner.query(`
      ALTER TABLE "atendimentos"
        ALTER COLUMN "ultimaMensagemEm" TYPE timestamp WITHOUT TIME ZONE
          USING CASE WHEN "ultimaMensagemEm" IS NULL THEN NULL
                     ELSE "ultimaMensagemEm" AT TIME ZONE 'America/Sao_Paulo'
                END
    `);

    await queryRunner.query(`
      ALTER TABLE "mensagens"
        ALTER COLUMN "dataEnvio" TYPE timestamp WITHOUT TIME ZONE
          USING "dataEnvio" AT TIME ZONE 'America/Sao_Paulo'
    `);
  }
}
