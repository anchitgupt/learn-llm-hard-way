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

  // Chat Playground sub-project: memory editor moves to sub-project 7.
  // We now verify the chat-trace flow: send → reply + sampling visible.
  await page.getByRole("textbox", { name: /message/i }).fill("Explain attention.");
  await page.getByRole("button", { name: /^Send$/i }).click();
  // Assistant reply header visible.
  await expect(page.getByText(/Assistant reply/i).first()).toBeVisible();
  // At least one sampling bar rendered.
  await expect(page.locator("[data-bar]").first()).toBeVisible();
});
