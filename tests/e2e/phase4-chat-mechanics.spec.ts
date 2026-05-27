import { expect, test } from "@playwright/test";

test("learner sends a traced chat message with tool verification and memory", async ({ page }) => {
  // App-shell sub-project: direct route nav replaces old-dashboard click-through.
  await page.goto("/concepts/message-formatting");

  await expect(page.getByRole("heading", { name: "Message Formatting" })).toBeVisible();

  await page.getByRole("tab", { name: "Lab" }).click();
  await page.getByRole("button", { name: "Run lab" }).click();
  await expect(page.getByText("artifacts/labs/chat-mechanics-demo.json")).toBeVisible();

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
