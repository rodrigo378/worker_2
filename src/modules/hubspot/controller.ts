import type { FastifyReply, FastifyRequest } from "fastify";
import { HubspotService } from "./service";

export class ZoomController {
  constructor(private service: HubspotService) {}

  sincronizarContactos = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.sincronizarContactos();
    return reply.send(data);
  };

  sincronizarConsolidado = async (
    _req: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const data = await this.service.sincronizarConsolidado();
    return reply.send(data);
  };
}
