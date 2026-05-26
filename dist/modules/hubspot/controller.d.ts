import type { FastifyReply, FastifyRequest } from "fastify";
import { HubspotService } from "./service";
export declare class HubspotController {
    private service;
    constructor(service: HubspotService);
    ejecutarSyncManual: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
    private buildSyncStatusResponse;
}
//# sourceMappingURL=controller.d.ts.map