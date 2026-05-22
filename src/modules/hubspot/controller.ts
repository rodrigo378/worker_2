import type { FastifyReply, FastifyRequest } from "fastify";
import { HubspotService } from "./service";

export class HubspotController {
  constructor(private service: HubspotService) {}

  ejecutarSyncManual = async (_req: FastifyRequest, reply: FastifyReply) => {
    const isRunning = await this.service.isSyncRunning();
    if (isRunning) {
      return reply.code(409).send({
        ok: false,
        running: true,
        message: "La sincronización ya se está ejecutando.",
      });
    }

    this.service.ejecutarSincronizacionCompleta().catch((error) => {
      console.error("Error en sincronización manual:", error);
    });

    return reply.code(202).send({
      ok: true,
      message: "Sincronización iniciada en segundo plano",
    });
  };
}
