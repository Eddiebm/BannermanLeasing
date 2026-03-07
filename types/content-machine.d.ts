/**
 * Shared types for Bannerman Content Machine (for IDE and optional tsc check).
 * Queue and API modules use JSDoc; this file provides a single place for structural types.
 */
export type QueueTaskStatus = "pending" | "generating" | "ready" | "approved" | "posted" | "failed";

export interface QueueTask {
  id: string;
  date: string;
  scheduledAt: string;
  platform: "blog" | "instagram" | "tiktok" | "linkedin" | "twitter";
  contentType: string;
  generatorType: "blog" | "carousel" | "tiktok" | "linkedin" | "tweet" | "static";
  week: number;
  status: QueueTaskStatus;
  content: Record<string, unknown> | null;
  generatedAt: string | null;
  error: string | null;
}

export interface ContentTask {
  id: string;
  platform: string;
  contentType: string;
  generatorType: QueueTask["generatorType"];
  week: number;
}
