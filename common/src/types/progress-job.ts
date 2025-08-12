export type ProgressJob = {
  progress: number;
  status: "queued" | "processing" | "done" | "error";
  message?: string;
};
