import "server-only";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: postgres.Sql | undefined;
}

/** Server-only Postgres client. DATABASE_URL = Supabase transaction pooler (port 6543). */
export function db(): postgres.Sql {
  if (!globalThis.__sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não configurada");
    globalThis.__sql = postgres(url, { prepare: false, max: 3, idle_timeout: 20 });
  }
  return globalThis.__sql;
}
