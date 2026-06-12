import type { DbRegistry } from "../db/registry";

const LOG_DB_NAME = process.env.LOG_DB_NAME ?? "API_2";

export interface JobLogInfo {
  queueName: string;
  jobName: string;
  action?: string | null;
  source?: string | null;
  traceId?: string | null;
  flowTraceId?: string | null;
  scheduleId?: number | null;
  payload?: unknown;
}

function safeJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({
      error: "Valor no serializable",
    });
  }
}

function normalizeScheduleId(value: unknown): number | null {
  if (value === undefined || value === null) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildJobLog(registry: DbRegistry) {
  const db = () => registry.get(LOG_DB_NAME);

  const getScheduleIdByJobId = async (
    jobId: string,
  ): Promise<number | null> => {
    const row = await db()("core_job_log")
      .select("schedule_id")
      .where({ job_id: jobId })
      .first();

    return normalizeScheduleId(row?.schedule_id);
  };

  const markScheduleProcessing = async (
    scheduleId: number | null,
    jobId: string,
  ) => {
    if (!scheduleId) return;

    const now = db().fn.now();

    await db()("sch_schedule").where({ id: scheduleId }).update({
      last_status: "processing",
      last_started_at: now,
      last_finished_at: null,
      last_duration_ms: null,
      last_error_message: null,
      last_job_id: jobId,
      updated_at: now,
    });
  };

  const markScheduleCompleted = async (
    scheduleId: number | null,
    jobId: string,
    durationMs: number,
  ) => {
    if (!scheduleId) return;

    const now = db().fn.now();

    await db()("sch_schedule")
      .where({ id: scheduleId })
      .update({
        last_status: "completed",
        last_finished_at: now,
        last_duration_ms: durationMs,
        last_error_message: null,
        last_job_id: jobId,
        total_runs: db().raw("?? + 1", ["total_runs"]),
        total_success: db().raw("?? + 1", ["total_success"]),
        current_failure_streak: 0,
        updated_at: now,
      });
  };

  const markScheduleFailed = async (
    scheduleId: number | null,
    jobId: string,
    durationMs: number,
    errorMessage: string,
  ) => {
    if (!scheduleId) return;

    const now = db().fn.now();

    await db()("sch_schedule")
      .where({ id: scheduleId })
      .update({
        last_status: "failed",
        last_finished_at: now,
        last_duration_ms: durationMs,
        last_error_message: errorMessage,
        last_job_id: jobId,
        total_runs: db().raw("?? + 1", ["total_runs"]),
        total_failed: db().raw("?? + 1", ["total_failed"]),
        current_failure_streak: db().raw("?? + 1", ["current_failure_streak"]),
        updated_at: now,
      });
  };

  const markJobProcessing = async (
    jobId: string,
    attemptsMade: number,
    jobInfo?: JobLogInfo,
  ) => {
    const now = db().fn.now();

    const updatedRows = await db()("core_job_log")
      .where({ job_id: jobId })
      .update({
        status: "processing",
        started_at: now,
        attempts_made: attemptsMade,
      });

    let scheduleId = normalizeScheduleId(jobInfo?.scheduleId);

    if (updatedRows === 0 && jobInfo) {
      await db()("core_job_log").insert({
        job_id: jobId,
        queue_name: jobInfo.queueName,
        job_name: jobInfo.jobName,
        action: jobInfo.action ?? null,
        source: jobInfo.source ?? "scheduler",
        trace_id: jobInfo.traceId ?? null,
        flow_trace_id: jobInfo.flowTraceId ?? null,
        schedule_id: scheduleId,
        payload_json: safeJson(jobInfo.payload),
        status: "processing",
        started_at: now,
        attempts_made: attemptsMade,
      });
    }

    if (!scheduleId) {
      scheduleId = await getScheduleIdByJobId(jobId);
    }

    await markScheduleProcessing(scheduleId, jobId);

    return updatedRows;
  };

  const markJobCompleted = async (
    jobId: string,
    durationMs: number,
    attemptsMade: number,
    result?: unknown,
  ) => {
    const updatedRows = await db()("core_job_log")
      .where({ job_id: jobId })
      .update({
        status: "completed",
        finished_at: db().fn.now(),
        duration_ms: durationMs,
        attempts_made: attemptsMade,
        error_message: null,
        result_json: safeJson(result),
      });

    const scheduleId = await getScheduleIdByJobId(jobId);
    await markScheduleCompleted(scheduleId, jobId, durationMs);

    return updatedRows;
  };

  const markJobFailed = async (
    jobId: string,
    durationMs: number,
    attemptsMade: number,
    errorMessage: string,
  ) => {
    const updatedRows = await db()("core_job_log")
      .where({ job_id: jobId })
      .update({
        status: "failed",
        finished_at: db().fn.now(),
        duration_ms: durationMs,
        attempts_made: attemptsMade,
        error_message: errorMessage,
      });

    const scheduleId = await getScheduleIdByJobId(jobId);
    await markScheduleFailed(scheduleId, jobId, durationMs, errorMessage);

    return updatedRows;
  };

  return {
    markJobProcessing,
    markJobCompleted,
    markJobFailed,
  };
}
