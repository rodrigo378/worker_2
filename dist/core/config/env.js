"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
// ===================================================================================
const BaseEnvSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3000),
    HOST: zod_1.z.string().default("0.0.0.0"),
    DB_NAMES: zod_1.z.string().min(1, "Falta DB_NAMES (ej: DB_NAMES=API_2,FINANZAS)"),
    ZOOM_OAUTH_ACCOUNT_ID: zod_1.z.string(),
    ZOOM_OAUTH_CLIENT_ID: zod_1.z.string(),
    ZOOM_OAUTH_CLIENT_SECRET: zod_1.z.string(),
    ZOOM_API_BASE: zod_1.z.string(),
    REDIS_HOST: zod_1.z.string(),
    REDIS_PORT: zod_1.z.coerce.number(),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    HUBSPOT_API_BASE: zod_1.z.string(),
    HUBSPOT_TOKEN: zod_1.z.string(),
});
const base = BaseEnvSchema.parse(process.env);
// ===================================================================================
const names = base.DB_NAMES.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const ConnSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    host: zod_1.z.string().min(1),
    port: zod_1.z.coerce.number().default(3306),
    database: zod_1.z.string().min(1),
    user: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
// ===================================================================================
exports.env = {
    PORT: base.PORT,
    HOST: base.HOST,
    HUBSPOT: {
        TOKEN: base.HUBSPOT_TOKEN,
        BASE_URL: base.HUBSPOT_API_BASE,
    },
    ZOOM: {
        BASE_URL: base.ZOOM_API_BASE,
        ACCOUNT_ID: base.ZOOM_OAUTH_ACCOUNT_ID,
        CLIENT_ID: base.ZOOM_OAUTH_CLIENT_ID,
        CLIENT_SECRET: base.ZOOM_OAUTH_CLIENT_SECRET,
    },
    REDIS: {
        HOST: base.REDIS_HOST,
        PORT: base.REDIS_PORT,
        PASSWORD: base.REDIS_PASSWORD,
    },
    DB_CONNECTIONS: names.map((name) => ConnSchema.parse({
        name,
        host: process.env[`DB_${name}_HOST`],
        port: process.env[`DB_${name}_PORT`],
        database: process.env[`DB_${name}_DATABASE`],
        user: process.env[`DB_${name}_USER`],
        password: process.env[`DB_${name}_PASSWORD`],
    })),
};
//# sourceMappingURL=env.js.map