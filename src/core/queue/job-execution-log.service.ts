// core/queue/job-execution-log.service.ts
//
// Actualiza core_job_log usando knex (vía DbRegistry).
// La BD donde vive core_job_log la defines en LOG_DB_NAME.

import type { DbRegistry } from "../db/registry";

// Nombre de la conexión donde está core_job_log
// (ajústalo al nombre real de tu conexión: 'API_2', etc.)
const LOG_DB_NAME = process.env.LOG_DB_NAME ?? "API_2";

export function buildJobLog(registry: DbRegistry) {
  const db = () => registry.get(LOG_DB_NAME);

  const markJobProcessing = async (jobId: string, attemptsMade: number) => {
    return db()("core_job_log").where({ job_id: jobId }).update({
      status: "processing",
      started_at: db().fn.now(),
      attempts_made: attemptsMade,
    });
  };

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
