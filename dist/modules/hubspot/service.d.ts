import { HubspotHttpClient } from "./http";
import { HubspotRepository } from "./repository";
export declare class HubspotService {
    private readonly http;
    private readonly repo;
    constructor(http: HubspotHttpClient, repo: HubspotRepository);
    sincronizarContactos(): Promise<number>;
    sincronizarConsolidado(): Promise<boolean>;
    getSyncEnCurso(): Promise<any>;
    ejecutarSincronizacionCompleta(): Promise<{
        ok: boolean;
        running: boolean;
        message: string;
        startedAt: any;
        currentStage: any;
        elapsedSeconds: number | null;
        recordsProcessed?: never;
    } | {
        ok: boolean;
        running: boolean;
        recordsProcessed: number;
        message: string;
        startedAt?: never;
        currentStage?: never;
        elapsedSeconds?: never;
    }>;
    isSyncRunning(): Promise<boolean>;
}
//# sourceMappingURL=service.d.ts.map