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

// ===================================================================================
export class ZoomService {
  // ===================================================================================
  constructor(
    private readonly zoomHttp: ZoomHttpClient,
    private readonly zoomRepository: ZoomRepository,
  ) {}

  // ===================================================================================
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

  // ===================================================================================
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

  // ===================================================================================
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

  // ===================================================================================
  async sincronizarParticipantesRaw() {
    const instances = await this.zoomRepository.getInstances({
      participantsSynced: false,
    });
    const rooms = (
      await this.zoomRepository.getZoomUsers({ role: "host" })
    ).map((z) => z.zoom_user_id);

    for (const instance of instances) {
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

        const tieneHost = participants.some((p) => rooms.includes(p.id ?? ""));

        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            participantsSynced: true,
            updated_at: new Date(),
            ...(tieneHost ? {} : { attendance_status: "SIN_SALA" }),
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

  // ===================================================================================
  normalizarNombre = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");

  // ===================================================================================
  palabrasDebiles = new Set(["DE", "DEL", "LA", "LAS", "LOS", "Y"]);

  // ===================================================================================
  obtenerPalabrasNombre = (value: string) =>
    this.normalizarNombre(value)
      .split(" ")
      .filter((palabra) => palabra.length >= 3)
      .filter((palabra) => !this.palabrasDebiles.has(palabra));

  // ===================================================================================
  levenshtein = (a: string, b: string) => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => {
        if (i === 0) return j;
        if (j === 0) return i;
        return 0;
      }),
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const costo = a[i - 1] === b[j - 1] ? 0 : 1;

        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j - 1]! + costo,
        );
      }
    }

    return matrix[a.length]![b.length];
  };

  // ===================================================================================
  similitudPalabra = (a: string, b: string) => {
    if (a === b) return 1;

    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 0;

    const distancia = this.levenshtein(a, b);

    return 1 - distancia! / maxLength;
  };

  // ===================================================================================
  calcularSimilitudNombre = (nombreZoom: string, nombreSigu: string) => {
    const palabrasZoom = this.obtenerPalabrasNombre(nombreZoom);
    const palabrasSigu = this.obtenerPalabrasNombre(nombreSigu);

    if (palabrasZoom.length < 2 || palabrasSigu.length < 2) {
      return {
        porcentaje: 0,
        coincidencias: [],
        palabrasZoom,
        palabrasSigu,
      };
    }

    const coincidencias = palabrasZoom.filter((palabraZoom) => {
      return palabrasSigu.some((palabraSigu) => {
        const score = this.similitudPalabra(palabraZoom, palabraSigu);

        return score >= 0.82;
      });
    });

    const porcentaje = coincidencias.length / palabrasZoom.length;

    return {
      porcentaje,
      coincidencias,
      palabrasZoom,
      palabrasSigu,
    };
  };

  // ===================================================================================
  extraerCorreo = (value?: string | null) => {
    if (!value) return null;

    const match = value
      .trim()
      .toLowerCase()
      .match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);

    return match?.[0] ?? null;
  };

  // ===================================================================================
  async sincronizarParticipantes() {
    const config = await this.zoomRepository.getAttendanceConfig();
    const gapMs = config.gap * 60 * 1000;
    const rooms = (
      await this.zoomRepository.getZoomUsers({ role: "host" })
    ).map((z) => z.zoom_user_id);

    const instances = await this.zoomRepository.getInstances({
      participantsProcessed: false,
      participantsSynced: true,
      attendance_status: "PENDING",
    }); //.filter((i) => [945].includes(i.id)); //.filter((i) => [118].includes(i.meeting_id));

    for (const instance of instances) {
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
        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            participantsProcessed: true,
            updated_at: new Date(),
            attendance_status: "SIN_SALA",
          },
        ]);
        continue;
      }

      const sessions = host?.sessions ?? [];
      const start_time = sessions[0]?.join;
      const end_time = sessions[sessions.length - 1]?.leave;
      const duration = sessions.reduce((sum, s) => sum + s.duration, 0);
      host.role = "host";

      const n_numdia = start_time ? start_time.getDay() : null;

      const docentesSigu = await this.zoomRepository.getDocentes(
        instance.courseid,
        n_numdia!,
      );

      const dataGrupos = await this.zoomRepository.getHorarioGrupo(
        instance.courseid,
        n_numdia!,
      );

      const a_c_grpcur = dataGrupos.map((d) => d.c_grpcur);
      console.log("a_c_grpcur => ", a_c_grpcur);

      let docenteDni: string | null = null;
      if (docentesSigu.length === 1) {
        docenteDni = docentesSigu[0]?.c_dnidoc ?? null;
      } else if (docentesSigu.length > 1 && start_time) {
        const hostHour = start_time.getHours().toString().padStart(2, "0");
        console.log("hostHour => ", hostHour);

        const match = docentesSigu.find((d: any) => {
          const horaDocente = String(d.c_hh_ini ?? "").padStart(2, "0");
          return horaDocente === hostHour;
        });

        docenteDni = match?.c_dnidoc ?? docentesSigu[0]?.c_dnidoc ?? null;
      }

      host.c_dnidoc = docenteDni;

      for (const procesado of procesados) {
        if (procesado.role === "host") continue;

        const correoZoom =
          this.extraerCorreo(procesado.email) ??
          this.extraerCorreo(procesado.name);

        let matriculado = matriculados.find((m) => {
          if (!correoZoom || !m.c_email_institucional) return false;

          return correoZoom === m.c_email_institucional.trim().toLowerCase();
        });

        if (!matriculado && procesado.name) {
          const candidatos = matriculados
            .map((m) => {
              if (!m.nombre) return null;

              const resultado = this.calcularSimilitudNombre(
                procesado.name!,
                m.nombre,
              );

              return {
                matriculado: m,
                porcentaje: resultado.porcentaje,
                coincidencias: resultado.coincidencias,
                palabrasZoom: resultado.palabrasZoom,
                palabrasSigu: resultado.palabrasSigu,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .filter((item) => item.porcentaje >= 0.75)
            .sort((a, b) => b.porcentaje - a.porcentaje);

          const mejor = candidatos[0];
          const segundo = candidatos[1];

          if (
            mejor &&
            (!segundo || mejor.porcentaje - segundo.porcentaje >= 0.15)
          ) {
            matriculado = mejor.matriculado;
          } else {
            console.warn(
              "No se asignó alumno por coincidencia ambigua o baja",
              {
                zoom: procesado.name,
                candidatos: candidatos.slice(0, 5).map((c) => ({
                  c_codalu: c.matriculado.c_codalu,
                  nombre: c.matriculado.nombre,
                  porcentaje: c.porcentaje,
                  coincidencias: c.coincidencias,
                })),
              },
            );
          }
        }

        procesado.c_codalu = matriculado?.c_codalu
          ? String(matriculado.c_codalu)
          : null;
        procesado.c_codfac = matriculado?.c_codfac ?? null;
        procesado.c_codesp = matriculado?.c_codesp ?? null;
        procesado.c_codmod = matriculado?.c_codmod
          ? String(matriculado.c_codmod)
          : null;
        procesado.c_grpcur = matriculado?.c_grpcur ?? null;
        procesado.corresponde_sesion = a_c_grpcur.includes(
          matriculado?.c_grpcur ?? "",
        );

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

      const procesadosFinal = Array.from(
        procesados
          .reduce((map, p) => {
            const isHost = p.role === "host";

            const key = isHost
              ? `host-${p.zoomUser_id ?? p.name ?? "unknown"}`
              : p.c_codalu
                ? `student-${p.c_codalu}`
                : `unmatched-${p.zoomUser_id ?? p.email ?? p.name ?? Math.random()}`;

            const actual = map.get(key);
            const sesionesActuales = Array.isArray(p.sessions)
              ? p.sessions
              : [];

            if (!actual) {
              map.set(key, {
                ...p,
                duration: Number(p.duration ?? 0),
                sessions: sesionesActuales,
              });

              return map;
            }

            const firstJoinActual = actual.firstJoin
              ? new Date(actual.firstJoin)
              : null;
            const firstJoinNuevo = p.firstJoin ? new Date(p.firstJoin) : null;

            const lastLeaveActual = actual.lastLeave
              ? new Date(actual.lastLeave)
              : null;
            const lastLeaveNuevo = p.lastLeave ? new Date(p.lastLeave) : null;

            actual.duration =
              Number(actual.duration ?? 0) + Number(p.duration ?? 0);

            if (
              firstJoinNuevo &&
              (!firstJoinActual || firstJoinNuevo < firstJoinActual)
            ) {
              actual.firstJoin = firstJoinNuevo;
            }

            if (
              lastLeaveNuevo &&
              (!lastLeaveActual || lastLeaveNuevo > lastLeaveActual)
            ) {
              actual.lastLeave = lastLeaveNuevo;
            }

            actual.sessions = [
              ...(Array.isArray(actual.sessions) ? actual.sessions : []),
              ...sesionesActuales,
            ].sort(
              (a, b) => new Date(a.join).getTime() - new Date(b.join).getTime(),
            );

            actual.c_codalu = actual.c_codalu ?? p.c_codalu ?? null;
            actual.c_codfac = actual.c_codfac ?? p.c_codfac ?? null;
            actual.c_codesp = actual.c_codesp ?? p.c_codesp ?? null;
            actual.c_codmod = actual.c_codmod ?? p.c_codmod ?? null;
            actual.c_grpcur = actual.c_grpcur ?? p.c_grpcur ?? null;

            actual.corresponde_sesion =
              Number(actual.corresponde_sesion ?? 0) === 1 ||
              Number(p.corresponde_sesion ?? 0) === 1;

            return map;
          }, new Map<string, Partial<Zoom_MeetingParticipant>>())
          .values(),
      );

      for (const procesado of procesadosFinal) {
        if (procesado.role === "host") continue;

        if (start_time && end_time && procesado.duration != null) {
          const meetingDuration =
            (end_time.getTime() - start_time.getTime()) / 1000;

          const percentage = Number(procesado.duration) / meetingDuration;

          procesado.attendance = percentage >= config.minAttendancePercentage;
        } else {
          procesado.attendance = false;
        }

        if (start_time && procesado.firstJoin) {
          const toleranceMs = config.lateToleranceMinutes * 60 * 1000;
          const diff =
            new Date(procesado.firstJoin).getTime() - start_time.getTime();

          procesado.late = diff > toleranceMs;
        } else {
          procesado.late = null;
        }
      }

      await this.zoomRepository.insertZoomMeetingParticipants(procesadosFinal);

      // await this.zoomRepository.insertZoomMeetingParticipants(procesados);
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
          total_participantes: procesadosFinal.filter((p) => p.role !== "host")
            .length,
          total_matriculados: cantidad.cantidad,
          attendance_status:
            duration < config.minTime * 60
              ? "SKIPPED_SHORT_INSTANCE"
              : instance.attendance_status,
        },
      ]);
    }

    return true;
  }

  // ===================================================================================
  async sincronizarAsistencias() {
    const instances = (
      await this.zoomRepository.getInstances({
        participantsProcessed: true,
        participantsSynced: true,
        attendance_status: "PENDING",
      })
    )
      // ).filter((i) =>
      //   [
      //     // 118
      //     4376,
      //   ].includes(i.meeting_id),
      .filter((i) =>
        [
          98588, 98606, 98576, 98607, 98593, 98623, 98612, 98543, 98614, 98561,
          98589, 98538, 98578, 98549, 98540, 98615, 98616, 98565, 98573, 98595,
          98546, 98603, 98550, 98585, 98572, 98554, 98555, 98579, 98581, 98560,
          98601, 105334, 105335, 105313, 105290, 105271, 105328, 105272, 105341,
          105342, 105336, 105316, 105317, 105314, 105305, 105330, 105329,
          105338, 105275, 105319, 105273, 105322, 105308, 105270, 105362,
          105292, 105284, 105301, 105298, 105294, 105286, 105311, 105285,
          105297, 105312, 105325, 105287, 105353, 105331, 105269, 105283,
          105268, 105320, 105282, 105332, 105306, 112124, 112111, 112136,
          112175, 112151, 112135, 112147, 112113, 112119, 112125, 112152,
          112137, 112176, 112131, 112144, 112116, 112121, 112120, 112115,
          112127, 112138, 112155, 112132, 112139, 112133, 112148, 112145,
          112149, 112134, 112122, 112123, 129561, 129560, 129625, 129624,
          129633, 129555, 129591, 129639, 129611, 129604, 129627, 129568,
          129626, 129551, 129569, 129592, 129563, 129564, 129594, 129557,
          129566, 129612, 129598, 129571, 129621, 129545, 129552, 129577,
          129546, 129587, 129608, 129586, 129602, 129581, 129582, 129572,
          129600, 129583, 129632, 129543, 129617, 129590, 129606, 129559,
          129558, 129635, 129599, 129573, 129638, 129554, 129596, 129614,
          129601, 129544, 129609, 129576, 129575, 139082, 139083, 139077,
          139075, 139086, 139085, 139079, 139078, 146913, 146902, 146929,
          146917, 146930, 146906, 146904, 146918, 146925, 146912, 146915,
          146942, 146900, 185332, 146944, 146943, 146924, 146898, 146922,
          146935, 146920, 146923, 185302, 185306, 185362, 185350, 185337,
          185382, 185338, 185320, 185369, 185303, 185374, 185375, 185321,
          185297, 185315, 185355, 185381, 185328, 185316, 185370, 185371,
          185339, 185376, 185356, 185383, 185353, 185357, 185298, 185308,
          185325, 185340, 185372, 185351, 185352, 185307, 185364, 185360,
          185345, 185347, 185317, 185343, 185379, 185318, 185354, 185312,
          185366, 185324, 185333, 185326, 185314, 185299, 185334, 185322,
          185384, 185380, 185323, 185359, 185341, 185346, 185327, 185365,
          185344, 185305, 185313, 185295, 185331, 192525, 185348, 185330,
          185349, 185342, 185319, 185367, 185368, 185335, 185361, 185336,
          185329, 185300, 185358, 185301, 185296, 185373, 192469, 192540,
          192483, 192470, 192567, 192513, 192568, 192484, 192560, 192463,
          192462, 192588, 192578, 192494, 192585, 192460, 192551, 192471,
          192488, 192587, 192569, 192542, 192495, 192541, 192455, 192570,
          192552, 192464, 192496, 192456, 192457, 192557, 192485, 192507,
          192553, 192579, 192550, 192489, 192461, 192535, 192536, 192475,
          192565, 192528, 192564, 192584, 192458, 192500, 192566, 192509,
          192459, 192526, 192517, 192527, 192472, 192586, 192571, 192520,
          192572, 192514, 192473, 192558, 192545, 192544, 192508, 192561,
          192486, 192559, 192594, 192626, 192644, 192617, 192643, 192595,
          192607, 192608, 192618, 192637, 192636, 192592, 192593, 192649,
          192650, 192634, 192633, 192596, 192628, 192597, 192645, 192627,
          192619, 192598, 192599, 192647, 192646, 192639, 192620, 192638,
          192615, 192629, 192632, 192658, 192591, 192642, 192609, 192610,
          192613, 192616, 192614, 192612, 192624, 192625, 192604, 192603,
          192611, 192602, 192622, 192623, 192605, 192635, 192657, 192600,
          192590, 192606, 192601, 192640, 192648, 192589, 192631, 192641,
          192630, 192621, 192652, 192487, 192529, 192577, 192510, 192477,
          192530, 192478, 192511, 192573, 192562, 192465, 192497, 192505,
          192659, 192661, 192522, 192518, 192538, 192490, 192521, 192479,
          192480, 192574, 192563, 192546, 192532, 192653, 192466, 192575,
          192547, 192515, 192660, 192519, 192662, 192663, 192554, 192576,
          192656, 192580, 192655, 192492, 192516, 192582, 192491, 192548,
          192651, 192481, 192467, 192482, 192583, 192556, 192498, 192654,
          192512, 192499, 192468, 192534, 192506, 192555, 192523, 192524,
          192493, 192664, 192665, 192502,
        ].includes(i.id),
      );

    // const instances = await this.zoomRepository.getInstances({
    //   participantsProcessed: true,
    //   participantsSynced: true,
    //   attendance_status: "PENDING",
    // });

    const tbCursoGrupoSincro =
      await this.zoomRepository.getTbCursoGrupoSincro();

    for (const instance of instances) {
      if (!instance.courseid) {
        console.warn(`Instance ${instance.id} sin courseid, skipeando`);
        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            attendance_status: "SIN_COURSEID",
            updated_at: new Date(),
          },
        ]);
        continue;
      }

      const cursoGrupo = tbCursoGrupoSincro.find(
        (item) => Number(item.courseid) === Number(instance.courseid),
      );
      const facultadesPermitidas = ["E", "S"];

      if (!cursoGrupo) {
        console.warn(
          `Instance ${instance.id} con courseid ${instance.courseid} no existe en tb_curso_grupo_sincro`,
        );

        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            attendance_status: "SIN_COURSEID",
            updated_at: new Date(),
          },
        ]);

        continue;
      }

      if (!facultadesPermitidas.includes(cursoGrupo.c_codfac)) {
        console.warn(
          `Instance ${instance.id} omitida. Courseid ${instance.courseid} pertenece a facultad ${cursoGrupo.c_codfac}`,
        );

        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            attendance_status: "SKIPPED_FACULTAD_NO_PERMITIDA",
            updated_at: new Date(),
          },
        ]);

        continue;
      }

      console.log("====================================");
      console.log("instacia.id => ", instance.id);
      console.log("courseid => ", instance.courseid);
      console.log(
        "instance.start_time => ",
        new Date(
          instance.start_time.getTime() - 5 * 60 * 60 * 1000,
        ).toISOString(),
      );

      const d_fecha = instance.start_time
        ? new Date(instance.start_time.getTime() - 5 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
        : null;

      const dniDocente = await this.zoomRepository.getDocenteParticipantes(
        instance.id,
      );

      if (!dniDocente?.c_dnidoc) {
        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            attendance_status: "SIN_DNIDOCENTE",
            updated_at: new Date(),
          },
        ]);
        console.log("sin docente detectado");
        continue;
      }

      const sesion: any[] = await this.zoomRepository.sesionExistente(
        instance.courseid,
        d_fecha ?? "",
        dniDocente?.c_dnidoc ?? "",
      );

      if (sesion && sesion.length > 0) {
        await this.zoomRepository.upsertZoomMeetingInstances([
          {
            uuid: instance.uuid,
            meeting_id: instance.meeting_id,
            attendance_status: "ALREADY_EXISTS",
            id_asistencia: sesion.map((s) => s.id_asistencia).join(","),
            updated_at: new Date(),
          },
        ]);
        continue;
      }

      const sesionGrupo = await this.zoomRepository.getHorarioGrupo(
        instance.courseid,
        instance.start_time.getDay(),
        dniDocente.c_dnidoc,
      );

      if (!d_fecha) {
        throw new Error("No se puede crear la sesión porque d_fecha es null");
      }

      const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const fechaLocal = new Date(
        instance.start_time.getTime() - 5 * 60 * 60 * 1000,
      );
      const diaTexto = diasSemana[fechaLocal.getUTCDay()];
      const horaInicio = fechaLocal.toISOString().slice(11, 16);

      const dataSesiones = sesionGrupo.map((s) => ({
        n_codper: s.n_codper,
        c_codmod: s.c_codmod,
        c_codfac: s.c_codfac,
        c_codesp: s.c_codesp,
        c_codcur: s.c_codcur,
        c_grpcur: s.c_grpcur,
        c_dnidoc: s.c_dnidoc,
        d_fecha: d_fecha,
        d_fecha_registro: d_fecha,
        c_tema:
          `[AUTO] ${instance.topic?.trim() || `${s.c_codcur}-${s.c_grpcur}`} (${diaTexto} ${d_fecha} ${horaInicio} - Doc. ${dniDocente.c_dnidoc})`.slice(
            0,
            150,
          ),
        n_codpla: s.n_codpla,
        c_user_upd: "boot.v2",
        d_fecha_upd: new Date(),
      }));
      console.log("dataSesiones => ", dataSesiones);

      const sesionesCreadas =
        await this.zoomRepository.createSesiones(dataSesiones);
      console.log("sesionesCreadas => ", sesionesCreadas);

      const sesiones = await this.zoomRepository.getSesiones(
        20261,
        instance.courseid,
        d_fecha,
        dniDocente?.c_dnidoc || "",
      );

      const participantes = await this.zoomRepository.getZoomMeetingParticipant(
        instance.id,
      );

      const part = participantes
        .filter(
          (p) =>
            Number(p.corresponde_sesion) === 1 && Number(p.attendance) === 1,
        )
        .map((p) => {
          const sesion = sesiones.find(
            (s) =>
              String(s.c_codesp) === String(p.c_codesp) &&
              String(s.c_codmod) === String(p.c_codmod) &&
              String(s.c_grpcur) === String(p.c_grpcur),
          );

          if (!sesion?.id_asistencia) {
            return null;
          }

          return {
            id_asistencia: sesion.id_asistencia,
            c_codalu: p.c_codalu!,
            c_estado: p.late ? "T" : "A",
            seguir: new Date(),
          };
        })
        .filter((p) => p !== null);

      console.log("part => ", part);

      const createSesionDetalle =
        await this.zoomRepository.createAsistenciaDetalles(part);

      console.log("====================================");
      await this.zoomRepository.upsertZoomMeetingInstances([
        {
          uuid: instance.uuid,
          meeting_id: instance.meeting_id,
          updated_at: new Date(),
          attendance_status: "UPLOADED",
        },
      ]);
    }
    return true;
  }
}
