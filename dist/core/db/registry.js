"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbRegistry = void 0;
class DbRegistry {
    constructor() {
        this.conns = new Map();
    }
    set(name, conn) {
        this.conns.set(name, conn);
    }
    get(name) {
        const conn = this.conns.get(name);
        if (!conn)
            throw new Error(`DB connection not found: ${name}`);
        return conn;
    }
    list() {
        return [...this.conns.keys()];
    }
    async closeAll() {
        for (const [, conn] of this.conns) {
            await conn.destroy();
        }
        this.conns.clear();
    }
}
exports.DbRegistry = DbRegistry;
//# sourceMappingURL=registry.js.map