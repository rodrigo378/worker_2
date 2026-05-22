export interface ZoomTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    api_url: string;
}
export interface ZoomUser {
    id: bigint;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    email?: string;
    type?: number;
    timezone?: string;
    status?: string;
    created_at?: string;
    last_login_time?: string;
}
export interface ZoomUsersResponse {
    page_count: number;
    page_number: number;
    page_size: number;
    total_records: number;
    users: ZoomUser[];
}
export interface ZoomMeetingsReportResponse {
    from: string;
    to: string;
    page_count: number;
    page_size: number;
    total_records: number;
    next_page_token?: string;
    meetings: ZoomMeetingReportItem[];
}
export interface ZoomMeetingReportItem {
    id: bigint;
    topic?: string;
    type?: number;
}
export interface ZoomMeetingDetail {
    id: bigint;
    uuid: bigint;
    host_id: bigint;
    topic?: string;
    type?: number;
    status?: string;
    timezone?: string;
    agenda?: string;
    start_url?: string;
    join_url?: string;
    created_at?: string;
    occurrences?: ZoomMeetingOccurrence[];
    tracking_fields?: ZoomTrackingField[];
}
export interface ZoomMeetingOccurrence {
    occurrence_id: bigint;
    start_time?: string;
    duration?: number;
    status?: string;
}
export interface ZoomTrackingField {
    field: string;
    value?: string;
}
export interface ZoomPastMeetingInstancesResponse {
    meetings: ZoomMeetingInstanceUseful[];
}
export interface ZoomMeetingInstanceUseful {
    uuid: string;
    start_time?: string;
}
export interface ZoomMeetingReportDetail {
    id: bigint;
    uuid: string;
    topic?: string;
    host_id?: string;
    start_time?: string;
    end_time?: string;
    duration?: number;
    total_minutes?: number;
    participants_count?: number;
    participants?: ZoomMeetingReportParticipant[];
}
export interface ZoomMeetingReportParticipant {
    id?: string;
    name?: string;
    user_email?: string;
    join_time?: string;
    leave_time?: string;
    duration?: number;
    attentiveness_score?: string;
    failover?: boolean;
    status?: string;
    customer_key?: string;
}
export interface ZoomMeetingParticipantsResponse {
    page_count: number;
    page_size: number;
    total_records: number;
    next_page_token?: string;
    participants: ZoomMeetingParticipantItem[];
}
export interface ZoomMeetingParticipantItem {
    id?: string;
    user_id?: string;
    participant_user_id?: string;
    name?: string;
    user_email?: string;
    join_time?: string;
    leave_time?: string;
    duration?: number;
    status?: string;
    failover?: boolean;
}
//# sourceMappingURL=http.types.d.ts.map