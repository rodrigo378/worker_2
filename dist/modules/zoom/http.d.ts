import { ZoomMeetingDetail, ZoomMeetingParticipantsResponse, ZoomMeetingsReportResponse, ZoomPastMeetingInstancesResponse, ZoomUsersResponse } from "./types/http.types";
export declare class ZoomHttpClient {
    private token;
    private expiresAtMs;
    private getToken;
    private authHeaders;
    getUsers(pageSize?: number, pageNumber?: number): Promise<ZoomUsersResponse>;
    getMeetingsRooms(usuario_id: string, from: string, to: string, pageSize: number, nextPageToken?: string): Promise<ZoomMeetingsReportResponse>;
    getMeetingsRoomsDetails(room_id: bigint): Promise<ZoomMeetingDetail>;
    getMeetingInstances(meeting_id: bigint): Promise<ZoomPastMeetingInstancesResponse>;
    getMeetingReportDetailParticipants(meetingUUID: string, nextPageToken?: string): Promise<ZoomMeetingParticipantsResponse>;
}
//# sourceMappingURL=http.d.ts.map