import prisma from "@/lib/db";

export interface FlowMessageStep {
  type: "message";
  config: { text: string };
}

export interface FlowWaitStep {
  type: "wait";
  config: { seconds: number };
}

export interface FlowActionStep {
  type: "action";
  config: { action: string };
}

export type FlowStep = FlowMessageStep | FlowWaitStep | FlowActionStep;

export interface FlowResult {
  messages: string[];
  executionId: string;
  hasWaits: boolean;
}

function getTriggerConfig(flow: any): Record<string, any> {
  try {
    return JSON.parse(flow.triggerConfig || "{}");
  } catch {
    return {};
  }
}

function evaluateTrigger(flow: any, event: string, eventData?: any): boolean {
  if (flow.status !== "active") return false;
  if (flow.trigger !== event) return false;

  const config = getTriggerConfig(flow);

  switch (event) {
    case "page_visit": {
      if (!config.url) return true;
      const url = eventData?.url || "";
      const pattern = config.url.replace(/\*/g, ".*");
      try {
        return new RegExp(pattern, "i").test(url);
      } catch {
        return url.toLowerCase().includes(config.url.toLowerCase());
      }
    }
    case "after_time":
      return true;
    case "exit_intent":
      return true;
    case "keyword": {
      if (!config.keyword) return true;
      const msg = eventData?.message || "";
      return msg.toLowerCase().includes(config.keyword.toLowerCase());
    }
    case "event":
      return !config.eventName || config.eventName === eventData?.eventName;
    default:
      return false;
  }
}

async function executeFlowSteps(
  flow: any,
  executionId: string,
  storeId: string,
  sessionId?: string
): Promise<FlowResult> {
  const steps: FlowStep[] = (() => {
    try {
      return JSON.parse(flow.steps || "[]");
    } catch {
      return [];
    }
  })();

  const messages: string[] = [];
  let hasWaits = false;
  let execData: Record<string, any> = {};

  // Load any existing execution data
  try {
    const existing = await prisma.flowExecution.findUnique({
      where: { id: executionId },
    });
    if (existing?.data) execData = JSON.parse(existing.data);
  } catch {}

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    await prisma.flowExecution.update({
      where: { id: executionId },
      data: { stepIndex: i },
    });

    switch (step.type) {
      case "message": {
        if (step.config.text?.trim()) {
          messages.push(step.config.text.trim());
        }
        break;
      }
      case "wait": {
        if ((step.config.seconds || 0) > 0) {
          hasWaits = true;
          messages.push(`__WAIT__:${step.config.seconds}`);
        }
        break;
      }
      case "action": {
        try {
          const action = step.config.action || "";
          const setVarMatch = action.match(
            /setVariable\(["'](.+?)["']\s*,\s*["'](.+?)["']\)/
          );
          if (setVarMatch) {
            execData[setVarMatch[1]] = setVarMatch[2];
          }
        } catch {}
        break;
      }
    }
  }

  // Update execution data
  await prisma.flowExecution.update({
    where: { id: executionId },
    data: {
      status: "completed",
      completedAt: new Date(),
      stepIndex: steps.length,
      data: JSON.stringify(execData),
    },
  });

  // Increment execution count
  await prisma.flow.update({
    where: { id: flow.id },
    data: { executionCount: { increment: 1 } },
  });

  return { messages, executionId, hasWaits };
}

export async function triggerFlow(
  storeId: string,
  event: string,
  eventData?: any,
  sessionId?: string
): Promise<FlowResult | null> {
  const flows = await prisma.flow.findMany({
    where: { storeId, status: "active" },
    orderBy: { createdAt: "asc" },
  });

  for (const flow of flows) {
    if (!evaluateTrigger(flow, event, eventData)) continue;

    // Skip if already executed for this session (per-session triggers)
    if (sessionId) {
      const existing = await prisma.flowExecution.findFirst({
        where: { flowId: flow.id, sessionId, status: "completed" },
      });
      if (existing) continue;
    }

    const execution = await prisma.flowExecution.create({
      data: {
        flowId: flow.id,
        storeId,
        sessionId: sessionId || null,
        status: "running",
      },
    });

    return executeFlowSteps(flow, execution.id, storeId, sessionId);
  }

  return null;
}

export async function checkChatMessageForFlows(
  storeId: string,
  message: string,
  sessionId?: string
): Promise<FlowResult | null> {
  return triggerFlow(storeId, "keyword", { message }, sessionId);
}
