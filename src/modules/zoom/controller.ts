import type { FastifyReply, FastifyRequest } from "fastify";
import { ZoomService } from "./service";

export class ZoomController {
  constructor(private service: ZoomService) {}

  getSincroUsuarios = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getSincroUsuarios();
    return reply.send(data);
  };

  getReuniones = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getReuniones();
    return reply.send(data);
  };

  getOcurrencias = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getOcurrencias();
    return reply.send(data);
  };
}
