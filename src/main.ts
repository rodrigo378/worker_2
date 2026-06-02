// src/main.ts
import "dotenv/config";
import http from "node:http";
import { env } from "./core/config/env";
import { initDb } from "./core/db";
import { startWorkers } from "./core/queue/worker";

async function main() {
  const db = await initDb(env.DB_CONNECTIONS);
  console.log("BD conectada:", db.list());

  // Registra schedules estáticos en Redis
  // await registerSchedules();

  // Arranca workers
  const { closeAll } = startWorkers(db);

  console.log("worker-sync iniciado");

  // Health check
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, dbs: db.list() }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen(env.PORT, env.HOST, () => {
    console.log(`Health check en ${env.HOST}:${env.PORT}/health`);
  });

  const shutdown = async () => {
    console.log("Cerrando worker-sync...");
    server.close();
    await closeAll();
    await db.closeAll();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
