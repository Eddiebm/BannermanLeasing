import { test, expect } from "@playwright/test";

test.describe("Bannerman Content Machine smoke", () => {
  test("app loads and shows dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /command center/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Bannerman/)).toBeVisible();
  });

  test("Generate flow with mocked LLM", async ({ page }) => {
    await page.route("**/api/llm/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          content: [{ text: "---META---\nTest meta.\n---CONTENT---\n# Test\n\nBody content here." }],
        }),
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: /generate/i }).first().click();
    await expect(page.getByRole("heading", { name: /generate content/i })).toBeVisible({ timeout: 5000 });

    const batchBtn = page.getByRole("button", { name: /generate next \d+/i });
    await batchBtn.click();
    await expect(page.getByText(/generating|batch complete|ready/i)).toBeVisible({ timeout: 15000 });
  });
});
