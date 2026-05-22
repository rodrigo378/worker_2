import { ZoomHttpClient } from "./http";
import { ZoomRepository } from "./respository";
import { Zoom_MeetingInstance } from "./types/db.types";
export declare class ZoomService {
    private readonly zoomHttp;
    private readonly zoomRepository;
    constructor(zoomHttp: ZoomHttpClient, zoomRepository: ZoomRepository);
    sincronizarUsuarios(): Promise<boolean>;
    sincronizarMeetingsRooms(): Promise<boolean>;
    sincronizarInstancias(): Promise<Partial<Zoom_MeetingInstance>[]>;
    sincronizarParticipantesRaw(): Promise<boolean>;
    normalizarNombre: (value: string) => string;
    palabrasDebiles: Set<string>;
    obtenerPalabrasNombre: (value: string) => string[];
    levenshtein: (a: string, b: string) => number | undefined;
    similitudPalabra: (a: string, b: string) => number;
    calcularSimilitudNombre: (nombreZoom: string, nombreSigu: string) => {
        porcentaje: number;
        coincidencias: string[];
        palabrasZoom: string[];
        palabrasSigu: string[];
    };
    extraerCorreo: (value?: string | null) => string | null;
    sincronizarParticipantes(): Promise<boolean>;
    sincronizarAsistencias(): Promise<boolean>;
}
//# sourceMappingURL=service.d.ts.map