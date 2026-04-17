import { Knex } from "knex";
import { DbRegistry } from "../../core/db/registry";
import { DbName } from "../../core/const/db.const";
import {
  ZoomMeeting,
  ZoomMeetingDetail,
  ZoomMeetingInstance,
  ZoomMeetingOccurrence,
  ZoomMeetingParticipant,
  ZoomRoom,
  ZoomSyncLog,
} from "./types/db.types";

export class ZoomRepository {
  constructor(private readonly registry: DbRegistry) {}

  private db(dbName: DbName): Knex {
    return this.registry.get(dbName);
  }

  async getCourseid(shortname: string): Promise<number | null> {
    const [rows] = await this.db("SIGU_LECTURA").raw(
      `
      SELECT DISTINCT courseid
      FROM tb_curso_grupo_sincro
      WHERE shortname = ?
      `,
      [shortname],
    );

    return rows?.[0]?.courseid ?? null;
  }

  async getZoomRooms(active: boolean = true): Promise<ZoomRoom[]> {
    const [rows] = await this.db("API_2").raw(
      `
      SELECT *
      FROM zoom_rooms
      WHERE active = ?
      `,
      [active],
    );

    return rows as ZoomRoom[];
  }

  async getMeetings(): Promise<ZoomMeeting[]> {
    const [rows] = await this.db("API_2").raw(
      `
      SELECT *
      FROM zoom_meetings
      `,
    );

    return rows as ZoomMeeting[];
  }

  async updateMeetingShortname(
    zoom_meeting_id: bigint,
    shortname: string | null,
    courseid: number | null,
  ): Promise<void> {
    await this.db("API_2")("zoom_meetings")
      .where("zoom_meeting_id", zoom_meeting_id.toString())
      .update({
        shortname,
        courseid,
        updated_at: new Date(),
      });
  }

  async upsertZoomRoom(zoomRooms: Partial<ZoomRoom>[]): Promise<boolean> {
    if (!zoomRooms.length) return true;

    const db = this.db("API_2");
    const now = new Date();

    const rows = zoomRooms.map((room) => ({
      name: room.name ?? null,
      zoom_user_id: room.zoom_user_id ?? null,
      email: room.email ?? null,
      active: room.active ?? true,
      licensed: room.licensed ?? false,
      created_at: room.created_at ?? now,
      updated_at: room.updated_at ?? now,
    }));

    await db("zoom_rooms")
      .insert(rows)
      .onConflict("zoom_user_id")
      .merge({
        name: db.raw("VALUES(name)"),
        email: db.raw("VALUES(email)"),
        active: db.raw("VALUES(active)"),
        licensed: db.raw("VALUES(licensed)"),
        updated_at: db.raw("VALUES(updated_at)"),
      });

    return true;
  }

  async upsertZoomMeetings(meetings: Partial<ZoomMeeting>[]): Promise<void> {
    if (!meetings.length) return;

    const db = this.db("API_2");
    const now = new Date();

    const rows = meetings.map((meeting) => ({
      room_id: meeting.room_id ?? null,
      shortname: meeting.shortname ?? null,
      courseid: meeting.courseid ?? null,
      zoom_meeting_id: meeting.zoom_meeting_id ?? null,
      topic: meeting.topic ?? null,
      agenda: meeting.agenda ?? null,
      type: meeting.type ?? null,
      timezone: meeting.timezone ?? null,
      join_url: meeting.join_url ?? null,
      start_url: meeting.start_url ?? null,
      host_id: meeting.host_id ?? null,
      created_at: meeting.created_at ?? now,
      updated_at: meeting.updated_at ?? now,
    }));

    await db("zoom_meetings")
      .insert(rows)
      .onConflict("zoom_meeting_id")
      .merge({
        room_id: db.raw("VALUES(room_id)"),
        shortname: db.raw("VALUES(shortname)"),
        courseid: db.raw("VALUES(courseid)"),
        topic: db.raw("VALUES(topic)"),
        agenda: db.raw("VALUES(agenda)"),
        type: db.raw("VALUES(type)"),
        timezone: db.raw("VALUES(timezone)"),
        join_url: db.raw("VALUES(join_url)"),
        start_url: db.raw("VALUES(start_url)"),
        host_id: db.raw("VALUES(host_id)"),
        updated_at: db.raw("VALUES(updated_at)"),
      });
  }

  async upsertZoomMeetingOccurrences(
    occurrences: Partial<ZoomMeetingOccurrence>[],
  ): Promise<void> {
    if (!occurrences.length) return;

    const db = this.db("API_2");
    const now = new Date();

    const rows = occurrences.map((occurrence) => ({
      meeting_id: occurrence.meeting_id ?? null,
      occurrence_id: occurrence.occurrence_id ?? null,
      start_time: occurrence.start_time ?? null,
      duration: occurrence.duration ?? null,
      status: occurrence.status ?? null,
      deleted: occurrence.deleted ?? false,
      created_at: occurrence.created_at ?? now,
      updated_at: occurrence.updated_at ?? now,
    }));

    await db("zoom_meeting_occurrences")
      .insert(rows)
      .onConflict("occurrence_id")
      .merge({
        meeting_id: db.raw("VALUES(meeting_id)"),
        start_time: db.raw("VALUES(start_time)"),
        duration: db.raw("VALUES(duration)"),
        status: db.raw("VALUES(status)"),
        deleted: db.raw("VALUES(deleted)"),
        updated_at: db.raw("VALUES(updated_at)"),
      });
  }

