// core/queue/job-execution-log.service.ts
//
// Actualiza core_job_log usando knex (vía DbRegistry).
// La BD donde vive core_job_log la defines en LOG_DB_NAME.

import type { DbRegistry } from "../db/registry";

const LOG_DB_NAME = process.env.LOG_DB_NAME ?? "API_2";

// Info opcional para crear la fila si no existe (caso scheduler)
export interface JobLogInfo {
  queueName: string;
  jobName: string;
  action?: string | null;
  source?: string | null;
  traceId?: string | null;
  scheduleId?: number | null;
  payload?: unknown;
}

export function buildJobLog(registry: DbRegistry) {
  const db = () => registry.get(LOG_DB_NAME);

  // ===============================================================
  // UPSERT: actualiza si existe, inserta si no (caso scheduler)
  // ===============================================================
  const markJobProcessing = async (
    jobId: string,
    attemptsMade: number,
    jobInfo?: JobLogInfo,
  ) => {
    // Intenta UPDATE primero (caso: vino de la API, fila ya existe)
    const updatedRows = await db()("core_job_log")
      .where({ job_id: jobId })
      .update({
        status: "processing",
        started_at: db().fn.now(),
        attempts_made: attemptsMade,
      });

    // Si no había fila Y nos pasaron jobInfo (caso scheduler), INSERT
    if (updatedRows === 0 && jobInfo) {
      await db()("core_job_log").insert({
        job_id: jobId,
        queue_name: jobInfo.queueName,
        job_name: jobInfo.jobName,
        action: jobInfo.action ?? null,
        source: jobInfo.source ?? "scheduler",
        trace_id: jobInfo.traceId ?? null,
        schedule_id: jobInfo.scheduleId ?? null,
        payload_json: jobInfo.payload ? JSON.stringify(jobInfo.payload) : null,
        status: "processing",
        started_at: db().fn.now(),
        attempts_made: attemptsMade,
      });
    }

    return updatedRows;
  };

  // ===============================================================
  const markJobCompleted = async (
    jobId: string,
    durationMs: number,
    attemptsMade: number,
    result?: unknown,
  ) => {
    return db()("core_job_log")
      .where({ job_id: jobId })
      .update({
        status: "completed",
        finished_at: db().fn.now(),
        duration_ms: durationMs,
        attempts_made: attemptsMade,
        error_message: null,
        result_json: result !== undefined ? JSON.stringify(result) : null,
      });
  };

  // ===============================================================
  const markJobFailed = async (
    jobId: string,
    durationMs: number,
    attemptsMade: number,
    errorMessage: string,
  ) => {
    return db()("core_job_log").where({ job_id: jobId }).update({
      status: "failed",
      finished_at: db().fn.now(),
      duration_ms: durationMs,
      attempts_made: attemptsMade,
      error_message: errorMessage,
    });
  };

  return { markJobProcessing, markJobCompleted, markJobFailed };
}
