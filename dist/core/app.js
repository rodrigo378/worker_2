"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const env_1 = require("./config/env");
const db_1 = require("./db");
const routes_1 = require("./routes");
const crons_1 = require("./crons");
async function buildApp() {
    const app = (0, fastify_1.default)({ logger: true });
    const db = await (0, db_1.initDb)(env_1.env.DB_CONNECTIONS);
    app.decorate("db", db);
    await (0, routes_1.registerRoutes)(app);
    await (0, crons_1.registerCrons)(db);
    app.addHook("onClose", async () => {
        await db.closeAll();
    });
    return app;
}
//# sourceMappingURL=app.js.map