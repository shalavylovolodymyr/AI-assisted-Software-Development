import EmbeddedPostgres from "embedded-postgres";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const databaseDir = resolve(".local/postgres");
mkdirSync(resolve(".local"), { recursive: true });
const db = new EmbeddedPostgres({
  databaseDir,
  port: 54329,
  user: "signal",
  password: "signal",
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1", "-k", resolve(".local")],
  onLog: () => {},
  onError: (message) => {
    if (String(message).includes("FATAL")) console.error(message);
  },
});
if (!existsSync(resolve(databaseDir, "PG_VERSION"))) await db.initialise();
await db.start();
const client = db.getPgClient("postgres");
await client.connect();
for (const name of ["signal", "signal_test"]) {
  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [name],
  );
  if (!result.rowCount) await client.query(`CREATE DATABASE ${name}`);
}
await client.end();
console.log(
  "PostgreSQL ready on 127.0.0.1:54329 (signal and isolated signal_test databases).",
);
console.log(
  "Demo credentials: signal / signal. Keep this terminal open; Ctrl-C stops PostgreSQL.",
);
await new Promise(() => {});
