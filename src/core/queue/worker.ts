// core/queue/worker.ts
//
// Arranca DOS workers de BullMQ en este mismo proceso:
//   - cola "zoom"    (concurrency 2)  → sincronizaciones de Zoom
//   - cola "hubspot" (concurrency 1)  → sincronizaciones de Hubspot
//
// Cada job actualiza core_job_log: processing → completed/failed.

import { Worker, QueueEvents } from "bullmq";
import type { Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { logger } from "../config/logger";
import type { DbRegistry } from "../db/registry";

import { buildJobLog } from "./job-execution-log.service";

// Zoom
import { ZoomHttpClient } from "../../modules/zoom/http";
import { ZoomRepository } from "../../modules/zoom/respository";
import { ZoomService } from "../../modules/zoom/service";
import { buildZoomHandler } from "../../modules/zoom/zoom.handler";

// Hubspot
import { HubspotHttpClient } from "../../modules/hubspot/http";
import { HubspotRepository } from "../../modules/hubspot/repository";
import { HubspotService } from "../../modules/hubspot/service";
import { buildHubspotHandler } from "../../modules/hubspot/hubspot.handler";
import { HUBSPOT_QUEUE, ZOOM_QUEUE } from "./queue.constants";

// ===================================================================
// Factory: crea un Worker con el ciclo de log estandarizado
// ===================================================================
function buildWorker(
  queueName: string,
  handler: (job: Job) => Promise<unknown>,
  concurrency: number,
  log: ReturnType<typeof buildJobLog>,
) {
  const worker = new Worker(
    queueName,
    async (job: Job) => {
      const startedAt = Date.now();
      const jobId = String(job.id ?? `pending-${job.data?.traceId}`);

      try {
        await log.markJobProcessing(jobId, job.attemptsMade);
      } catch (err) {
        logger.error({ jobId, err }, "Error markJobProcessing");
      }

      try {
        const res = await handler(job);
        const durationMs = Date.now() - startedAt;
        try {
          await log.markJobCompleted(jobId, durationMs, job.attemptsMade, res);
        } catch (err) {
          logger.error({ jobId, err }, "Error markJobCompleted");
        }
        logger.info(
          { queueName, jobName: job.name, jobId, durationMs },
          "Job done",
        );
        return res;
      } catch (err) {
        const durationMs = Date.now() - startedAt;
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        try {
          await log.markJobFailed(
            jobId,
            durationMs,
            job.attemptsMade,
            errorMessage,
          );
        } catch (errLog) {
          logger.error({ jobId, errLog }, "Error markJobFailed");
        }
        logger.error(
          { queueName, jobName: job.name, jobId, durationMs, err },
          "Job execution error",
        );
        throw err;
      }
    },
    { connection: redisConnection, concurrency },
  );

  // QueueEvents (solo para logging local)
  const events = new QueueEvents(queueName, { connection: redisConnection });
  events.on("completed", ({ jobId }) =>
    logger.info({ queueName, jobId }, "QueueEvents completed"),
  );
  events.on("failed", ({ jobId, failedReason }) =>
    logger.error({ queueName, jobId, failedReason }, "QueueEvents failed"),
  );

  worker.on("ready", () => logger.info(`Worker '${queueName}' listo`));
  worker.on("error", (err) => logger.error({ queueName, err }, "Worker error"));

  return { worker, events };
}

// ===================================================================
// startWorkers: arma services con la BD y arranca ambos workers
// ===================================================================
export function startWorkers(db: DbRegistry) {
  const log = buildJobLog(db);

  // Zoom
  const zoomService = new ZoomService(
    new ZoomHttpClient(),
    new ZoomRepository(db),
  );
  const zoom = buildWorker(ZOOM_QUEUE, buildZoomHandler(zoomService), 2, log);

  // Hubspot
  const hubspotService = new HubspotService(
    new HubspotHttpClient(),
    new HubspotRepository(db),
  );
  const hubspot = buildWorker(
    HUBSPOT_QUEUE,
    buildHubspotHandler(hubspotService),
    1,
    log,
  );

  logger.info("Workers 'zoom' y 'hubspot' iniciados");

  const closeAll = async () => {
    await Promise.all([
      zoom.worker.close(),
      zoom.events.close(),
      hubspot.worker.close(),
      hubspot.events.close(),
    ]);
  };

  return { closeAll };
}
