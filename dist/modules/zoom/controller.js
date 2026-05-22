"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomController = void 0;
class ZoomController {
    constructor(service) {
        this.service = service;
        this.sincronizarUsuarios = async (_req, reply) => {
            const data = await this.service.sincronizarUsuarios();
            return reply.send(data);
        };
        this.sincronizarMeetingsRooms = async (_req, reply) => {
            const data = await this.service.sincronizarMeetingsRooms();
            return reply.send(data);
        };
        this.sincronizarInstancias = async (_req, reply) => {
            const data = await this.service.sincronizarInstancias();
            return reply.send(data);
        };
        this.sincronizarParticipantesRaw = async (_req, reply) => {
            const data = await this.service.sincronizarParticipantesRaw();
            return reply.send(data);
        };
        this.sincronizarParticipantes = async (_req, reply) => {
            const data = await this.service.sincronizarParticipantes();
            return reply.send(data);
        };
        this.sincronizarAsistencias = async (_req, reply) => {
            const data = await this.service.sincronizarAsistencias();
            return reply.send(data);
        };
    }
}
exports.ZoomController = ZoomController;
//# sourceMappingURL=controller.js.map