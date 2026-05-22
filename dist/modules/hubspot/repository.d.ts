import { DbRegistry } from "../../core/db/registry";
import { Api_Hubspot, Api_Hubspot_Consolidado } from "./types/db.types";
export declare class HubspotRepository {
    private readonly registry;
    constructor(registry: DbRegistry);
    private db;
    upsertManyHubspot(data: Api_Hubspot[]): Promise<boolean>;
    upsertManyHubspotConsolidado(data: Api_Hubspot_Consolidado[]): Promise<boolean>;
    hasRunningSync(source: string): Promise<boolean>;
    createSyncLog(source: string): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    finishSyncLog(id: string, data: {
        status: "success" | "failed";
        recordsProcessed?: number | null;
        error?: string | null;
    }): Promise<boolean>;
    getContactos(): Promise<Api_Hubspot[]>;
}
//# sourceMappingURL=repository.d.ts.map