  async upsertZoomMeetingInstances(
    instances: Partial<ZoomMeetingInstance>[],
  ): Promise<void> {
    if (!instances.length) return;

    const db = this.db("API_2");
    const now = new Date();

    const rows = instances.map((instance) => ({
      meeting_id: instance.meeting_id ?? null,
      occurrence_id: instance.occurrence_id ?? null,
      uuid: instance.uuid ?? null,
      start_time: instance.start_time ?? null,
      end_time: instance.end_time ?? null,
      duration: instance.duration ?? null,
      status: instance.status ?? null,
      created_at: instance.created_at ?? now,
      updated_at: instance.updated_at ?? now,
    }));

    await db("zoom_meeting_instances")
      .insert(rows)
      .onConflict("uuid")
      .merge({
        meeting_id: db.raw("VALUES(meeting_id)"),
        occurrence_id: db.raw("VALUES(occurrence_id)"),
        start_time: db.raw("VALUES(start_time)"),
        end_time: db.raw("VALUES(end_time)"),
        duration: db.raw("VALUES(duration)"),
        status: db.raw("VALUES(status)"),
        updated_at: db.raw("VALUES(updated_at)"),
      });
  }

  async upsertZoomMeetingDetails(
    details: Partial<ZoomMeetingDetail>[],
  ): Promise<void> {
    if (!details.length) return;

    const db = this.db("API_2");
    const now = new Date();

    const rows = details.map((detail) => ({
      instance_id: detail.instance_id ?? null,
      topic: detail.topic ?? null,
      host_id: detail.host_id ?? null,
      host_name: detail.host_name ?? null,
      participants_count: detail.participants_count ?? null,
      raw_json: detail.raw_json ?? null,
      synced_at: detail.synced_at ?? null,
      created_at: detail.created_at ?? now,
      updated_at: detail.updated_at ?? now,
    }));

    await db("zoom_meeting_details")
      .insert(rows)
      .onConflict("instance_id")
      .merge({
        topic: db.raw("VALUES(topic)"),
        host_id: db.raw("VALUES(host_id)"),
        host_name: db.raw("VALUES(host_name)"),
        participants_count: db.raw("VALUES(participants_count)"),
        raw_json: db.raw("VALUES(raw_json)"),
        synced_at: db.raw("VALUES(synced_at)"),
        updated_at: db.raw("VALUES(updated_at)"),
      });
  }

  async upsertZoomMeetingParticipants(
    participants: Partial<ZoomMeetingParticipant>[],
  ): Promise<void> {
    if (!participants.length) return;

    const db = this.db("API_2");
    const now = new Date();

    const rows = participants.map((participant) => ({
      instance_id: participant.instance_id ?? null,
      zoom_user_id: participant.zoom_user_id ?? null,
      role: participant.role ?? null,
      name: participant.name ?? null,
      email: participant.email ?? null,
      c_dnidoc: participant.c_dnidoc ?? null,
      c_codalu: participant.c_codalu ?? null,
      c_codfac: participant.c_codfac ?? null,
      c_codesp: participant.c_codesp ?? null,
      c_codmod: participant.c_codmod ?? null,
      join_time: participant.join_time ?? null,
      leave_time: participant.leave_time ?? null,
      duration: participant.duration ?? null,
      created_at: participant.created_at ?? now,
      updated_at: participant.updated_at ?? now,
    }));

    /**
     * Ajusta el onConflict según tu índice único real.
     * Lo ideal sería tener una clave única como:
     * (instance_id, zoom_user_id, join_time)
     * o algún identificador propio de participante.
     */
    await db("zoom_meeting_participants")
      .insert(rows)
      .onConflict(["instance_id", "zoom_user_id", "join_time"])
      .merge({
        role: db.raw("VALUES(role)"),
        name: db.raw("VALUES(name)"),
        email: db.raw("VALUES(email)"),
        c_dnidoc: db.raw("VALUES(c_dnidoc)"),
        c_codalu: db.raw("VALUES(c_codalu)"),
        c_codfac: db.raw("VALUES(c_codfac)"),
        c_codesp: db.raw("VALUES(c_codesp)"),
        c_codmod: db.raw("VALUES(c_codmod)"),
        leave_time: db.raw("VALUES(leave_time)"),
        duration: db.raw("VALUES(duration)"),
        updated_at: db.raw("VALUES(updated_at)"),
      });
  }

  async createZoomSyncLog(log: Partial<ZoomSyncLog>): Promise<void> {
    const db = this.db("API_2");
    const now = new Date();

    await db("zoom_sync_logs").insert({
      room_id: log.room_id ?? null,
      meeting_id: log.meeting_id ?? null,
      instance_id: log.instance_id ?? null,
      type: log.type ?? null,
      status: log.status ?? null,
      message: log.message ?? null,
      created_at: log.created_at ?? now,
      updated_at: log.updated_at ?? now,
    });
  }
}
