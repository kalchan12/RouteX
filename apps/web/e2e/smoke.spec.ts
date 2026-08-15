import { expect, test } from "@playwright/test";

test("dashboard loads and shows the sidebar", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("RouteX")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("simulations page renders", async ({ page }) => {
  await page.goto("/simulations");
  await expect(
    page.getByRole("heading", { name: "Simulations" })
  ).toBeVisible();
  await expect(page.getByText("New simulation")).toBeVisible();
});
