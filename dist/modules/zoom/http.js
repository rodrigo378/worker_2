"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomHttpClient = void 0;
const undici_1 = require("undici");
const env_1 = require("../../core/config/env");
class ZoomHttpClient {
    constructor() {
        this.token = null;
        this.expiresAtMs = 0;
    }
    async getToken() {
        const now = Date.now();
        if (this.token && now < this.expiresAtMs - 30000)
            return this.token;
        const url = "https://zoom.us/oauth/token";
        const params = new URLSearchParams({
            grant_type: "account_credentials",
            account_id: env_1.env.ZOOM.ACCOUNT_ID,
        });
        const basic = Buffer.from(`${env_1.env.ZOOM.CLIENT_ID}:${env_1.env.ZOOM.CLIENT_SECRET}`).toString("base64");
        const res = await (0, undici_1.request)(`${url}?${params.toString()}`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${basic}`,
            },
        });
        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error(`Zoom token error ${res.statusCode}: ${await res.body.text()}`);
        }
        const data = (await res.body.json());
        this.token = data.access_token;
        this.expiresAtMs = now + data.expires_in * 1000;
        return this.token;
    }
    async authHeaders() {
        return {
            Authorization: `Bearer ${await this.getToken()}`,
        };
    }
    async getUsers(pageSize = 300, pageNumber = 1) {
        const qs = new URLSearchParams({
            page_size: String(pageSize),
            page_number: String(pageNumber),
        });
        const res = await (0, undici_1.request)(`${env_1.env.ZOOM.BASE_URL}/users?${qs.toString()}`, {
            method: "GET",
            headers: await this.authHeaders(),
        });
        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error(`Zoom getUsers error ${res.statusCode}: ${await res.body.text()}`);
        }
        return (await res.body.json());
    }
    async getMeetingsRooms(usuario_id, from, to, pageSize, nextPageToken) {
        const qs = new URLSearchParams({
            from,
            to,
            page_size: String(pageSize),
        });
        if (nextPageToken) {
            qs.set("next_page_token", nextPageToken);
        }
        const res = await (0, undici_1.request)(`${env_1.env.ZOOM.BASE_URL}/report/users/${usuario_id}/meetings?${qs.toString()}`, {
            method: "GET",
            headers: await this.authHeaders(),
        });
        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error(`Zoom getMeetingsRooms error ${res.statusCode}: ${await res.body.text()}`);
        }
        return (await res.body.json());
    }
    async getMeetingsRoomsDetails(room_id) {
        const res = await (0, undici_1.request)(`${env_1.env.ZOOM.BASE_URL}/meetings/${room_id}`, {
            method: "GET",
            headers: await this.authHeaders(),
        });
        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error(`Zoom getMeetingsRooms error ${res.statusCode}: ${await res.body.text()}`);
        }
        return (await res.body.json());
    }
    async getMeetingInstances(meeting_id) {
        const res = await (0, undici_1.request)(`${env_1.env.ZOOM.BASE_URL}/past_meetings/${meeting_id}/instances`, {
            method: "GET",
            headers: await this.authHeaders(),
        });
        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error(`Zoom getMeetingInstances error ${res.statusCode}: ${await res.body.text()}`);
        }
        return (await res.body.json());
    }
    async getMeetingReportDetailParticipants(meetingUUID, nextPageToken) {
        const encodedUUID = encodeURIComponent(encodeURIComponent(meetingUUID));
        const url = new URL(`${env_1.env.ZOOM.BASE_URL}/report/meetings/${encodedUUID}/participants`);
        url.searchParams.set("page_size", "300");
        if (nextPageToken) {
            url.searchParams.set("next_page_token", nextPageToken);
        }
        const res = await (0, undici_1.request)(url.toString(), {
            method: "GET",
            headers: await this.authHeaders(),
        });
        if (res.statusCode < 200 || res.statusCode >= 300) {
            throw new Error(`Zoom getMeetingParticipants error ${res.statusCode}: ${await res.body.text()}`);
        }
        return (await res.body.json());
    }
}
exports.ZoomHttpClient = ZoomHttpClient;
//# sourceMappingURL=http.js.map