import { DbRegistry } from "../../core/db/registry";
import { UpsertZoomUserInput, Zoom_AttendanceConfig, Zoom_Meeting, Zoom_MeetingInstance, Zoom_MeetingOccurrence, Zoom_MeetingParticipant, Zoom_MeetingParticipantRaw, Zoom_User } from "./types/db.types";
export declare class ZoomRepository {
    private readonly registry;
    constructor(registry: DbRegistry);
    private db;
    getZoomUsers(filters: {
        active?: boolean;
        role?: string;
    }): Promise<Zoom_User[]>;
    getCourseIdsByShortnames(shortnames: string[]): Promise<{
        shortname: string;
        courseid: number;
    }[]>;
    getMeetings(): Promise<Zoom_Meeting[]>;
    getTbCursoGrupoSincro(): Promise<{
        courseid: number;
        c_codfac: string;
    }[]>;
    getAttendanceConfig(): Promise<Zoom_AttendanceConfig>;
    getInstances(filters: {
        participantsSynced?: boolean;
        participantsProcessed?: boolean;
        attendance_status?: "PENDING" | "UPLOADED" | "ALREADY_EXISTS";
    }): Promise<any[]>;
    getZoomMeetingParticipantRaw(instance_id: number): Promise<Zoom_MeetingParticipantRaw[]>;
    getZoomMeetingParticipant(instance_id: number): Promise<Zoom_MeetingParticipant[]>;
    getMatriculadosCourseid(courseid: number): Promise<{
        courseid: number;
        c_codalu: number;
        c_email_institucional: string;
        nombre: string;
        c_codcur: string;
        c_grpcur: string;
        n_codper: number;
        n_codpla: number;
        c_codfac: string;
        c_codesp: string;
        c_codmod: number;
    }[]>;
    getDocentes(courseid: number, n_numdia: number): Promise<{
        c_dnidoc: string;
        n_numdia: number;
        c_hh_ini: number;
    }[]>;
    getDocenteParticipantes(instance_id: number): Promise<Zoom_MeetingParticipant | undefined>;
    sesionExistente(courseid: number, d_fecha: string, c_dnidoc: string): Promise<any>;
    insertZoomMeetingParticipantRaw(participants: Partial<Zoom_MeetingParticipantRaw>[]): Promise<true | undefined>;
    insertZoomMeetingParticipants(participants: Partial<Zoom_MeetingParticipant>[]): Promise<true | undefined>;
    upsertZoomRoom(zoomRooms: UpsertZoomUserInput[]): Promise<boolean>;
    upsertZoomMeetings(meetings: Partial<Zoom_Meeting>[]): Promise<true | undefined>;
    upsertZoomMeetingOccurrences(occurrences: Partial<Zoom_MeetingOccurrence>[]): Promise<boolean>;
    upsertZoomMeetingInstances(instances: Partial<Zoom_MeetingInstance>[]): Promise<true | undefined>;
    getMatriculadosCantindad(courseid: number, d_date: string): Promise<{
        cantidad: number;
    }>;
    getHorarioGrupo(courseid: number, n_numdia: number, c_dnidoc?: string | null): Promise<{
        n_codper: number;
        c_codfac: string;
        c_codesp: string;
        c_grpcur: string;
        n_codpla: number;
        c_codmod: number;
        c_codcur: string;
        c_dnidoc: string;
    }[]>;
    createSesiones(data: {
        n_codper: number;
        c_codmod: string | number;
        c_codfac: string;
        c_codesp: string;
        c_codcur: string;
        c_grpcur: string;
        c_dnidoc: string;
        d_fecha: string;
        d_fecha_registro: string;
        c_estado?: string;
        c_tema: string;
        n_codpla: number;
        c_sedcod?: string | null;
        tipo?: string | null;
        auto?: string | null;
        mins?: string | null;
        c_user_upd: string;
        d_fecha_upd: Date;
    }[]): Promise<any>;
    getSesiones(n_codper: number, courseid: number, d_fecha: string, c_dnidoc: string): Promise<{
        id_asistencia: number;
        n_codper: number;
        c_codmod: string | number;
        c_codfac: string;
        c_codesp: string;
        c_codcur: string;
        c_grpcur: string;
        c_dnidoc: string;
        d_fecha: string;
        d_fecha_registro: string;
        c_estado?: string;
        c_tema: string;
        n_codpla: number;
        c_sedcod?: string | null;
        tipo?: string | null;
        auto?: string | null;
        mins?: string | null;
        c_user_upd: string;
        d_fecha_upd: Date;
    }[]>;
    createAsistenciaDetalles(data: {
        id_asistencia: number;
        c_codalu: string;
        c_estado: string;
        seguir: string | Date;
    }[]): Promise<any>;
}
//# sourceMappingURL=respository.d.ts.map