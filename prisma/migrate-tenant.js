/**
 * Migracao de dados — Fase 0 (fundacao multi-tenant).
 *
 * IDEMPOTENTE e NAO DESTRUTIVA: apenas cria/altera colunas e preenche dados.
 * Nenhum registro e apagado.
 *
 * Ordem de execucao:
 *   node prisma/migrate-tenant.js
 *   npm run db:push     # reconcilia tabelas novas / FKs / indices
 *   npm run db:seed
 *
 * O que este script faz:
 *   1. Garante uma Organizacao padrao.
 *   2. Cria a tabela Congregacao (se nao existir).
 *   3. Adiciona organizacaoId / congregacaoId nas entidades de dominio.
 *   4. Popula Congregacao a partir das strings Membro.congregacao / Liturgia.congregacao.
 *   5. Associa todos os registros existentes a organizacao padrao / congregacao correspondente.
 *   6. Estende AuditLog e UsuarioOrganizacao e torna EventoFinanceiro.eventoId opcional.
 *   7. Torna organizacaoId NOT NULL e cria FKs / indices.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_ORG_NAME = 'Igreja Assembleia de Deus Ministerio da Promessa';

async function exec(sql) {
  return prisma.$executeRawUnsafe(sql);
}

async function log(msg) {
  console.log(`  ${msg}`);
}

/** 1. Organizacao padrao ------------------------------------------------- */
async function ensureDefaultOrg() {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "id" FROM "Organizacao" ORDER BY "createdAt" ASC LIMIT 1`
  );
  if (rows.length > 0) {
    log(`Organizacao padrao existente: ${rows[0].id}`);
    return rows[0].id;
  }
  const id = `org_default_${Date.now().toString(36)}`;
  await exec(
    `INSERT INTO "Organizacao" ("id", "nome", "ativo", "createdAt", "updatedAt")
     VALUES ('${id}', '${DEFAULT_ORG_NAME}', true, NOW(), NOW())`
  );
  log(`Organizacao padrao criada: ${id}`);
  return id;
}

/** 2. Tabela Congregacao ------------------------------------------------- */
async function ensureCongregacaoTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS "Congregacao" (
      "id" TEXT NOT NULL,
      "organizacaoId" TEXT NOT NULL,
      "nome" TEXT NOT NULL,
      "descricao" TEXT,
      "ativo" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Congregacao_pkey" PRIMARY KEY ("id")
    )
  `);
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Congregacao_organizacaoId_nome_key"
     ON "Congregacao"("organizacaoId", "nome")`
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "Congregacao_organizacaoId_idx"
     ON "Congregacao"("organizacaoId")`
  );
  log('Tabela Congregacao pronta');
}

