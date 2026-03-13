// Mirrors WorkflowSchedule from DBOS SDK for type-safe UI

export interface WorkflowSchedule {
  scheduleId: string;
  scheduleName: string;
  workflowName: string;
  workflowClassName: string;
  schedule: string;
  status: string;
  context: unknown;
}
