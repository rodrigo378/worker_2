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

// // ===================================================================================
// export interface ZoomMeeting {
//   id: bigint;
//   room_id: bigint;
//   shortname: string | null;
//   courseid: number | null;
//   zoom_meeting_id: bigint;
//   topic: string | null;
//   agenda: string | null;
//   type: number | null;
//   timezone: string | null;
//   join_url: string | null;
//   start_url: string | null;
//   host_id: string | null;
//   created_at: Date;
//   updated_at: Date;
//   room?: Zoom_User;
//   occurrences?: ZoomMeetingOccurrence[];
//   instances?: ZoomMeetingInstance[];
// }

// // ===================================================================================
// export interface ZoomMeetingOccurrence {
//   id: bigint;
//   meeting_id: bigint;
//   occurrence_id: string;
//   start_time: Date | null;
//   duration: number | null;
//   status: string | null;
//   deleted: boolean;
//   created_at: Date;
//   updated_at: Date;
//   meeting?: ZoomMeeting;
// }

// // ===================================================================================
// export interface ZoomMeetingInstance {
//   id: bigint;
//   meeting_id: bigint;
//   occurrence_id: string | null;
//   uuid: string;
//   start_time: Date | null;
//   end_time: Date | null;
//   duration: number | null;
//   status: string | null;
//   created_at: Date;
//   updated_at: Date;
//   meeting?: ZoomMeeting;
//   details?: ZoomMeetingDetail | null;
//   participants?: ZoomMeetingParticipant[];
// }

// // ===================================================================================
// export interface ZoomMeetingDetail {
//   id: bigint;
//   instance_id: bigint;
//   topic: string | null;
//   host_id: string | null;
//   host_name: string | null;
//   participants_count: number | null;
//   raw_json: unknown | null;
//   synced_at: Date | null;
//   created_at: Date;
//   updated_at: Date;
//   instance?: ZoomMeetingInstance;
// }

// // ===================================================================================
// export interface ZoomMeetingParticipant {
//   id: bigint;
//   instance_id: bigint;
//   zoom_user_id: string | null;
//   role: string | null;
//   name: string | null;
//   email: string | null;
//   c_dnidoc: string | null;
//   c_codalu: string | null;
//   c_codfac: string | null;
//   c_codesp: string | null;
//   c_codmod: string | null;
//   join_time: Date | null;
//   leave_time: Date | null;
//   duration: number | null;
//   created_at: Date;
//   updated_at: Date;
//   instance?: ZoomMeetingInstance;
// }

// // ===================================================================================
// export interface ZoomSyncLog {
//   id: bigint;
//   room_id: bigint | null;
//   meeting_id: bigint | null;
//   instance_id: bigint | null;
//   type: string;
//   status: string;
//   message: string | null;
//   created_at: Date;
//   updated_at: Date;
// }
