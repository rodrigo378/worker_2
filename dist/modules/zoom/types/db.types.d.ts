export type UpsertZoomUserInput = Partial<Zoom_User> & Pick<Zoom_User, "zoom_user_id">;
export interface Zoom_User {
    id: bigint;
    zoom_user_id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    role: string | null;
    active: boolean;
    licensed: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Zoom_Meeting {
    id: bigint;
    room_id: bigint;
    shortname?: string | null;
    courseid?: number | null;
    zoom_meeting_id: bigint;
    topic?: string | null;
    agenda?: string | null;
    type?: number | null;
    joinUrl?: string | null;
    startUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
    room: Zoom_User;
    occurrences?: Zoom_MeetingOccurrence[];
}
export interface Zoom_MeetingOccurrence {
    id: bigint;
    meeting_id: bigint;
    occurrence_id: string;
    start_time: Date | null;
    duration: number | null;
    status: string | null;
    created_at: Date;
    updated_at: Date;
    meeting?: Zoom_Meeting;
}
export interface Zoom_MeetingInstance {
    id: bigint;
    meeting_id: bigint;
    occurrence_id: string | null;
    uuid: string;
    start_time: Date | null;
    end_time: Date | null;
    duration: number | null;
    status: string | null;
    participantsSynced: boolean;
    participantsProcessed: boolean;
    attendance_status: "PENDING" | "UPLOADED" | "SIN_COURSEID" | "ALREADY_EXISTS" | "SIN_DNIDOCENTE" | "SKIPPED_SHORT_INSTANCE" | "SKIPPED_FACULTAD_NO_PERMITIDA" | "SIN_SALA";
    total_matriculados: number | null;
    total_participantes: number | null;
    id_asistencia: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface Zoom_MeetingParticipantRaw {
    id: bigint;
    instance_id: bigint;
    participant_id?: string | null;
    participant_user_id?: string | null;
    user_id?: string | null;
    name?: string | null;
    email?: string | null;
    joinTime?: Date | null;
    leaveTime?: Date | null;
    duration?: number | null;
    status?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface Zoom_AttendanceConfig {
    id: number;
    gap: number;
    lateToleranceMinutes: number;
    minAttendancePercentage: number;
    minTime: number;
    createdAt: Date;
    updatedAt: Date;
}
type Session = {
    join: Date;
    leave: Date;
    duration: number;
};
export interface Zoom_MeetingParticipant {
    id: bigint;
    instance_id: bigint;
    zoomUser_id?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    c_dnidoc?: string | null;
    c_codalu?: string | null;
    c_codfac?: string | null;
    c_codesp?: string | null;
    c_codmod?: string | null;
    c_grpcur?: string | null;
    firstJoin?: Date | null;
    lastLeave?: Date | null;
    duration?: number | null;
    sessions?: Session[] | null;
    attendance?: boolean | null;
    late?: boolean | null;
    corresponde_sesion: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export {};
//# sourceMappingURL=db.types.d.ts.map