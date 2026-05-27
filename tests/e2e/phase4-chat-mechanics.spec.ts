import { expect, test } from "@playwright/test";

test("learner sends a traced chat message with tool verification and memory", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Learn LLM The Hard Way" })).toBeVisible();
  await page
    .getByRole("region", { name: "Concept map" })
    .getByRole("button", { name: "Message Formatting" })
    .click();
  await expect(page.getByRole("heading", { name: "Message Formatting" })).toBeVisible();

  await page.getByRole("tab", { name: "Lab" }).click();
  await page.getByRole("button", { name: "Run lab" }).click();
  await expect(page.getByRole("status")).toContainText("artifacts/labs/chat-mechanics-demo.json");

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
