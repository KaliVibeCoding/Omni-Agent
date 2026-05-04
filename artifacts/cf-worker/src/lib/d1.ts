export async function query(db: D1Database, sql: string, params: unknown[] = []): Promise<unknown[]> {
  try {
    const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
    const result = await stmt.all();
    return result.results ?? [];
  } catch {
    return [];
  }
}

export async function queryOne(db: D1Database, sql: string, params: unknown[] = []): Promise<unknown | null> {
  const rows = await query(db, sql, params);
  return rows[0] ?? null;
}

export async function run(db: D1Database, sql: string, params: unknown[] = []): Promise<void> {
  const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  await stmt.run();
}
