// modules/hubspot/hubspot.schedules.ts

import {
  HUBSPOT_ACTIONS,
  HUBSPOT_QUEUE,
} from "../../core/queue/queue.constants";
import { ScheduleDef } from "../../core/types/schedule.types";

export const hubspotSchedules: ScheduleDef[] = [
  {
    schedulerKey: "hubspot-sync-completa",
    queueName: HUBSPOT_QUEUE,
    jobName: "hubspot",
    action: HUBSPOT_ACTIONS.SYNC_COMPLETA,
    cron: "0 7 * * *",
    timezone: "America/Lima",
  },
];
