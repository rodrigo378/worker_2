// src/queue/zoom.producer.ts
import { Queue } from "bullmq";
import { redisConnection } from "../../../core/config/redis";

export const zoomQueue = new Queue("main", {
  connection: redisConnection,
});

export async function enqueueSubirAsistencia(instanceId: bigint) {
  await zoomQueue.add("subir-asistencia", {
    instanceId: instanceId.toString(),
    traceId: crypto.randomUUID(),
  });
}
