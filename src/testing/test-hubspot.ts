// worker-sync/src/testing/test-hubspot.ts

import "dotenv/config";
import { env } from "../core/config/env";
import { initDb } from "../core/db";
import { ZoomService } from "../modules/zoom/service";
import { ZoomHttpClient } from "../modules/zoom/http";
import { ZoomRepository } from "../modules/zoom/respository";

async function main() {
  console.log("Iniciando prueba...");

  const db = await initDb(env.DB_CONNECTIONS);
  console.log("BD conectada:", db.list());

  const service = new ZoomService(new ZoomHttpClient(), new ZoomRepository(db));

  const result = await service.sincronizarAsistencias();
  console.log("Resultado:", result);

  await db.closeAll();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
