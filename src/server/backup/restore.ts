/** R3 — Ghép bản sao lưu (schema.sql + data/*.jsonl theo manifest) thành một tệp SQL khôi phục. */
import { rowsToInsertSql } from './d1Backup.ts';

export function backupToSql(read: (relPath: string) => string): string {
  const manifest = JSON.parse(read('manifest.json')) as { fileList: string[]; tables: Record<string, number> };
  const parts = ['PRAGMA defer_foreign_keys = true;', read('schema.sql')];
  for (const rel of manifest.fileList) {
    const table = rel.replace(/^data\//, '').replace(/\.\d{4}\.jsonl$/, '');
    parts.push(rowsToInsertSql(table, read(rel)));
  }
  return parts.join('\n') + '\n';
}
