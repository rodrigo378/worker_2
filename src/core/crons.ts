import { DbRegistry } from "./db/registry";
import { ZoomHttpClient } from "../modules/zoom/http";
import { ZoomService } from "../modules/zoom/service";
import { ZoomRepository } from "../modules/zoom/respository";
import { startZoomCron } from "../modules/zoom/zoom.cron";

export async function registerCrons(db: DbRegistry) {
  // Zoom
  const zoomHttp = new ZoomHttpClient();
  const zoomRepository = new ZoomRepository(db);
  const zoomService = new ZoomService(zoomHttp, zoomRepository);
  startZoomCron(zoomService);

  // Aquí agregas HubSpot u otros módulos después
  // const hubspotHttp = new HubspotHttpClient();
  // const hubspotRepository = new HubspotRepository(db);
  // const hubspotService = new HubspotService(hubspotHttp, hubspotRepository);
  // startHubspotCron(hubspotService);
}
