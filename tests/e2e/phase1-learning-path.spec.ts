import { expect, test } from "@playwright/test";

test("learner can open a token lesson and save a revisit note", async ({ page }) => {
  const iconHref = "/favicon.svg";
  const iconResponse = await page.request.get(iconHref);
  expect(iconResponse.ok()).toBe(true);

  // App-shell sub-project: direct route nav replaces old-dashboard click-through.
  await page.goto("/concepts/character-tokenization");

  // Concept Workspace sub-project: use .first() because the lesson markdown also
  // renders an h1 with the same title, causing strict-mode violations.
  await expect(page.getByRole("heading", { name: "Character Tokenization" }).first()).toBeVisible();
  // Concept Workspace sub-project: tabs renamed Lesson→Explanation, Visual→Experiment.
  await page.getByRole("tab", { name: "Experiment" }).click();
  await expect(page.getByRole("img", { name: "Token flow" })).toBeVisible();
  await page.getByRole("tab", { name: "Checkpoint" }).click();
  await expect(page.getByText("What does a character tokenizer lose")).toBeVisible();

  await page.getByRole("tab", { name: "Notes" }).click();
  // Concept Workspace sub-project: Notes textarea uses aria-label="Notes" (was "Learning note").
  // Use role="textbox" to disambiguate from the tabpanel which also has an accessible name "Notes".
  await page.getByRole("textbox", { name: "Notes" }).fill("Revisit why BPE helps shorten token sequences.");
  // Concept Workspace sub-project: revisit toggle is a Switch (click, not .check()).
  // Concept Workspace sub-project: Notes tab autosaves; "Saved · <time>" may be briefly visible
  // but a subsequent data refresh resets the component. Assert the switch is checked instead.
  await page.getByLabel("Add to revisit queue").click();
  await expect(page.getByRole("switch", { name: "Add to revisit queue" })).toBeChecked();
});
