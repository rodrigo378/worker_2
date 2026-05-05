import { ZoomHttpClient } from "./http";
import { ZoomRepository } from "./respository";
import {
  UpsertZoomUserInput,
  Zoom_Meeting,
  Zoom_MeetingInstance,
  Zoom_MeetingOccurrence,
  Zoom_MeetingParticipant,
} from "./types/db.types";
import { ZoomUser } from "./types/http.types";

export class ZoomService {
  // FECHA_DESDE = new Date()
  // FECHA_HASTA = "2026-04-30";

  constructor(
    private readonly zoomHttp: ZoomHttpClient,
    private readonly zoomRepository: ZoomRepository,
  ) {}

  async sincronizarUsuarios() {
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

    const map: UpsertZoomUserInput[] = usuarios.map((usuario) => ({
      zoom_user_id: String(usuario.id),
      first_name: usuario.first_name ?? null,
      last_name: usuario.last_name ?? null,
      display_name: usuario.display_name ?? null,
      email: usuario.email ?? null,
      licensed: usuario.type === 2 ? true : false,
    }));

    return await this.zoomRepository.upsertZoomRoom(map);
  }

  async sincronizarMeetingsRooms() {
    const desdeDate = new Date();
    desdeDate.setDate(desdeDate.getDate() - 7);

    const hastaDate = new Date();
    hastaDate.setDate(hastaDate.getDate() + 30);

    const from: string = desdeDate.toISOString();
    const to: string = hastaDate.toISOString();
    const users = await this.zoomRepository.getZoomUsers({ active: true });
    const page_size = 300;

    const meetings: Partial<Zoom_Meeting>[] = [];
    const ocurrences: Partial<Zoom_MeetingOccurrence>[] = [];

    for (const user of users) {
      let next_page_token = "";

      do {
        const res = await this.zoomHttp.getMeetingsRooms(
          user.zoom_user_id,
          from,
          to,
          page_size,
          next_page_token,
        );
        console.log("res => ", res);

        next_page_token = res.next_page_token || "";

        res.meetings.map((meeting) => {
          if (meeting.type === 1) return;

          meetings.push({
            room_id: user.id,
            zoom_meeting_id: meeting.id,
            topic: meeting.topic ?? "",
            type: meeting.type ?? null,
          });
        });
      } while (next_page_token);
    }

    for (const meeting of meetings) {
      console.log("meeting => ", meeting);

      const details = await this.zoomHttp.getMeetingsRoomsDetails(
        meeting.zoom_meeting_id!,
      );
      const shortname =
        details.tracking_fields?.find(
          (f) => f.field?.trim().toLowerCase() === "shortname",
        )?.value ?? null;

      meeting.shortname = shortname;
      meeting.agenda = details.agenda ?? "";

      ocurrences.push(
        ...(details.occurrences?.map((oc) => ({
          meeting_id: meeting.zoom_meeting_id!,
          occurrence_id: String(oc.occurrence_id),
          start_time: oc.start_time ? new Date(oc.start_time) : null,
          duration: oc.duration ?? null,
          status: oc.status ?? null,
        })) ?? []),
      );
    }

    const shortnames = [
      ...new Set(
        meetings
          .map((m) => m.shortname?.trim())
          .filter((s): s is string => !!s),
      ),
    ];

    const courseids =
      await this.zoomRepository.getCourseIdsByShortnames(shortnames);

    const courseIdsMap = new Map(
      courseids.map((c) => [c.shortname, c.courseid]),
    );

    for (const meeting of meetings) {
      const key = meeting.shortname;
      meeting.courseid = key ? (courseIdsMap.get(key) ?? null) : null;
    }
    await this.zoomRepository.upsertZoomMeetings(meetings);

    const meetingsBd = await this.zoomRepository.getMeetings();
    const meetingsMap = new Map(
      meetingsBd.map((m) => [m.zoom_meeting_id, m.id]),
    );

    const occurrencesFinal: Partial<Zoom_MeetingOccurrence>[] = [];

    for (const oc of ocurrences) {
      const meetingId = meetingsMap.get(oc.meeting_id!);

      if (!meetingId) {
        console.log("no tiene => ", meetingId);
        continue;
      }

      occurrencesFinal.push({
        meeting_id: meetingId,
        occurrence_id: String(oc.occurrence_id),
        start_time: oc.start_time ? new Date(oc.start_time) : null,
        duration: oc.duration ?? null,
        status: oc.status ?? null,
      });
    }

    await this.zoomRepository.upsertZoomMeetingOccurrences(occurrencesFinal);

    return true;
  }

  async sincronizarInstancias() {
    const meetingRooms = await this.zoomRepository.getMeetings();

    const instances: Partial<Zoom_MeetingInstance>[] = [];

    for (const mr of meetingRooms) {
      console.log("mr => ", mr);

      const res = await this.zoomHttp.getMeetingInstances(mr.zoom_meeting_id);

      instances.push(
        ...res.meetings.map((m) => ({
          uuid: m.uuid,
          start_time: m.start_time ? new Date(m.start_time) : null,
          meeting_id: mr.id,
        })),
      );
    }

    await this.zoomRepository.upsertZoomMeetingInstances(instances);
    return instances;
  }

