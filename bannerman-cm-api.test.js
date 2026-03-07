import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseSection, generateContent } from "./bannerman-cm-api.js";

describe("parseSection", () => {
  it("extracts a section between tags", () => {
    const raw = "---META---\nhello world\n---CONTENT---\nbody here";
    expect(parseSection(raw, "META")).toBe("hello world");
    expect(parseSection(raw, "CONTENT")).toBe("body here");
  });

  it("returns empty string for missing tag", () => {
    expect(parseSection("no tags here", "META")).toBe("");
    expect(parseSection("---OTHER---\nx", "META")).toBe("");
  });

  it("trims whitespace", () => {
    expect(parseSection("---T---\n  a  \n  ", "T")).toBe("a");
  });

  it("handles multiline content", () => {
    const raw = "---SLIDES---\nSlide 1\nSlide 2\n\n---END---";
    expect(parseSection(raw, "SLIDES")).toBe("Slide 1\nSlide 2");
  });
});

describe("generateContent with mocked fetch", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              content: [
                {
                  text: "---META---\nA meta description.\n---CONTENT---\n# How to Write a Lease\n\nFull blog body here.",
                },
              ],
            }),
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns blog shape with title, meta, content, wordCount for blog task", async () => {
    const task = {
      id: "2025-01-01_blog_blog_post_a",
      platform: "blog",
      contentType: "blog_post_a",
      generatorType: "blog",
      week: 1,
    };
    const result = await generateContent("", task, { provider: "anthropic" });
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("meta", "A meta description.");
    expect(result).toHaveProperty("content");
    expect(result.content).toContain("# How to Write a Lease");
    expect(result).toHaveProperty("wordCount");
    expect(typeof result.wordCount).toBe("number");
  });
});
