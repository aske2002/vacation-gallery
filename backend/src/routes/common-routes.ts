import express from "express";
import { ProgressStore } from "../services/progress-store";

const router = express.Router();

router.get("/jobs/:jobId/stream", (req, res) => {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // send initial snapshot
  const current = ProgressStore.get(jobId);

  if (!current) {
    res.status(404).send("Job not found");
    return;
  }

  res.write(`data: ${JSON.stringify(current)}\n\n`);

  const onProgress = (payload: any) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    if (payload.status === "done" || payload.status === "error") {
      res.end();
    }
  };

  ProgressStore.onProgress(jobId, onProgress);
  req.on("close", () => ProgressStore.offProgress(jobId, onProgress));
});

export default router;
