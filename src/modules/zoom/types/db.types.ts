// ===================================================================================
export type UpsertZoomUserInput = Partial<Zoom_User> &
  Pick<Zoom_User, "zoom_user_id">;

// ===================================================================================
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
  // instances?: ZoomMeetingInstance[];
}

// ===================================================================================
export interface Zoom_MeetingOccurrence {
  id: bigint;
  meeting_id: bigint;
  occurrence_id: string;
  start_time: Date | null;
  duration: number | null;
  status: string | null;
  // deleted: boolean;
  created_at: Date;
  updated_at: Date;
  meeting?: Zoom_Meeting;
}

// ===================================================================================
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
  attendance_status:
    | "PENDING"
    | "UPLOADED"
    | "SIN_COURSEID"
    | "ALREADY_EXISTS"
    | "SKIPPED_SHORT_INSTANCE";

  total_matriculados: number | null;
  total_participantes: number | null;

  created_at: Date;
  updated_at: Date;
  // meeting?: ZoomMeeting;
  // details?: ZoomMeetingDetail | null;
  // participants?: ZoomMeetingParticipant[];
}

export interface Zoom_MeetingParticipantRaw {
  id: bigint;
  instance_id: bigint;

  // Identidad de Zoom
  participant_id?: string | null;
  participant_user_id?: string | null;
  user_id?: string | null;

  name?: string | null;
  email?: string | null;

  // tiempos
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

  // identidad ya consolidada
  zoomUser_id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;

  // datos académicos
  c_dnidoc?: string | null;
  c_codalu?: string | null;
  c_codfac?: string | null;
  c_codesp?: string | null;
  c_codmod?: string | null;

  // resultado final (mergeado)
  firstJoin?: Date | null;
  lastLeave?: Date | null;
  duration?: number | null;

  // 👇 AQUÍ
  sessions?: Session[] | null;

  // lógica de negocio
  attendance?: boolean | null;
  late?: boolean | null;

  createdAt: Date;
  updatedAt: Date;
}
