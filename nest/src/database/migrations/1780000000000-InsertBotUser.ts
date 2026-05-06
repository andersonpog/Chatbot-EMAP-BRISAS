import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertBotUser1780000000000 implements MigrationInterface {
    name = 'InsertBotUser1780000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "Funcionarios" (id, email, senha, nome, role, active)
            SELECT
                '00000000-0000-0000-0000-000000000001',
                'bot@sistema.local',
                'BOT_SYSTEM_ACCOUNT_CANNOT_LOGIN',
                'Bot Ouvidoria',
                'SISTEMA',
                true
            WHERE NOT EXISTS (
                SELECT 1 FROM "Funcionarios" WHERE id = '00000000-0000-0000-0000-000000000001'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "Funcionarios" WHERE id = '00000000-0000-0000-0000-000000000001'`);
    }
}
