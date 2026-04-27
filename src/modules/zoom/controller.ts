// import type { FastifyReply, FastifyRequest } from "fastify";
// import { ZoomService } from "./service";

// export class ZoomController {
//   constructor(private service: ZoomService) {}

//   sincronizarUsuarios = async (_req: FastifyRequest, reply: FastifyReply) => {
//     const data = await this.service.sincronizarUsuarios();
//     return reply.send(data);
//   };

//   sincronizarMeetingsRooms = async (
//     _req: FastifyRequest,
//     reply: FastifyReply,
//   ) => {
//     const data = await this.service.sincronizarMeetingsRooms();
//     return reply.send(data);
//   };

//   sincronizarInstancias = async (_req: FastifyRequest, reply: FastifyReply) => {
//     const data = await this.service.sincronizarInstancias();
//     return reply.send(data);
//   };

//   sincronizarParticipantesRaw = async (
//     _req: FastifyRequest,
//     reply: FastifyReply,
//   ) => {
//     const data = await this.service.sincronizarParticipantesRaw();
//     return reply.send(data);
//   };

//   sincronizarParticipantes = async (
//     _req: FastifyRequest,
//     reply: FastifyReply,
//   ) => {
//     const data = await this.service.sincronizarParticipantes();
//     return reply.send(data);
//   };
// }
