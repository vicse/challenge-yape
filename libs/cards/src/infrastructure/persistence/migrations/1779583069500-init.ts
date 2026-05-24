import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1779583069500 implements MigrationInterface {
  name = 'Init1779583069500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cards" ("id" uuid NOT NULL, "requestId" character varying NOT NULL, "documentType" character varying NOT NULL, "documentNumber" character varying NOT NULL, "fullName" character varying NOT NULL, "age" integer NOT NULL, "email" character varying NOT NULL, "cardType" character varying NOT NULL, "currency" character varying NOT NULL, "status" character varying NOT NULL, "cardNumber" character varying, "expirationDate" character varying, "cvv" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_19dca60280e316c6bd3658423ab" UNIQUE ("requestId"), CONSTRAINT "PK_5f3269634705fdff4a9935860fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c35b6f09ec96fcc9b5bcfe7bae" ON "cards"  ("documentNumber") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c35b6f09ec96fcc9b5bcfe7bae"`);
    await queryRunner.query(`DROP TABLE "cards"`);
  }
}
