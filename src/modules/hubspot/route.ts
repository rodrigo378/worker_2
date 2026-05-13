import type { FastifyInstance } from "fastify";
import { ZoomController } from "./controller";
import { HubspotRepository } from "./repository";
import { HubspotService } from "./service";
import { HubspotHttpClient } from "./http";

export async function hubspotRouter(app: FastifyInstance) {
  const http = new HubspotHttpClient();
  const repository = new HubspotRepository(app.db);
  const service = new HubspotService(http, repository);

  const controller = new ZoomController(service);

  app.get("/sinc/contactos", controller.sincronizarContactos);

  app.get("/sinc/consolidado", controller.sincronizarConsolidado);
}
