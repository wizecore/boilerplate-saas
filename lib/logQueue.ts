import { Journal } from "@/types";

class CustomEvent<T> extends Event {
  detail: T;

  constructor(message: string, data: EventInit & { detail: T }) {
    super(message, data);
    this.detail = data.detail;
  }
}

const globalContext = globalThis as unknown as {
  __lastLog?: Map<string, EventTarget>;
};

export type LogQueueMessage = Pick<Journal, "id" | "type" | "message" | "createdAt">;

export class LogQueueEvent extends CustomEvent<LogQueueMessage> {
  constructor(message: string, data: EventInit & { detail: LogQueueMessage }) {
    super(message, data);
    this.detail = data.detail;
  }
}

/**
 * Interprocess log delivery for every subscriber via SSE.
 */
export const logQueue = {
  subscribe: (tenantId: string, handler: (e: LogQueueEvent) => void) => {
    let lastLog = globalContext.__lastLog;
    if (!lastLog) {
      lastLog = new Map();
      globalContext.__lastLog = lastLog;
    }

    let target = lastLog.get(tenantId);
    if (!target) {
      target = new EventTarget();
      lastLog.set(tenantId, target);
    }

    target.addEventListener("message", handler as EventListener);
  },

  unsubscribe: (tenantId: string, handler: (e: LogQueueEvent) => void) => {
    const lastLog = globalContext.__lastLog as Map<string, EventTarget>;
    const target = lastLog.get(tenantId);
    if (target) {
      target.removeEventListener("message", handler as EventListener);
    }
  },

  publish: (tenantId: string, msg: LogQueueMessage) => {
    let lastLog = globalContext.__lastLog as Map<string, EventTarget>;
    if (!lastLog) {
      lastLog = new Map();
      globalContext.__lastLog = lastLog;
    }

    const target = lastLog.get(tenantId);
    if (target) {
      const e = new LogQueueEvent("message", { detail: msg });
      target.dispatchEvent(e);
    }
  }
};
