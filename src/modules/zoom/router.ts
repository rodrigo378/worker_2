// import type { FastifyInstance } from "fastify";
// import { ZoomHttpClient } from "./http";
// import { ZoomService } from "./service";
// import { ZoomController } from "./controller";
// import { ZoomRepository } from "./respository";

// export async function zoomRouter(app: FastifyInstance) {
//   const http = new ZoomHttpClient();

//   const repository = new ZoomRepository(app.db);
//   const service = new ZoomService(http, repository);

//   const controller = new ZoomController(service);

//   app.get("/sinc/users", controller.sincronizarUsuarios);

//   app.get("/sinc/meetings/rooms", controller.sincronizarMeetingsRooms);

//   app.get("/sinc/meetings/instances", controller.sincronizarInstancias);

//   app.get(
//     "/sinc/meetings/instances/participantsRaw",
//     controller.sincronizarParticipantesRaw,
//   );

//   app.get(
//     "/sinc/meetings/instances/participants",
//     controller.sincronizarParticipantes,
//   );
// }
