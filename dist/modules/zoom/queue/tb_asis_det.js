"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zoomQueue = void 0;
exports.enqueueSubirAsistencia = enqueueSubirAsistencia;
// src/queue/zoom.producer.ts
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../core/config/redis");
exports.zoomQueue = new bullmq_1.Queue("main", {
    connection: redis_1.redisConnection,
});
async function enqueueSubirAsistencia(instanceId) {
    await exports.zoomQueue.add("subir-asistencia", {
        instanceId: instanceId.toString(),
        traceId: crypto.randomUUID(),
    });
}
//# sourceMappingURL=tb_asis_det.js.map