import { ConnectionOptions } from "bullmq";
import { env } from "./env";

export const redisConnection: ConnectionOptions = {
  host: env.REDIS.HOST,
  port: env.REDIS.PORT,
  password: env.REDIS.PASSWORD,
  maxRetriesPerRequest: null, // ← AGREGAR (requerido por BullMQ)
};
