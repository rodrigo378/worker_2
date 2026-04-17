export type ZoomTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  api_url: string;
};

export type ZoomUser = {
  id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  type?: number;
  timezone?: string;
  status?: string;
  created_at?: string;
  last_login_time?: string;
};

export type ZoomUsersResponse = {
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
  users: ZoomUser[];
};

export interface ZoomTrackingField {
  field: string;
  value: string;
}

export interface ZoomMeetingReportItem {
  uuid: string;
  id: number;
  host_id: string;
  type: number;

  topic: string;
  user_name: string;
  user_email: string;

  start_time: string;
  end_time: string;

  duration: number;
  total_minutes: number;
  participants_count: number;

  tracking_fields?: ZoomTrackingField[];
  dept?: string;
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

// ================
export interface ZoomMeetingDetail {
  id: number;
  uuid: string;
  host_id: string;
  host_email?: string;
  topic?: string;
  type?: number;
  status?: string;
  timezone?: string;
  agenda?: string;
  created_at?: string;
  start_url?: string;
  join_url?: string;
  occurrences?: ZoomMeetingOccurrenceUseful[];
  recurrence?: ZoomMeetingRecurrenceUseful;
  tracking_fields?: ZoomTrackingFieldUseful[];
}

export interface ZoomMeetingOccurrenceUseful {
  occurrence_id: string;
  start_time?: string;
  duration?: number;
  status?: string;
}

export interface ZoomMeetingRecurrenceUseful {
  type?: number;
  repeat_interval?: number;
  weekly_days?: string;
  end_date_time?: string;
}

export interface ZoomTrackingFieldUseful {
  field: string;
  value?: string;
}
export interface ZoomPastMeetingInstancesResponse {
  meetings: ZoomPastMeetingInstance[];
}

export interface ZoomPastMeetingInstance {
  uuid: string;
  start_time?: string;
}

export interface ZoomMeetingReportDetail {
  id?: number;
  uuid?: string;
  topic?: string;
  host_id?: string;
  user_email?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  participants_count?: number;
  status?: string;
  occurrence_id?: string | null;
}
