import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { ProgressJob } from "vacation-gallery-common";

export class ProgressStore {
  private static jobs = new Map<string, ProgressJob>();
  private static bus = new EventEmitter();

  static create(job?: ProgressJob) {
    const jobId = uuidv4();
    this.jobs.set(jobId, job || { progress: 0, status: "queued" });
    return jobId;
  }

  static get(jobId: string) {
    return this.jobs.get(jobId);
  }

  static delete(jobId: string) {
    this.jobs.delete(jobId);
  }

  static setProgress(jobId: string, progress: number, message?: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.progress = Math.min(Math.max(progress, 0), 1);
    job.status = job.progress >= 1 ? "done" : "processing";
    if (message) job.message = message;
    this.jobs.set(jobId, job);
    this.bus.emit(`progress:${jobId}`, {
      progress: job.progress,
      message: job.message,
      status: job.status,
    });
  }

  static getProgress(jobId: string) {
    return this.jobs.get(jobId);
  }

  static onProgress(jobId: string, listener: (data: ProgressJob) => void) {
    this.bus.on(`progress:${jobId}`, listener);
  }

  static offProgress(jobId: string, listener: (data: ProgressJob) => void) {
    this.bus.off(`progress:${jobId}`, listener);
  }
}
