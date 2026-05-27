import { expect, test } from "@playwright/test";

test("learner sends a traced chat message with tool verification and memory", async ({ page }) => {
  // App-shell sub-project: direct route nav replaces old-dashboard click-through.
  await page.goto("/concepts/message-formatting");

  // Concept Workspace sub-project: use .first() for safety; heading appears in ConceptHeader.
  await expect(page.getByRole("heading", { name: "Message Formatting" }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Lab" }).click();
  await page.getByRole("button", { name: "Run lab" }).click();
  // Concept Workspace sub-project: LabTab does not show artifact path inline;
  // verify lab completed by checking the button is no longer in a loading state.
  await expect(page.getByRole("button", { name: "Run lab" })).toBeEnabled({ timeout: 10000 });

  // Concept Workspace sub-project: ChatPlayground renders inside the Experiment tab
  // (chat concepts default to Experiment). Switch to Experiment tab to access it.
  await page.getByRole("tab", { name: "Experiment" }).click();
  await expect(page.getByRole("heading", { name: "Chat Playground" })).toBeVisible();
  await page.getByLabel("Memory to save").fill("Learning attention first.");
  await page.getByRole("button", { name: "Save memory" }).click();
  await expect(page.getByText("Learning attention first.")).toBeVisible();

  await page.getByLabel("Chat message").fill("What is 19 * 23?");
  await page.getByLabel("Tool mode").selectOption("verified");
  await page.getByLabel("Memory mode").selectOption("saved");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("heading", { name: "Assistant reply" })).toBeVisible();
  await expect(page.getByText("437").first()).toBeVisible();
  await expect(page.getByText("Prompt trace")).toBeVisible();
  await expect(page.getByText("Token trace")).toBeVisible();
  await expect(page.getByText("Context trace")).toBeVisible();
  await expect(page.getByText("Sampling trace")).toBeVisible();
  await expect(page.getByText("Stream trace")).toBeVisible();
  await expect(page.getByText("Tool trace")).toBeVisible();
  await expect(page.getByText("Memory trace")).toBeVisible();
  await expect(page.getByText("arithmetic-verifier")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Failure Museum" })).toBeVisible();
  await expect(page.getByText("arithmetic", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preference Simulation" })).toBeVisible();
  await expect(page.getByText("Winner: verified")).toBeVisible();
});
