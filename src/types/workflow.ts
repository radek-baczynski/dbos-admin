// Mirrors API responses from DBOS SDK for type-safe UI

export interface WorkflowStatus {
  workflowID: string;
  status: string;
  workflowName: string;
  workflowClassName: string;
  workflowConfigName?: string;
  queueName?: string;
  authenticatedUser?: string;
  input?: unknown[];
  output?: unknown;
  error?: unknown;
  executorId?: string;
  applicationVersion?: string;
  createdAt: number;
  updatedAt?: number;
  timeoutMS?: number;
  deadlineEpochMS?: number;
  deduplicationID?: string;
  priority: number;
  queuePartitionKey?: string;
  dequeuedAt?: number;
  forkedFrom?: string;
  parentWorkflowID?: string;
}

export interface StepInfo {
  functionID: number;
  name: string;
  output: unknown;
  error: Error | null;
  childWorkflowID: string | null;
  startedAtEpochMs?: number;
  completedAtEpochMs?: number;
}
