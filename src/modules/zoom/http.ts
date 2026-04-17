import { request } from "undici";
import { env } from "../../core/config/env";
import {
  ZoomMeetingDetail,
  ZoomMeetingReportDetail,
  ZoomMeetingsReportResponse,
  ZoomPastMeetingInstancesResponse,
  ZoomTokenResponse,
  ZoomUsersResponse,
} from "./types/http.types";

export class ZoomHttpClient {
  private token: string | null = null;
  private expiresAtMs = 0;

  private async getToken() {
    const now = Date.now();
    if (this.token && now < this.expiresAtMs - 30_000) return this.token;

    const url = "https://zoom.us/oauth/token";
    const params = new URLSearchParams({
      grant_type: "account_credentials",
      account_id: env.ZOOM.ACCOUNT_ID,
    });

    const basic = Buffer.from(
      `${env.ZOOM.CLIENT_ID}:${env.ZOOM.CLIENT_SECRET}`,
    ).toString("base64");

    const res = await request(`${url}?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
      },
    });

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(
        `Zoom token error ${res.statusCode}: ${await res.body.text()}`,
      );
    }

    const data = (await res.body.json()) as ZoomTokenResponse;
    this.token = data.access_token;
    this.expiresAtMs = now + data.expires_in * 1000;

    return this.token;
  }

  private async authHeaders() {
    return {
      Authorization: `Bearer ${await this.getToken()}`,
    };
  }

  async getUsers(pageSize = 300, pageNumber = 1, status = "active") {
    const qs = new URLSearchParams({
      page_size: String(pageSize),
      page_number: String(pageNumber),
      status,
    });

    const res = await request(`${env.ZOOM.BASE_URL}/users?${qs.toString()}`, {
      method: "GET",
      headers: await this.authHeaders(),
    });

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(
        `Zoom getUsers error ${res.statusCode}: ${await res.body.text()}`,
      );
    }

    return (await res.body.json()) as ZoomUsersResponse;
  }

  async getMeetingsRooms(
    usuarioId: string,
    from: string,
    to: string,
    pageSize: number,
    nextPageToken?: string,
  ) {
    const qs = new URLSearchParams({
      from,
      to,
      page_size: String(pageSize),
    });

    if (nextPageToken) {
      qs.set("next_page_token", nextPageToken);
    }

    const res = await request(
      `${env.ZOOM.BASE_URL}/report/users/${usuarioId}/meetings?${qs.toString()}`,
      {
        method: "GET",
        headers: await this.authHeaders(),
      },
    );

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(
        `Zoom getMeetingsRooms error ${res.statusCode}: ${await res.body.text()}`,
      );
    }

    return (await res.body.json()) as ZoomMeetingsReportResponse;
  }

  async getMeetingDetail(meetingId: bigint) {
    const res = await request(`${env.ZOOM.BASE_URL}/meetings/${meetingId}`, {
      method: "GET",
      headers: await this.authHeaders(),
    });

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(
        `Zoom getMeetingDetail error ${res.statusCode}: ${await res.body.text()}`,
      );
    }

    return (await res.body.json()) as ZoomMeetingDetail;
  }

  async getMeetingInstances(meetingId: bigint) {
    const res = await request(
      `${env.ZOOM.BASE_URL}/past_meetings/${meetingId}/instances`,
      {
        method: "GET",
        headers: await this.authHeaders(),
      },
    );

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(
        `Zoom getMeetingInstances error ${res.statusCode}: ${await res.body.text()}`,
      );
    }

    return (await res.body.json()) as ZoomPastMeetingInstancesResponse;
  }

  async getMeetingReportDetail(meetingUUID: string) {
    const encodedUUID = encodeURIComponent(encodeURIComponent(meetingUUID));

    const res = await request(
      `${env.ZOOM.BASE_URL}/report/meetings/${encodedUUID}`,
      {
        method: "GET",
        headers: await this.authHeaders(),
      },
    );

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(
        `Zoom getMeetingReportDetail error ${res.statusCode}: ${await res.body.text()}`,
      );
    }

    return (await res.body.json()) as ZoomMeetingReportDetail;
  }
}
