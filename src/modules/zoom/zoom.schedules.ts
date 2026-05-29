// modules/zoom/zoom.schedules.ts

import { ZOOM_ACTIONS, ZOOM_QUEUE } from "../../core/queue/queue.constants";
import { ScheduleDef } from "../../core/types/schedule.types";

const TZ = "America/Lima";

export const zoomSchedules: ScheduleDef[] = [
  // {
  //   schedulerKey: "zoom-sync-users",
  //   queueName: ZOOM_QUEUE,
  //   jobName: "zoom",
  //   action: ZOOM_ACTIONS.SYNC_USERS,
  //   cron: "0 1 * * *",
  //   timezone: TZ,
  // },
  {
    schedulerKey: "zoom-sync-meetings",
    queueName: ZOOM_QUEUE,
    jobName: "zoom",
    action: ZOOM_ACTIONS.SYNC_MEETINGS_ROOMS,
    cron: "0 5 * * *",
    timezone: TZ,
  },
  {
    schedulerKey: "zoom-sync-instances",
    queueName: ZOOM_QUEUE,
    jobName: "zoom",
    action: ZOOM_ACTIONS.SYNC_INSTANCES,
    cron: "10 5 * * *",
    timezone: TZ,
  },
  {
    schedulerKey: "zoom-sync-part-raw",
    queueName: ZOOM_QUEUE,
    jobName: "zoom",
    action: ZOOM_ACTIONS.SYNC_PARTICIPANTS_RAW,
    cron: "20 5 * * *",
    timezone: TZ,
  },
  {
    schedulerKey: "zoom-sync-participants",
    queueName: ZOOM_QUEUE,
    jobName: "zoom",
    action: ZOOM_ACTIONS.SYNC_PARTICIPANTS,
    cron: "30 5 * * *",
    timezone: TZ,
  },
  {
    schedulerKey: "zoom-sync-asistencias",
    queueName: ZOOM_QUEUE,
    jobName: "zoom",
    action: ZOOM_ACTIONS.SYNC_ASISTENCIAS,
    cron: "40 5 * * *",
    timezone: TZ,
  },
];