/** 3. Colunas novas ------------------------------------------------------ */
async function addColumn(table, column, type) {
  await exec(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type}`);
}

async function addDomainColumns() {
  const comOrg = [
    'Membro', 'Evento', 'Aviso', 'Lideranca', 'Ministerio', 'Departamento',
    'Campanha', 'GaleriaAlbum', 'GaleriaItem', 'Oportunidade', 'Agenda',
    'EventoFinanceiro', 'ConfiguracoesIgreja',
  ];
  for (const t of comOrg) {
    await addColumn(t, 'organizacaoId', 'TEXT');
  }

  const comCongregacao = [
    'Membro', 'Liturgia', 'Evento', 'Aviso', 'Lideranca', 'Ministerio',
    'Departamento', 'Campanha', 'GaleriaAlbum', 'GaleriaItem', 'Oportunidade',
    'Agenda', 'EventoFinanceiro',
  ];
  for (const t of comCongregacao) {
    await addColumn(t, 'congregacaoId', 'TEXT');
  }

  await addColumn('AuditLog', 'organizacaoId', 'TEXT');
  await addColumn('AuditLog', 'antes', 'JSONB');
  await addColumn('AuditLog', 'depois', 'JSONB');
  await addColumn('AuditLog', 'ip', 'TEXT');
  await addColumn('AuditLog', 'userAgent', 'TEXT');
  await addColumn('AuditLog', 'resultado', 'TEXT');

  await addColumn('UsuarioOrganizacao', 'perfilId', 'TEXT');
  await addColumn('UsuarioOrganizacao', 'ativo', 'BOOLEAN');
  await addColumn('UsuarioOrganizacao', 'updatedAt', 'TIMESTAMP(3)');

  await exec(`ALTER TABLE "EventoFinanceiro" ADD COLUMN IF NOT EXISTS "categoria" TEXT`);
  await exec(
    `ALTER TABLE "EventoFinanceiro" ALTER COLUMN "eventoId" DROP NOT NULL`
  ).catch(() => {});
  await exec(
    `UPDATE "AuditLog" SET "resultado" = 'SUCESSO' WHERE "resultado" IS NULL`
  );
  await exec(
    `UPDATE "UsuarioOrganizacao" SET "ativo" = true WHERE "ativo" IS NULL`
  );
  await exec(
    `UPDATE "UsuarioOrganizacao" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL`
  );
  log('Colunas novas criadas');
}

/** 4/5. Backfill --------------------------------------------------------- */
async function backfill(orgId) {
  await exec(
    `UPDATE "Membro" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "Evento" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "Aviso" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "Lideranca" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "Ministerio" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "Departamento" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "Campanha" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "GaleriaAlbum" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "GaleriaItem" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "Oportunidade" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "Agenda" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "EventoFinanceiro" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  await exec(
    `UPDATE "ConfiguracoesIgreja" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
  );
  log('organizacaoId preenchido');

  // Congregacoes a partir das strings existentes.
  await exec(`
    INSERT INTO "Congregacao" ("id", "organizacaoId", "nome", "createdAt", "updatedAt")
    SELECT DISTINCT ON (initcap(trim("congregacao")))
      'cong_' || md5(lower(trim("congregacao"))),
      '${orgId}',
      initcap(trim("congregacao")),
      NOW(), NOW()
    FROM "Membro"
    WHERE "congregacao" IS NOT NULL AND trim("congregacao") <> ''
    ON CONFLICT DO NOTHING
  `);
  await exec(`
    INSERT INTO "Congregacao" ("id", "organizacaoId", "nome", "createdAt", "updatedAt")
    SELECT DISTINCT ON (initcap(trim("congregacao")))
      'cong_' || md5(lower(trim("congregacao"))),
      '${orgId}',
      initcap(trim("congregacao")),
      NOW(), NOW()
    FROM "Liturgia"
    WHERE "congregacao" IS NOT NULL AND trim("congregacao") <> ''
    ON CONFLICT DO NOTHING
  `);
  log('Congregacoes criadas a partir das strings');

  await exec(`
    UPDATE "Membro" m
    SET "congregacaoId" = c."id"
    FROM "Congregacao" c
    WHERE m."congregacao" IS NOT NULL
      AND trim(m."congregacao") <> ''
      AND c."organizacaoId" = '${orgId}'
      AND lower(c."nome") = lower(trim(m."congregacao"))
      AND m."congregacaoId" IS NULL
  `);
  await exec(`
    UPDATE "Liturgia" l
    SET "congregacaoId" = c."id"
    FROM "Congregacao" c
    WHERE l."congregacao" IS NOT NULL
      AND trim(l."congregacao") <> ''
      AND c."organizacaoId" = '${orgId}'
      AND lower(c."nome") = lower(trim(l."congregacao"))
      AND l."congregacaoId" IS NULL
  `);
  log('congregacaoId preenchido');
}

/** 7. NOT NULL + FKs + indices ------------------------------------------- */
async function tighten(orgId) {
  const notNull = [
    'Membro', 'Evento', 'Aviso', 'Lideranca', 'Ministerio', 'Departamento',
    'Campanha', 'GaleriaAlbum', 'GaleriaItem', 'Oportunidade', 'Agenda',
    'EventoFinanceiro',
  ];
  for (const t of notNull) {
    await exec(
      `UPDATE "${t}" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL`
    );
    await exec(
      `ALTER TABLE "${t}" ALTER COLUMN "organizacaoId" SET NOT NULL`
    ).catch((e) => log(`  (ignorado) ${t}.organizacaoId: ${e.message.split('\n')[0]}`));
  }

  await exec(`
    UPDATE "ConfiguracoesIgreja" SET "organizacaoId" = '${orgId}' WHERE "organizacaoId" IS NULL
  `);
  await exec(
    `ALTER TABLE "ConfiguracoesIgreja" ALTER COLUMN "organizacaoId" SET NOT NULL`
  ).catch(() => {});

  await exec(
    `ALTER TABLE "AuditLog" ALTER COLUMN "resultado" SET DEFAULT 'SUCESSO'`
  ).catch(() => {});

  // Unicidade de ConfiguracoesIgreja por organizacao.
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "ConfiguracoesIgreja_organizacaoId_key"
     ON "ConfiguracoesIgreja"("organizacaoId")`
  ).catch(() => {});

  // FKs (se a tabela Organizacao/Congregacao existir).
  const fks = [
    ['Membro', 'organizacaoId'],
    ['Evento', 'organizacaoId'],
    ['Aviso', 'organizacaoId'],
    ['Lideranca', 'organizacaoId'],
    ['Ministerio', 'organizacaoId'],
    ['Departamento', 'organizacaoId'],
    ['Campanha', 'organizacaoId'],
    ['GaleriaAlbum', 'organizacaoId'],
    ['GaleriaItem', 'organizacaoId'],
    ['Oportunidade', 'organizacaoId'],
    ['Agenda', 'organizacaoId'],
    ['EventoFinanceiro', 'organizacaoId'],
    ['ConfiguracoesIgreja', 'organizacaoId'],
  ];
  for (const [t, c] of fks) {
    const nome = `${t}_${c}_fkey`;
    await exec(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${nome}') THEN
          ALTER TABLE "${t}"
            ADD CONSTRAINT "${nome}" FOREIGN KEY ("${c}") REFERENCES "Organizacao"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `).catch((e) => log(`  (ignorado) FK ${nome}: ${e.message.split('\n')[0]}`));
  }

  for (const [t, c] of [
    ['Membro', 'congregacaoId'], ['Liturgia', 'congregacaoId'],
    ['Evento', 'congregacaoId'], ['Aviso', 'congregacaoId'],
    ['Lideranca', 'congregacaoId'], ['EventoFinanceiro', 'congregacaoId'],
  ]) {
    const nome = `${t}_${c}_fkey`;
    await exec(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${nome}') THEN
          ALTER TABLE "${t}"
            ADD CONSTRAINT "${nome}" FOREIGN KEY ("${c}") REFERENCES "Congregacao"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$
    `).catch((e) => log(`  (ignorado) FK ${nome}: ${e.message.split('\n')[0]}`));
  }

  const indices = [
    ['Membro', 'organizacaoId'], ['Evento', 'organizacaoId'],
    ['Aviso', 'organizacaoId'], ['Lideranca', 'organizacaoId'],
    ['EventoFinanceiro', 'organizacaoId'], ['EventoFinanceiro', 'eventoId'],
    ['AuditLog', 'organizacaoId'], ['AuditLog', 'userId'],
  ];
  for (const [t, c] of indices) {
    await exec(
      `CREATE INDEX IF NOT EXISTS "${t}_${c}_idx" ON "${t}"("${c}")`
    ).catch(() => {});
  }
  log('NOT NULL, FKs e indices aplicados');
}

async function main() {
  console.log('Migracao multi-tenant (Fase 0) — iniciando...');
  const orgId = await ensureDefaultOrg();
  await ensureCongregacaoTable();
  await addDomainColumns();
  await backfill(orgId);
  await tighten(orgId);
  console.log('Migracao concluida. Agora rode: npm run db:push');
}

main()
  .catch((e) => {
    console.error('Falha na migracao:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
