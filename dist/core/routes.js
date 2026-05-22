"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const router_1 = require("../modules/zoom/router");
const route_1 = require("../modules/hubspot/route");
async function registerRoutes(app) {
    await app.register(router_1.zoomRouter, { prefix: "/zoom" });
    await app.register(route_1.hubspotRouter, { prefix: "/hubspot" });
}
//# sourceMappingURL=routes.js.map