  async sincronizarParticipantesRaw() {
    const instances = await this.zoomRepository.getInstances({
      participantsSynced: false,
    });

    for (const instance of instances) {
      console.log("instance => ", instance);

      try {
        let nextPageToken: string | undefined = undefined;
        const participants = [];

        do {
          const res = await this.zoomHttp.getMeetingReportDetailParticipants(
            instance.uuid,
            nextPageToken,
          );

          participants.push(...(res.participants ?? []));

          nextPageToken = res.next_page_token;
        } while (nextPageToken);

        const rows = participants.map((p) => ({
          instance_id: instance.id,

          participant_id: p.id ?? null,
          participant_user_id: p.participant_user_id ?? null,
          user_id: p.user_id ?? null,

          name: p.name ?? null,
          email: p.user_email ?? null,

          joinTime: p.join_time ? new Date(p.join_time) : null,
          leaveTime: p.leave_time ? new Date(p.leave_time) : null,
          duration: p.duration ?? null,

          status: p.status ?? null,
        }));

        if (rows.length > 0) {
          await this.zoomRepository.insertZoomMeetingParticipantRaw(rows);
        }

        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            participantsSynced: true,
            updated_at: new Date(),
          },
        ]);
      } catch (error) {
        console.error(
          `Error sincronizando participants instance ${instance.id}`,
          error,
        );
      }
    }

    return true;
  }

  async sincronizarParticipantes() {
    const config = await this.zoomRepository.getAttendanceConfig();
    const gapMs = config.gap * 60 * 1000;
    const rooms = (
      await this.zoomRepository.getZoomUsers({ role: "host" })
    ).map((z) => z.zoom_user_id);

    const instances = (
      await this.zoomRepository.getInstances({
        participantsProcessed: false,
        participantsSynced: true,
      })
    ).slice(0, 4);

    for (const instance of instances) {
      console.log("instance => ", instance);

      const raw = await this.zoomRepository.getZoomMeetingParticipantRaw(
        instance.id,
      );
      const matriculados = await this.zoomRepository.getMatriculadosCourseid(
        instance.courseid,
      );

      const map = new Map<string, any[]>();

      for (const p of raw) {
        const key =
          p.email?.trim().toLowerCase() ||
          p.name?.trim().toUpperCase() ||
          `unknown_${p.user_id ?? Math.random()}`;

        if (!map.has(key)) {
          map.set(key, []);
        }

        const arr = map.get(key)!;
        arr.push(p);
      }

      const procesados: Partial<Zoom_MeetingParticipant>[] = [];

      //===================================================================
      for (const [, sesiones] of map.entries()) {
        sesiones.sort(
          (a, b) =>
            new Date(a.join_time).getTime() - new Date(b.join_time).getTime(),
        );

        let actual: any = null;

        const bloques: {
          join: Date;
          leave: Date;
          duration: number;
        }[] = [];

        for (const s of sesiones) {
          const join = new Date(s.join_time);
          const leave = new Date(s.leave_time);

          if (!actual) {
            actual = { ...s };
            continue;
          }

          const gap = join.getTime() - new Date(actual.leave_time).getTime();

          const overlap =
            join.getTime() <= new Date(actual.leave_time).getTime();

          if (gap <= gapMs || overlap) {
            // 🔗 merge
            actual.leave_time = new Date(
              Math.max(leave.getTime(), new Date(actual.leave_time).getTime()),
            );
          } else {
            // 🔹 guardar bloque
            const start = new Date(actual.join_time);
            const end = new Date(actual.leave_time);

            bloques.push({
              join: start,
              leave: end,
              duration: (end.getTime() - start.getTime()) / 1000,
            });

            actual = { ...s };
          }
        }

        if (actual) {
          const start = new Date(actual.join_time);
          const end = new Date(actual.leave_time);

          bloques.push({
            join: start,
            leave: end,
            duration: (end.getTime() - start.getTime()) / 1000,
          });
        }

        const firstJoin = bloques[0]?.join ?? null;
        const lastLeave = bloques[bloques.length - 1]?.leave ?? null;
        const totalDuration = bloques.reduce((sum, b) => sum + b.duration, 0);

        procesados.push({
          instance_id: instance.id,
          zoomUser_id: sesiones[0].participant_id ?? null,
          name: sesiones[0].name ?? null,
          email: sesiones[0].email ?? null,
          firstJoin,
          lastLeave,
          duration: totalDuration,
          sessions: bloques,
          attendance: null,
          late: null,
        });
      }
      //===================================================================

      //Procesar host
      const host = procesados.find((pr) =>
        rooms.includes(pr.zoomUser_id ?? ""),
      );
      if (!host) {
        continue;
      }

      const sessions = host?.sessions ?? [];
      const start_time = sessions[0]?.join;
      const end_time = sessions[sessions.length - 1]?.leave;
      const duration = sessions.reduce((sum, s) => sum + s.duration, 0);
      host.role = "host";

      const n_numdia = start_time ? start_time.getDay() : null; // 0=Dom, 1=Lun... 6=Sab

      const docentesSigu = await this.zoomRepository.getDocentes(
        instance.courseid,
        n_numdia!,
      );

      let docenteDni: string | null = null;
      if (docentesSigu.length === 1) {
        docenteDni = docentesSigu[0]?.c_dnidoc ?? null;
      } else if (docentesSigu.length > 1 && start_time) {
        const hostHour = start_time.getHours().toString().padStart(2, "0");

        const match = docentesSigu.find((d: any) => {
          const horaDocente = String(d.c_hh_ini ?? "").padStart(2, "0");
          return horaDocente === hostHour;
        });

        docenteDni = match?.c_dnidoc ?? docentesSigu[0]?.c_dnidoc ?? null;
      }

      host.c_dnidoc = docenteDni;
      // host.cDnidoc = "22222222";

      for (const procesado of procesados) {
        if (procesado.role === "host") continue;

        const matriculado = matriculados.find((m) => {
          if (procesado.email && m.c_email_institucional) {
            return (
              procesado.email.trim().toLowerCase() ===
              m.c_email_institucional.trim().toLowerCase()
            );
          }
          if (procesado.name && m.nombre) {
            const palabrasZoom = procesado.name
              .trim()
              .toUpperCase()
              .split(/\s+/);
            if (palabrasZoom.length < 2) return false;
            const nombreMatriculado = m.nombre.trim().toUpperCase();
            return palabrasZoom.every((palabra) =>
              nombreMatriculado.includes(palabra),
            );
          }
          return false;
        });

        procesado.c_codalu = matriculado?.c_codalu
          ? String(matriculado.c_codalu)
          : null;
        procesado.c_codfac = matriculado?.c_codfac ?? null;
        procesado.c_codesp = matriculado?.c_codesp ?? null;
        procesado.c_codmod = matriculado?.c_codmod
          ? String(matriculado.c_codmod)
          : null;

        procesado.role = "student";
        // Attendance
        if (start_time && end_time && procesado.duration != null) {
          const meetingDuration =
            (end_time.getTime() - start_time.getTime()) / 1000; // en segundos
          const percentage = procesado.duration / meetingDuration;
          procesado.attendance = percentage >= config.minAttendancePercentage;
        } else {
          procesado.attendance = false;
        }

        // Late
        if (start_time && procesado.firstJoin) {
          const toleranceMs = config.lateToleranceMinutes * 60 * 1000;
          const diff = procesado.firstJoin.getTime() - start_time.getTime();
          procesado.late = diff > toleranceMs;
        } else {
          procesado.late = null;
        }
      }

      const fechaClase = start_time
        ? [
            start_time.getFullYear(),
            String(start_time.getMonth() + 1).padStart(2, "0"),
            String(start_time.getDate()).padStart(2, "0"),
          ].join("-")
        : null;

      if (!fechaClase) {
        throw new Error("No se pudo obtener la fecha de inicio de la clase.");
      }

      await this.zoomRepository.insertZoomMeetingParticipants(procesados);
      const cantidad = await this.zoomRepository.getMatriculadosCantindad(
        instance.courseid,
        fechaClase,
      );

      await this.zoomRepository.upsertZoomMeetingInstances([
        {
          uuid: instance.uuid,
          meeting_id: instance.meeting_id,
          start_time: start_time ? new Date(start_time) : null,
          end_time: end_time ? new Date(end_time) : null,
          duration,
          participantsProcessed: true,
          updated_at: new Date(),
          total_participantes: procesados.length - 1,
          total_matriculados: cantidad.cantidad,
        },
      ]);
    }

    return true;
  }

  async sincronizarAsistencias() {
    const instances = await this.zoomRepository.getInstances({
      attendance_status: "PENDING",
    });

    for (const instance of instances) {
      if (!instance.courseid) {
        console.warn(`Instance ${instance.id} sin courseid, skipeando`);
        continue;
      }

      console.log("====================================");
      console.log("instance => ", instance);

      const d_fecha = instance.start_time
        ? new Date(instance.start_time.getTime() - 5 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
        : null;

      const dniDocente = await this.zoomRepository.getDocenteParticipantes(
        instance.id,
      );
      console.log("aca dniDocente => ", dniDocente);
      console.log("courseid => ", instance.courseid);
      console.log("d_fecha => ", d_fecha);
      console.log("cDnidoc => ", dniDocente?.c_dnidoc);

      const sesion = await this.zoomRepository.sesionExistente(
        instance.courseid,
        d_fecha ?? "",
        dniDocente?.c_dnidoc ?? "",
      );
      console.log("sesion => ", sesion);

      if (sesion && sesion.length > 0) {
        console.log("sesion existente => ", instance.id);

        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            attendance_status: "ALREADY_EXISTS",
            updated_at: new Date(),
          },
        ]);
        continue;
      }

      console.log("sesion pendiente => ", instance.id);

      console.log("====================================");
    }
  }
}
