import { expect, test } from "@playwright/test";

test("learner runs a math lab and sends low-confidence checkpoint to missed topics", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Learn LLM The Hard Way" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Concept Map" })).toBeVisible();

  await page.getByRole("region", { name: "Concept map" }).getByRole("button", { name: "Vectors" }).click();
  await expect(page.getByRole("heading", { name: "Vectors" })).toBeVisible();

  await page.getByRole("tab", { name: "Lab" }).click();
  await page.getByRole("button", { name: "Run lab" }).click();
  await expect(page.getByRole("status")).toContainText("artifacts/labs/math-vector-demo.json");

  await page.getByRole("tab", { name: "Checkpoint" }).click();
  await page.getByLabel("Checkpoint answer").fill("numbers");
  await page.getByLabel("Confidence").selectOption("2");
  await page.getByRole("button", { name: "Submit checkpoint" }).click();
  await expect(page.getByText("A vector is an ordered list of numbers")).toBeVisible();

  await expect(page.getByText("vectors - low-confidence")).toBeVisible();
});
