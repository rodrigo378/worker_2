"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHubspotCron = startHubspotCron;
const node_schedule_1 = __importDefault(require("node-schedule"));
function startHubspotCron(service) {
    node_schedule_1.default.scheduleJob("0 */2 * * *", async () => {
        try {
            await service.ejecutarSincronizacionCompleta();
        }
        catch (err) {
            console.error("[CRON] Error en sincronización HubSpot:", err);
        }
    });
    console.log("[CRON] Hubspot crons registrados");
}
//# sourceMappingURL=cron.js.map