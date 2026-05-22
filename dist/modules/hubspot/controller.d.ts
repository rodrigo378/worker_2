import type { FastifyReply, FastifyRequest } from "fastify";
import { HubspotService } from "./service";
export declare class HubspotController {
    private service;
    constructor(service: HubspotService);
    sincronizarContactos: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
    sincronizarConsolidado: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
    ejecutarSyncManual: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
}
//# sourceMappingURL=controller.d.ts.map