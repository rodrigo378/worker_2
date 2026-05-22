"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
const knex_1 = __importDefault(require("knex"));
const registry_1 = require("./registry");
async function initDb(connections) {
    const registry = new registry_1.DbRegistry();
    for (const c of connections) {
        const k = (0, knex_1.default)({
            client: "mysql2",
            connection: {
                host: c.host,
                port: c.port,
                user: c.user,
                password: c.password,
                database: c.database,
                connectTimeout: 600000,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0,
            },
            pool: {
                min: 0,
                max: 10,
                acquireTimeoutMillis: 120000,
                idleTimeoutMillis: 3600000,
            },
        });
        await k.raw("SELECT 1");
        registry.set(c.name, k);
    }
    return registry;
}
//# sourceMappingURL=index.js.map