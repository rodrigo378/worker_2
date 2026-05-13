import schedule from "node-schedule";
import { ZoomService } from "./service";

export function startZoomCron(service: ZoomService) {
  // // Sincronizar usuarios - cada día a las 1am
  // schedule.scheduleJob("0 1 * * *", async () => {
  //   console.log("[CRON] Sincronizando usuarios...");
  //   await service.sincronizarUsuarios();
  // });
  // // Sincronizar meetings/rooms - cada día a las 2am
  // schedule.scheduleJob("0 2 * * *", async () => {
  //   console.log("[CRON] Sincronizando meetings rooms...");
  //   await service.sincronizarMeetingsRooms();
  // });
  // // Sincronizar instancias - cada día a las 3am
  // schedule.scheduleJob("0 3 * * *", async () => {
  //   console.log("[CRON] Sincronizando instancias...");
  //   await service.sincronizarInstancias();
  // });
  // // Sincronizar participantes raw - cada día a las 4am
  // schedule.scheduleJob("0 4 * * *", async () => {
  //   console.log("[CRON] Sincronizando participantes raw...");
  //   await service.sincronizarParticipantesRaw();
  // });
  // // Sincronizar participantes - cada día a las 5am
  // schedule.scheduleJob("0 5 * * *", async () => {
  //   console.log("[CRON] Sincronizando participantes...");
  //   await service.sincronizarParticipantes();
  // });
  // console.log("[CRON] Zoom crons registrados");
}
