import type { FastifyInstance } from "fastify";
import { zoomRouter } from "../modules/zoom/router";
import { hubspotRouter } from "../modules/hubspot/route";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(zoomRouter, { prefix: "/zoom" });
  await app.register(hubspotRouter, { prefix: "/hubspot" });
}
