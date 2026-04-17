// helpers.ts
import { DateTime } from "luxon";
import { ZoomMeetingParticipant } from "./types";

/** Row de alumno (desde SIGU_LECTURA) */
export type AlumnoRow = {
  codigo?: string;
  CODIGO?: string;
  nombre_completo: string;
  facultad?: string;
  c_codesp?: string;
  email?: string;
};

/** Participante enriquecido */
export type ZoomParticipantEnriched = ZoomMeetingParticipant & {
  codigo?: string;
  facultad?: string;
  c_codesp?: string;
};

/** Resumen de clase basado en el host/docente (SALA/AULA) */
export type HostSessionSummary = {
  hostCount: number;
  class_start?: string;
  class_end?: string;
  class_duration_sec: number;
  host_merged?: ZoomMeetingParticipant;
};

export const toDT = (iso: string) => DateTime.fromISO(iso, { zone: "utc" });

export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
) => {
  const results: R[] = new Array(items.length);
  let index = 0;

  const run = async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) break;

      const item = items[current];
      if (item === undefined) continue;
      results[current] = await worker(item);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => run(),
  );

  await Promise.all(workers);
  return results;
};

/** Normaliza nombres para comparar */
export const normalizeName = (s: string) => {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
};

/** Normaliza email */
export const normalizeEmail = (s: string) => {
  return (s || "").trim().toLowerCase();
};

/** Tokens del nombre */
export const tokenizeName = (s: string): string[] => {
  return normalizeName(s).split(" ").filter(Boolean);
};

/** true si todos los tokens de a están dentro de b */
export const isSubsetTokens = (a: string[], b: string[]) => {
  return a.every((x) => b.includes(x));
};

/** Regla docente/host (tu caso: SALA / AULA) */
export const isDocente = (p: ZoomMeetingParticipant) => {
  const n = normalizeName(p.name || "");
  return n.includes("sala") || n.includes("aula");
};

/** Obtiene código tolerando distintas formas */
export const getAlumnoCodigo = (a: AlumnoRow): string => {
  return String(a.codigo ?? a.CODIGO ?? "").trim();
};

/** Match flexible por nombre */
export function findBestAlumnoByName(zoomName: string, alumnos: AlumnoRow[]) {
  const zoomNorm = normalizeName(zoomName);
  const zoomTokens = tokenizeName(zoomName);

  if (!zoomNorm || zoomTokens.length === 0) return null;

  const exact: AlumnoRow[] = [];
  const subset: AlumnoRow[] = [];

  for (const a of alumnos) {
    const alumnoName = String(a.nombre_completo ?? "");
    const alumnoNorm = normalizeName(alumnoName);
    const alumnoTokens = tokenizeName(alumnoName);

    if (!alumnoNorm || alumnoTokens.length === 0) continue;

    if (alumnoNorm === zoomNorm) {
      exact.push(a);
      continue;
    }

    const zoomDentroAlumno = isSubsetTokens(zoomTokens, alumnoTokens);
    const alumnoDentroZoom = isSubsetTokens(alumnoTokens, zoomTokens);

    if (zoomDentroAlumno || alumnoDentroZoom) {
      subset.push(a);
    }
  }

  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  if (subset.length === 1) return subset[0];
  if (subset.length > 1) return null;

  return null;
}

/** Match final: primero email, luego nombre */
export function findBestAlumno(
  participant: ZoomMeetingParticipant,
  alumnos: AlumnoRow[],
) {
  const participantEmail = normalizeEmail(
    (participant as any).user_email || "",
  );

  if (participantEmail) {
    const byEmail = alumnos.filter(
      (a) => normalizeEmail(a.email || "") === participantEmail,
    );

    if (byEmail.length === 1) return byEmail[0];
    if (byEmail.length > 1) return null;
  }

  return findBestAlumnoByName(participant.name || "", alumnos);
}

/**
 * Merge genérico por "key" y reconexión por gap.
 * - agrupa entradas del mismo usuario (por id o nombre)
 * - junta segmentos si reconecta dentro de gapMinutes
 * - devuelve participantes consolidados
 */
