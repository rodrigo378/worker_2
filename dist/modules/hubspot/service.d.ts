import { HubspotHttpClient } from "./http";
import { HubspotRepository } from "./repository";
export declare class HubspotService {
    private readonly http;
    private readonly repo;
    constructor(http: HubspotHttpClient, repo: HubspotRepository);
    sincronizarContactos(): Promise<number>;
    sincronizarConsolidado(): Promise<boolean>;
    ejecutarSincronizacionCompleta(): Promise<{
        ok: boolean;
        running: boolean;
        message: string;
        recordsProcessed?: never;
    } | {
        ok: boolean;
        running: boolean;
        recordsProcessed: number;
        message: string;
    }>;
}
//# sourceMappingURL=service.d.ts.map