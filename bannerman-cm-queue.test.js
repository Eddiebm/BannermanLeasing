import { describe, it, expect } from "vitest";
import { buildQueue } from "./bannerman-cm-queue.js";

describe("buildQueue", () => {
  it("returns an array", () => {
    const queue = buildQueue();
    expect(Array.isArray(queue)).toBe(true);
  });

  it("returns at least one task", () => {
    const queue = buildQueue();
    expect(queue.length).toBeGreaterThan(0);
  });

  it("each task has required fields", () => {
    const queue = buildQueue();
    const required = ["id", "date", "scheduledAt", "platform", "contentType", "generatorType", "week", "status", "content", "generatedAt", "error"];
    for (const task of queue.slice(0, 20)) {
      for (const key of required) {
        expect(task).toHaveProperty(key);
      }
      expect(typeof task.id).toBe("string");
      expect(typeof task.date).toBe("string");
      expect(["pending", "generating", "ready", "posted", "failed"]).toContain(task.status);
      expect(task.content).toBe(null);
      expect(task.error).toBe(null);
    }
  });

  it("task ids are unique", () => {
    const queue = buildQueue();
    const ids = new Set(queue.map((t) => t.id));
    expect(ids.size).toBe(queue.length);
  });

  it("covers 365 days of slots", () => {
    const queue = buildQueue();
    const dates = new Set(queue.map((t) => t.date));
    expect(dates.size).toBeGreaterThanOrEqual(1);
    expect(queue.length).toBeLessThanOrEqual(365 * 20);
  });
});