export function mergeByKey(
  participants: ZoomMeetingParticipant[],
  gapMinutes = 5,
  keyOf?: (p: ZoomMeetingParticipant) => string,
): ZoomMeetingParticipant[] {
  const gapMs = gapMinutes * 60 * 1000;

  const defaultKeyOf = (p: ZoomMeetingParticipant) =>
    (p.id && p.id.trim()) || `name:${normalizeName(p.name || "")}`;

  const getKey = keyOf ?? defaultKeyOf;

  const byKey = new Map<string, ZoomMeetingParticipant[]>();
  for (const p of participants) {
    if (!p.join_time || !p.leave_time) continue;
    const k = getKey(p);
    const arr = byKey.get(k);
    if (arr) arr.push(p);
    else byKey.set(k, [p]);
  }

  const out: ZoomMeetingParticipant[] = [];

  for (const [, arr] of byKey) {
    if (arr.length === 0) continue;

    arr.sort((a, b) => Date.parse(a.join_time) - Date.parse(b.join_time));

    type Segment = { join: number; leave: number; duration: number };
    const segments: Segment[] = [];

    for (const p of arr) {
      const join = Date.parse(p.join_time);
      const leave = Date.parse(p.leave_time);
      const dur = Number(p.duration || 0);

      if (segments.length === 0) {
        segments.push({ join, leave, duration: dur });
        continue;
      }

      const last = segments[segments.length - 1];
      if (!last) {
        segments.push({ join, leave, duration: dur });
        continue;
      }

      if (join <= last.leave + gapMs) {
        if (leave > last.leave) last.leave = leave;
        last.duration += dur;
      } else {
        segments.push({ join, leave, duration: dur });
      }
    }

    const first = arr[0];
    if (!first) continue;

    const base: ZoomMeetingParticipant = { ...first };

    const minJoin = Math.min(...segments.map((s) => s.join));
    const maxLeave = Math.max(...segments.map((s) => s.leave));
    const sumDur = segments.reduce((acc, s) => acc + s.duration, 0);

    base.join_time = new Date(minJoin).toISOString();
    base.leave_time = new Date(maxLeave).toISOString();
    base.duration = sumDur;

    out.push(base);
  }

  return out;
}

/**
 * Merge del host/docente para obtener inicio/fin/duración de clase
 */
export function mergeHostSession(
  participants: ZoomMeetingParticipant[],
  gapMinutes = 5,
): HostSessionSummary {
  const docentesRaw = participants.filter(isDocente);
  if (docentesRaw.length === 0) {
    return { hostCount: 0, class_duration_sec: 0 };
  }

  const docentesMerged = mergeByKey(docentesRaw, gapMinutes);

  const joins = docentesMerged
    .map((p) => (p.join_time ? Date.parse(p.join_time) : NaN))
    .filter((n) => Number.isFinite(n));

  const leaves = docentesMerged
    .map((p) => (p.leave_time ? Date.parse(p.leave_time) : NaN))
    .filter((n) => Number.isFinite(n));

  const class_start_ms = joins.length ? Math.min(...joins) : undefined;
  const class_end_ms = leaves.length ? Math.max(...leaves) : undefined;

  const class_duration_sec = docentesMerged.reduce(
    (acc, p) => acc + Number(p.duration || 0),
    0,
  );

  const host_merged =
    docentesMerged
      .slice()
      .sort((a, b) => Number(b.duration || 0) - Number(a.duration || 0))[0] ??
    undefined;

  const out: HostSessionSummary = {
    hostCount: docentesRaw.length,
    class_duration_sec,
  };

  if (class_start_ms !== undefined) {
    out.class_start = new Date(class_start_ms).toISOString();
  }
  if (class_end_ms !== undefined) {
    out.class_end = new Date(class_end_ms).toISOString();
  }
  if (host_merged !== undefined) {
    out.host_merged = host_merged;
  }

  return out;
}

/**
 * Merge + enriquecer SOLO estudiantes (excluye docentes)
 * Prioridad:
 * 1. email
 * 2. nombre exacto
 * 3. nombre flexible por tokens
 */
export function mergeAndEnrichStudents(
  participants: ZoomMeetingParticipant[],
  alumnos: AlumnoRow[],
  gapMinutes = 5,
): ZoomParticipantEnriched[] {
  const estudiantesRaw = participants.filter((p) => !isDocente(p));
  const merged = mergeByKey(estudiantesRaw, gapMinutes);

  return merged.map((p) => {
    const alumno = findBestAlumno(p, alumnos);
    if (!alumno) return p;

    return {
      ...p,
      codigo: getAlumnoCodigo(alumno),
      facultad: alumno.facultad ?? "",
      c_codesp: alumno.c_codesp ?? "",
    };
  });
}

/**
 * Helper final para armar participantes y obtener resumen de clase (host)
 */
export function buildMeetingParticipants(
  participants: ZoomMeetingParticipant[],
  alumnos: AlumnoRow[],
  gapMinutes = 5,
): {
  participantesFinal: ZoomParticipantEnriched[];
  hostSummary: HostSessionSummary;
} {
  const hostSummary = mergeHostSession(participants, gapMinutes);
  const estudiantes = mergeAndEnrichStudents(participants, alumnos, gapMinutes);
  const docentesMerged = mergeByKey(participants.filter(isDocente), gapMinutes);

  return {
    participantesFinal: [...estudiantes, ...docentesMerged],
    hostSummary,
  };
}
