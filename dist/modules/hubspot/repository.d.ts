import { Knex } from "knex";
import { DbName } from "../../core/const/db.const";
import { DbRegistry } from "../../core/db/registry";
import { Api_Hubspot, Api_Hubspot_Consolidado } from "./types/db.types";
export declare class HubspotRepository {
    private readonly registry;
    constructor(registry: DbRegistry);
    db(dbName: DbName): Knex;
    upsertManyHubspot(data: Api_Hubspot[]): Promise<boolean>;
    upsertManyHubspotConsolidado(data: Api_Hubspot_Consolidado[]): Promise<boolean>;
    getLastSyncLog(source?: string): Promise<any>;
    createSyncLog(source: string): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    getSyncEnCurso(): Promise<any>;
    updateSyncLog(id: string, data: {
        source?: string;
        status?: "running" | "success" | "failed";
        finishedAt?: boolean;
        recordsProcessed?: number | null;
        error?: string | null;
    }): Promise<boolean>;
    getContactos(): Promise<Api_Hubspot[]>;
    isSyncRunning(): Promise<any>;
}
//# sourceMappingURL=repository.d.ts.map