"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./core/app");
const env_1 = require("./core/config/env");
async function main() {
    const app = await (0, app_1.buildApp)();
    app.get("/health", async () => ({
        ok: true,
        dbs: app.db.list(),
    }));
    await app.listen({ port: env_1.env.PORT, host: env_1.env.HOST });
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map