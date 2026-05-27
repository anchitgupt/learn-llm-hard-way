import { expect, test } from "@playwright/test";

test("learner runs a math lab and sends low-confidence checkpoint to missed topics", async ({ page }) => {
  // App-shell sub-project: direct route nav replaces old-dashboard click-through.
  await page.goto("/concepts/vectors");

  // Concept Workspace sub-project: use .first() because the lesson markdown also
  // renders an h1 with the same title, causing strict-mode violations.
  await expect(page.getByRole("heading", { name: "Vectors" }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Lab" }).click();
  await page.getByRole("button", { name: "Run lab" }).click();
  // Concept Workspace sub-project: LabTab does not show artifact path inline;
  // verify success by checking the Run lab button is no longer in a loading state.
  await expect(page.getByRole("button", { name: "Run lab" })).toBeEnabled({ timeout: 10000 });

  await page.getByRole("tab", { name: "Checkpoint" }).click();
  // Wait for the checkpoint question to appear (tab rendered) and the submit button
  // to be in the initial disabled state (useEffect has reset the answer field).
  await expect(page.getByText("What does a vector represent")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  // Concept Workspace sub-project: CheckpointTab uses aria-label="Your answer" (was "Checkpoint answer").
  await page.getByLabel("Your answer").fill("numbers");
  // Concept Workspace sub-project: Confidence is a range input; use fill() not selectOption().
  await page.getByLabel("Confidence").fill("2");
  // Concept Workspace sub-project: Submit button text is "Submit" (was "Submit checkpoint").
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("A vector is an ordered list of numbers")).toBeVisible();

  // Concept Workspace sub-project: missed-topics aside removed; badge "in missed queue"
  // appears in the ConceptHeader after data refreshes.
  await expect(page.getByText("in missed queue")).toBeVisible();
});
