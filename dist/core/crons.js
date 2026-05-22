"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCrons = registerCrons;
const http_1 = require("../modules/zoom/http");
const service_1 = require("../modules/zoom/service");
const respository_1 = require("../modules/zoom/respository");
const zoom_cron_1 = require("../modules/zoom/zoom.cron");
const http_2 = require("../modules/hubspot/http");
const repository_1 = require("../modules/hubspot/repository");
const service_2 = require("../modules/hubspot/service");
const cron_1 = require("../modules/hubspot/cron");
async function registerCrons(db) {
    // Zoom
    const zoomHttp = new http_1.ZoomHttpClient();
    const zoomRepository = new respository_1.ZoomRepository(db);
    const zoomService = new service_1.ZoomService(zoomHttp, zoomRepository);
    (0, zoom_cron_1.startZoomCron)(zoomService);
    // Aquí agregas HubSpot u otros módulos después
    const hubspotHttp = new http_2.HubspotHttpClient();
    const hubspotRepository = new repository_1.HubspotRepository(db);
    const hubspotService = new service_2.HubspotService(hubspotHttp, hubspotRepository);
    (0, cron_1.startHubspotCron)(hubspotService);
}
//# sourceMappingURL=crons.js.map