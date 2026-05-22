import type { FastifyReply, FastifyRequest } from "fastify";
import { DateTime } from "luxon";
import { HubspotService } from "./service";

export class HubspotController {
  constructor(private service: HubspotService) {}

  ejecutarSyncManual = async (_req: FastifyRequest, reply: FastifyReply) => {
    const isRunning = await this.service.isSyncRunning();

    if (isRunning) {
      const enCurso = await this.service.getSyncEnCurso();
      return reply.code(409).send(this.buildSyncStatusResponse(enCurso, false));
    }

    // disparar la sync en background s
    this.service.ejecutarSincronizacionCompleta().catch((error) => {
      console.error("Error en sincronización manual:", error);
    });

    // esperar un instante para que el service alcance a crear el log
    await new Promise((r) => setTimeout(r, 200));

    const enCurso = await this.service.getSyncEnCurso();

    return reply.code(202).send({
      ...this.buildSyncStatusResponse(enCurso, true),
      message: "Sincronización iniciada en segundo plano",
    });
  };

  // ===================================================================================
  private buildSyncStatusResponse(enCurso: any, justStarted: boolean) {
    const startedAtJsDate = enCurso?.startedAt
      ? new Date(enCurso.startedAt)
      : null;

    const elapsedSec = startedAtJsDate
      ? Math.floor((Date.now() - startedAtJsDate.getTime()) / 1000)
      : null;

    const startedAtLima = startedAtJsDate
      ? DateTime.fromJSDate(startedAtJsDate)
          .setZone("America/Lima")
          .toFormat("dd/MM/yyyy HH:mm:ss")
      : null;

    return {
      ok: justStarted,
      running: true,
      message: justStarted
        ? "Sincronización iniciada en segundo plano"
        : "La sincronización ya se está ejecutando.",
      startedAt: startedAtJsDate?.toISOString() ?? null,
      startedAtLima,
      currentStage: enCurso?.source ?? null,
      elapsedSeconds: elapsedSec,
    };
  }
}
