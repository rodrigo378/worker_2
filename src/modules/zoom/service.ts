import { mapWithConcurrency } from "../zoom_borrar/helpers";
import { ZoomHttpClient } from "./http";
import { ZoomRepository } from "./respository";
import { ZoomUser } from "./types/http.types";
import {
  ZoomMeeting,
  ZoomMeetingInstance,
  ZoomMeetingOccurrence,
  ZoomRoom,
} from "./types/db.types";

export class ZoomService {
  FECHA_DESDE = "2026-04-12";
  FECHA_HASTA = "2026-04-30";

  constructor(
    private readonly zoomHttp: ZoomHttpClient,
    private readonly zoomRepository: ZoomRepository,
  ) {}

  async getSincroUsuarios() {
    const page_number = 1;
    const page_size = 2000;

    const usuarios: ZoomUser[] = [];
    const resp = await this.zoomHttp.getUsers(page_size, page_number);

    const page_count = resp.page_count;
    usuarios.push(...resp.users);

    for (let i = 2; i <= page_count; i++) {
      const respPage = await this.zoomHttp.getUsers(page_size, i);
      usuarios.push(...respPage.users);
    }

    const map: Partial<ZoomRoom>[] = usuarios.map((usuario) => ({
      name: usuario.first_name
        ? `${usuario.first_name} ${usuario.last_name ?? ""}`.trim()
        : (usuario.display_name ?? "").trim(),
      zoom_user_id: usuario.id,
      email: usuario.email ?? null,
    }));

    return await this.zoomRepository.upsertZoomRoom(map);
  }

  async getReuniones() {
    const rooms = await this.zoomRepository.getZoomRooms();
    const page_size = 300;

    const meetingsPerUser = await mapWithConcurrency(rooms, 3, async (u) => {
      const resp = await this.zoomHttp.getMeetingsRooms(
        u.zoom_user_id,
        this.FECHA_DESDE,
        this.FECHA_HASTA,
        page_size,
      );

      return resp.meetings.map((meeting) => ({
        ...meeting,
        room_id: u.id,
      }));
    });

    const reuniones = meetingsPerUser.flat();
    const now = new Date();

    const meetingsToSave: Partial<ZoomMeeting>[] = reuniones.map((r) => ({
      room_id: r.room_id,
      zoom_meeting_id: BigInt(r.id),
      topic: r.topic ?? null,
      agenda: null,
      type: r.type ?? null,
      timezone: null,
      join_url: null,
      start_url: null,
      host_id: r.host_id ?? null,
      created_at: now,
      updated_at: now,
    }));

    await this.zoomRepository.upsertZoomMeetings(meetingsToSave);

    return reuniones;
  }

  async getOcurrencias() {
    const meetings = await this.zoomRepository.getMeetings();

    const ocurrencias: Partial<ZoomMeetingOccurrence>[] = [];
    const instancesRows: Partial<ZoomMeetingInstance>[] = [];
    const now = new Date();

    for (const meeting of meetings) {
      const detalle = await this.zoomHttp.getMeetingDetail(
        meeting.zoom_meeting_id,
      );

      const instances = await this.zoomHttp.getMeetingInstances(
        meeting.zoom_meeting_id,
      );

      const shortname =
        detalle.tracking_fields?.find(
          (f) => f.field?.trim().toLowerCase() === "shortname",
        )?.value ?? null;

      const courseid = shortname
        ? await this.zoomRepository.getCourseid(shortname)
        : null;

      await this.zoomRepository.updateMeetingShortname(
        meeting.zoom_meeting_id,
        shortname,
        courseid,
      );

      if (detalle.occurrences?.length) {
        const rows: Partial<ZoomMeetingOccurrence>[] = detalle.occurrences.map(
          (o) => ({
            meeting_id: meeting.id,
            occurrence_id: o.occurrence_id,
            start_time: o.start_time ? new Date(o.start_time) : null,
            duration: o.duration ?? null,
            status: o.status ?? null,
            deleted: false,
            created_at: now,
            updated_at: now,
          }),
        );

        ocurrencias.push(...rows);
      }

      if (instances.meetings?.length) {
        for (const item of instances.meetings) {
          const detail = await this.zoomHttp.getMeetingReportDetail(item.uuid);

          const matchedOccurrence = detalle.occurrences?.find((o) => {
            if (!o.start_time || !item.start_time) return false;
            return (
              new Date(o.start_time).getTime() ===
              new Date(item.start_time).getTime()
            );
          });

          instancesRows.push({
            meeting_id: meeting.id,
            occurrence_id:
              detail.occurrence_id ?? matchedOccurrence?.occurrence_id ?? null,
            uuid: item.uuid,
            start_time: detail.start_time
              ? new Date(detail.start_time)
              : item.start_time
                ? new Date(item.start_time)
                : null,
            end_time: detail.end_time ? new Date(detail.end_time) : null,
            duration: detail.duration ?? null,
            status: detail.status ?? null,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    if (ocurrencias.length) {
      await this.zoomRepository.upsertZoomMeetingOccurrences(ocurrencias);
    }

    if (instancesRows.length) {
      await this.zoomRepository.upsertZoomMeetingInstances(instancesRows);
    }

    return {
      msg: "ok",
      totalOccurrences: ocurrencias.length,
      totalInstances: instancesRows.length,
    };
  }
}
