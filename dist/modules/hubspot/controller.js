"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubspotController = void 0;
class HubspotController {
    constructor(service) {
        this.service = service;
        this.sincronizarContactos = async (_req, reply) => {
            const data = await this.service.sincronizarContactos();
            return reply.send(data);
        };
        this.sincronizarConsolidado = async (_req, reply) => {
            const data = await this.service.sincronizarConsolidado();
            return reply.send(data);
        };
        this.ejecutarSyncManual = async (_req, reply) => {
            const data = await this.service.ejecutarSincronizacionCompleta();
            return reply.send(data);
        };
    }
}
exports.HubspotController = HubspotController;
//# sourceMappingURL=controller.js.map