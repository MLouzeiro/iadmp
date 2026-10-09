const fs = require('fs');
for (const linha of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = linha.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const tabelas = await p.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name
    `);
    console.log('TABELAS:', tabelas.map((t) => t.table_name).join(', '));

    const orgCols = await p.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='Organizacao' ORDER BY ordinal_position
    `);
    console.log('ORG COLS:', orgCols.map((c) => c.column_name).join(', '));

    for (const t of ['Membro', 'Congregacao', 'Lideranca', 'Ministerio', 'Organizacao']) {
      try {
        const r = await p.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "${t}"`);
        console.log(`${t}: ${r[0].n}`);
      } catch (e) {
        console.log(`${t}: ERRO ${e.message.split('\n')[0]}`);
      }
    }
  } catch (e) {
    console.error('ERRO:', e.message);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();
