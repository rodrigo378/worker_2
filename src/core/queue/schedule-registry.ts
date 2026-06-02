// // core/queue/schedule-registry.ts

// import { Queue } from "bullmq";
// import { redisConnection } from "../config/redis";
// import { logger } from "../config/logger";

// // Junta los schedules de todos los módulos
// import { zoomSchedules } from "../../modules/zoom/zoom.schedules";
// import { hubspotSchedules } from "../../modules/hubspot/hubspot.schedules";
// import { ScheduleDef } from "../types/schedule.types";

// const ALL_SCHEDULES: ScheduleDef[] = [...zoomSchedules, ...hubspotSchedules];

// export async function registerSchedules() {
//   const queues = new Map<string, Queue>();
//   const getQueue = (name: string) => {
//     if (!queues.has(name)) {
//       queues.set(name, new Queue(name, { connection: redisConnection }));
//     }
//     return queues.get(name)!;
//   };

//   for (const s of ALL_SCHEDULES) {
//     const queue = getQueue(s.queueName);

//     await queue.upsertJobScheduler(
//       s.schedulerKey,
//       { pattern: s.cron, tz: s.timezone },
//       {
//         name: s.jobName,
//         data: {
//           action: s.action,
//           source: "scheduler",
//           schedulerKey: s.schedulerKey,
//         },
//         opts: {
//           attempts: s.attempts ?? 3,
//           backoff: { type: "exponential", delay: s.backoffMs ?? 5000 },
//           removeOnComplete: 100,
//           removeOnFail: 500,
//         },
//       },
//     );

//     logger.info(
//       { schedulerKey: s.schedulerKey, queue: s.queueName, cron: s.cron },
//       "Schedule registrado",
//     );
//   }

//   for (const q of queues.values()) {
//     await q.close();
//   }

//   logger.info(`${ALL_SCHEDULES.length} schedules registrados`);
// }
