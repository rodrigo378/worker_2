// import schedule from "node-schedule";
// import { HubspotService } from "./service";

// export function startHubspotCron(service: HubspotService) {
//   schedule.scheduleJob("0 */2 * * *", async () => {
//     try {
//       await service.ejecutarSincronizacionCompleta();
//     } catch (err) {
//       console.error("[CRON] Error en sincronización HubSpot:", err);
//     }
//   });

//   console.log("[CRON] Hubspot crons registrados");
// }
