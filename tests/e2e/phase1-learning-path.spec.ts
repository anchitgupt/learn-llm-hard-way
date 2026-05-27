import { expect, test } from "@playwright/test";

test("learner can open a token lesson and save a revisit note", async ({ page }) => {
  const iconHref = "/favicon.svg";
  const iconResponse = await page.request.get(iconHref);
  expect(iconResponse.ok()).toBe(true);

  // App-shell sub-project: direct route nav replaces old-dashboard click-through.
  await page.goto("/concepts/character-tokenization");

  await expect(page.getByRole("heading", { name: "Character Tokenization" })).toBeVisible();
  await page.getByRole("tab", { name: "Visual" }).click();
  await expect(page.getByRole("img", { name: "Token flow from text to ids" })).toBeVisible();
  await page.getByRole("tab", { name: "Checkpoint" }).click();
  await expect(page.getByText("What does a character tokenizer lose")).toBeVisible();

  await page.getByRole("tab", { name: "Notes" }).click();
  await page.getByLabel("Learning note").fill("Revisit why BPE helps shorten token sequences.");
  await page.getByLabel("Add to revisit queue").check();
  await page.getByRole("button", { name: "Save progress" }).click();

  await expect(page.getByText("Progress saved")).toBeVisible();
});
