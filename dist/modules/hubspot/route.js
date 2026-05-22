"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hubspotRouter = hubspotRouter;
const controller_1 = require("./controller");
const repository_1 = require("./repository");
const service_1 = require("./service");
const http_1 = require("./http");
async function hubspotRouter(app) {
    const http = new http_1.HubspotHttpClient();
    const repository = new repository_1.HubspotRepository(app.db);
    const service = new service_1.HubspotService(http, repository);
    const controller = new controller_1.HubspotController(service);
    app.get("/sinc/contactos", controller.sincronizarContactos);
    app.get("/sinc/consolidado", controller.sincronizarConsolidado);
    app.post("/sinc/run", controller.ejecutarSyncManual);
}
//# sourceMappingURL=route.js.map