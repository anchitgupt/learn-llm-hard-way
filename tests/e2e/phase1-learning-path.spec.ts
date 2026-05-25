import { expect, test } from "@playwright/test";

test("learner can open a token lesson and save a revisit note", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Learn LLM The Hard Way" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Learning tracks" })).toBeVisible();

  await page.getByRole("button", { name: "Character Tokenization" }).click();

  await expect(page.getByRole("heading", { name: "Character Tokenization" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Token flow from text to ids" })).toBeVisible();
  await expect(page.getByText("What does a character tokenizer lose")).toBeVisible();

  await page.getByLabel("Learning note").fill("Revisit why BPE helps shorten token sequences.");
  await page.getByLabel("Add to revisit queue").check();
  await page.getByRole("button", { name: "Save progress" }).click();

  await expect(page.getByRole("status")).toHaveText("Progress saved");
});
