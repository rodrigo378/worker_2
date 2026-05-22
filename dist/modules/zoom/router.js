"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zoomRouter = zoomRouter;
const http_1 = require("./http");
const service_1 = require("./service");
const controller_1 = require("./controller");
const respository_1 = require("./respository");
async function zoomRouter(app) {
    const http = new http_1.ZoomHttpClient();
    const repository = new respository_1.ZoomRepository(app.db);
    const service = new service_1.ZoomService(http, repository);
    const controller = new controller_1.ZoomController(service);
    app.get("/sinc/users", controller.sincronizarUsuarios);
    app.get("/sinc/meetings/rooms", controller.sincronizarMeetingsRooms);
    app.get("/sinc/meetings/instances", controller.sincronizarInstancias);
    app.get("/sinc/meetings/instances/participantsRaw", controller.sincronizarParticipantesRaw);
    app.get("/sinc/meetings/instances/participants", controller.sincronizarParticipantes);
    app.get("/sinc/asistencias", controller.sincronizarAsistencias);
}
//# sourceMappingURL=router.js.map