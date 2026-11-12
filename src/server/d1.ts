/**
 * Cloudflare D1 Database Compatibility Layer
 *
 * Implements the standard Cloudflare D1 API (D1Database, D1PreparedStatement, D1Result)
 * backed by node:sqlite DatabaseSync for local Node.js development, CLI scripts, and tests,
 * while seamlessly interoperating with Cloudflare Workers native env.DB in workerd runtime.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration?: number;
    changes?: number;
    last_row_id?: number | bigint;
    rows_read?: number;
    rows_written?: number;
    [key: string]: unknown;
  };
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

class NodeSQLitePreparedStatement implements D1PreparedStatement {
  private db: DatabaseSync;
  private sql: string;
  private params: unknown[] = [];

  constructor(db: DatabaseSync, sql: string, params: unknown[] = []) {
    this.db = db;
    this.sql = sql;
    this.params = params;
  }

  public bind(...values: unknown[]): D1PreparedStatement {
    return new NodeSQLitePreparedStatement(this.db, this.sql, values);
  }

  public async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const stmt = this.db.prepare(this.sql);
      const row = stmt.get(...(this.params as any)) as Record<string, unknown> | undefined;
      if (!row) return null;
      if (colName) {
        return (row[colName] as T) ?? null;
      }
      return row as T;
    } catch (err: any) {
      throw new Error(`D1 Query Error: ${err.message} [SQL: ${this.sql}]`);
    }
  }

  public async all<T = unknown>(): Promise<D1Result<T>> {
    const start = Date.now();
    try {
      const stmt = this.db.prepare(this.sql);
      const rows = stmt.all(...(this.params as any)) as T[];
      return {
        results: rows,
        success: true,
        meta: {
          duration: Date.now() - start,
          changes: 0,
          rows_read: rows.length
        }
      };
    } catch (err: any) {
      throw new Error(`D1 Query Error: ${err.message} [SQL: ${this.sql}]`);
    }
  }

  public async run<T = unknown>(): Promise<D1Result<T>> {
    const start = Date.now();
    try {
      const stmt = this.db.prepare(this.sql);
      const res = stmt.run(...(this.params as any));
      return {
        results: [],
        success: true,
        meta: {
          duration: Date.now() - start,
          changes: Number(res.changes),
          last_row_id: Number(res.lastInsertRowid)
        }
      };
    } catch (err: any) {
      throw new Error(`D1 Run Error: ${err.message} [SQL: ${this.sql}]`);
    }
  }

  // Internal access for batching
  public _getSqlAndParams(): { sql: string; params: unknown[] } {
    return { sql: this.sql, params: this.params };
  }
}

class NodeSQLiteD1Database implements D1Database {
  private db: DatabaseSync;
  public readonly databasePath: string;

  constructor(databasePath: string) {
    this.databasePath = databasePath;
    if (databasePath !== ':memory:') {
      const dir = path.dirname(databasePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(databasePath);
    // Enable foreign keys for SQLite
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  public prepare(query: string): D1PreparedStatement {
    return new NodeSQLitePreparedStatement(this.db, query);
  }

  public async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const stmt of statements) {
        if (stmt instanceof NodeSQLitePreparedStatement) {
          const { sql, params } = stmt._getSqlAndParams();
          const compiled = this.db.prepare(sql);
          const start = Date.now();
          const res = compiled.run(...(params as any));
          results.push({
            results: [],
            success: true,
            meta: {
              duration: Date.now() - start,
              changes: Number(res.changes),
              last_row_id: Number(res.lastInsertRowid)
            }
          });
        } else {
          const res = await stmt.run<T>();
          results.push(res);
        }
      }
      this.db.exec('COMMIT;');
      return results;
    } catch (err: any) {
      this.db.exec('ROLLBACK;');
      throw new Error(`D1 Batch Transaction Error: ${err.message}`);
    }
  }

  public async exec(query: string): Promise<D1ExecResult> {
    const start = Date.now();
    this.db.exec(query);
    return {
      count: 1,
      duration: Date.now() - start
    };
  }

  public close(): void {
    try {
      this.db.close();
    } catch {}
  }
}

/**
 * Creates a D1Database instance.
 * @param databasePath ':memory:' for isolated testing, or a path to a SQLite file.
 */
export function createD1Database(databasePath = ':memory:'): D1Database {
  return new NodeSQLiteD1Database(databasePath);
}
