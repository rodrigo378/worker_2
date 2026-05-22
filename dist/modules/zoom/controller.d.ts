import type { FastifyReply, FastifyRequest } from "fastify";
import { ZoomService } from "./service";
export declare class ZoomController {
    private service;
    constructor(service: ZoomService);
    sincronizarUsuarios: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
    sincronizarMeetingsRooms: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
    sincronizarInstancias: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
    sincronizarParticipantesRaw: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
    sincronizarParticipantes: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
    sincronizarAsistencias: (_req: FastifyRequest, reply: FastifyReply) => Promise<never>;
}
//# sourceMappingURL=controller.d.ts.map