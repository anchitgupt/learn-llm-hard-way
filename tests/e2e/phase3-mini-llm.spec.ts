import { expect, test } from "@playwright/test";

test("learner runs an attention lab and revisits the phase three concept", async ({ page }) => {
  // App-shell sub-project: direct route nav replaces old-dashboard click-through.
  await page.goto("/concepts/attention-scores");

  await expect(page.getByRole("heading", { name: "Attention Scores" })).toBeVisible();

  await page.getByRole("tab", { name: "Visual" }).click();
  await expect(page.getByLabel("Attention weights visual")).toContainText("query x key");

  await page.getByRole("tab", { name: "Lab" }).click();
  await page.getByRole("button", { name: "Run lab" }).click();
  await expect(page.getByText("artifacts/labs/attention-demo.json")).toBeVisible();
  await expect(page.getByText("Attention weights")).toBeVisible();

  await page.getByRole("tab", { name: "Checkpoint" }).click();
  await page.getByLabel("Checkpoint answer").fill("query key score");
  await page.getByLabel("Confidence").selectOption("2");
  await page.getByRole("button", { name: "Submit checkpoint" }).click();
  await expect(page.getByText("Checkpoint passed.")).toBeVisible();
  await expect(page.getByText("attention-scores - low-confidence")).toBeVisible();
});
