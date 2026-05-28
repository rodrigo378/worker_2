// core/queue/schedule.types.ts

export interface ScheduleDef {
  schedulerKey: string;
  queueName: string;
  jobName: string;
  action: string;
  cron: string;
  timezone: string;
  attempts?: number;
  backoffMs?: number;
}
