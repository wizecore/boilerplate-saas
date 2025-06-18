import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { logQueue, LogQueueEvent } from "@/lib/logQueue";
import { formatMessage } from "@/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions(req));
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (req.headers.accept !== "text/event-stream") {
      res.status(400).json({ error: "Bad request" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Content-Encoding", "none");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // https://stackoverflow.com/questions/13672743/eventsource-server-sent-events-through-nginx
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const interval = setInterval(() => {
      res.cork();
      res.write("event: ping\ndata: {}\n\n");
      res.uncork();
    }, 5000);

    logger.info("Subscribing to log queue, tenantId", session.user.tenantId);

    const handler = (e: LogQueueEvent) => {
      res.cork();
      res.write(`data: ${JSON.stringify(e.detail)}\n\n`);
      res.uncork();
    };

    logQueue.subscribe(session.user.tenantId, handler);

    res.on("close", () => {
      logger.info("Client closed log queue connection");
      clearInterval(interval);
      logQueue.unsubscribe(session.user.tenantId, handler);
    });
  } catch (error) {
    logger.warn("Error streaming", formatMessage(error));
    res.status(500).json({ error: "Internal server error" });
  }
}
