import type { Knex } from "knex";
export declare class DbRegistry {
    private conns;
    set(name: string, conn: Knex): void;
    get(name: string): Knex;
    list(): string[];
    closeAll(): Promise<void>;
}
//# sourceMappingURL=registry.d.ts.map