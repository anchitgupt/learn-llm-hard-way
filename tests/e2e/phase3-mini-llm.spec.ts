import { expect, test } from "@playwright/test";

test("learner runs an attention lab and revisits the phase three concept", async ({ page }) => {
  // App-shell sub-project: direct route nav replaces old-dashboard click-through.
  await page.goto("/concepts/attention-scores");

  // Concept Workspace sub-project: use .first() because the lesson markdown also
  // renders an h1 with the same title, causing strict-mode violations.
  await expect(page.getByRole("heading", { name: "Attention Scores" }).first()).toBeVisible();

  // Concept Workspace sub-project: tabs renamed Lesson→Explanation, Visual→Experiment.
  await page.getByRole("tab", { name: "Experiment" }).click();
  // Concept Workspace sub-project: AttentionMap viz renders as role="img" with title "Attention map"
  // (was legacy aria-label="Attention weights visual" with placeholder text "query x key").
  await expect(page.getByRole("img", { name: "Attention map" })).toBeVisible();

  await page.getByRole("tab", { name: "Lab" }).click();
  await page.getByRole("button", { name: "Run lab" }).click();
  // Concept Workspace sub-project: LabTab does not show artifact path inline;
  // verify success by checking the Run lab button is no longer in a loading state.
  await expect(page.getByRole("button", { name: "Run lab" })).toBeEnabled({ timeout: 10000 });

  await page.getByRole("tab", { name: "Checkpoint" }).click();
  // Wait for the checkpoint question to appear (tab rendered) and the submit button
  // to be in the initial disabled state (useEffect has reset the answer field).
  await expect(page.getByText("What does an attention score measure")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  // Concept Workspace sub-project: CheckpointTab uses aria-label="Your answer" (was "Checkpoint answer").
  await page.getByLabel("Your answer").fill("query key score");
  // Concept Workspace sub-project: Confidence is a range input; use fill() not selectOption().
  await page.getByLabel("Confidence").fill("2");
  // Concept Workspace sub-project: Submit button text is "Submit" (was "Submit checkpoint").
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Checkpoint passed.")).toBeVisible();
  // Concept Workspace sub-project: missed-topics aside removed; badge "in missed queue"
  // appears in the ConceptHeader after data refreshes.
  await expect(page.getByText("in missed queue")).toBeVisible();
});
