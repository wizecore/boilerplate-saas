const logger = console;

/** @type {{ id: string, type: string, addedAt: number }[] & { handler?: () => void } } */
// @ts-expect-error globalThis is not typed
globalThis.processingQueue = globalThis.processingQueue ?? [];
const processingQueue = globalThis.processingQueue;

/**
 * Global shared queue processing state of the current process
 */
const queueState = {
  /** Process queue, if enabled */
  process: () => {
    return fetch("http://localhost:" + (process.env.PORT ?? 3000) + "/api/queue/tick");
  },

  /** @param {() => void} handler */
  setHandler: handler => {
    if (!processingQueue.handler) {
      logger.info("Setting handler for processing queue");
      processingQueue.handler = handler;
    }
  },

  /**
   * @param {string} id
   * @param {string} type
   */
  add: (id, type) => {
    processingQueue.push({ id, type, addedAt: Date.now() });
  },

  /** @param {string} id */
  remove: id => {
    const index = processingQueue.findIndex(item => item.id === id);
    if (index !== -1) {
      processingQueue.splice(index, 1);
    }
  },

  dump: (verbose = false) => {
    if (processingQueue.length > 0) {
      logger.warn(
        "Processing queue backlog:\n",
        "- " +
          processingQueue
            .map(item => `${item.id} - ${item.type} (${Date.now() - item.addedAt} ms)`)
            .join("\n - ")
      );
    } else if (verbose) {
      logger.warn("Processing queue is empty");
    }
  },

  dumpInterval: 1000 * 5, // 5 seconds
  lastDump: Date.now(),

  periodicDump: () => {
    const now = Date.now();
    if (now - queueState.lastDump > queueState.dumpInterval) {
      queueState.dump();
      queueState.lastDump = now;
    }
  }
};

module.exports = {
  queueState
};
