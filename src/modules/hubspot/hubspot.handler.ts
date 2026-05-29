// modules/hubspot/hubspot.handler.ts
//
// Recibe el job de la cola "hubspot", lee job.data.action y llama
// al método correspondiente del HubspotService.

import type { Job } from "bullmq";
import { HubspotService } from "./service";
import { HUBSPOT_ACTIONS } from "../../core/queue/queue.constants";

export function buildHubspotHandler(service: HubspotService) {
  return async (job: Job) => {
    const { action, traceId } = job?.data ?? {};

    if (!action) {
      throw new Error("Falta action en job.data (hubspot)");
    }

    let result: unknown;

    switch (action) {
      case HUBSPOT_ACTIONS.SYNC_CONTACTOS:
        result = await service.sincronizarContactos();
        break;

      case HUBSPOT_ACTIONS.SYNC_CONSOLIDADO:
        result = await service.sincronizarConsolidado();
        break;

      default:
        throw new Error(`[HUBSPOT] Action no manejada: "${action}"`);
    }

    return {
      ok: true,
      module: "hubspot",
      action,
      traceId,
      result,
    };
  };
}
