import { expect, test } from "@playwright/test";

const isConfigured = Boolean(
  process.env.PLAYWRIGHT_BASE_URL &&
  process.env.PLAYWRIGHT_SIGNIN_EMAIL &&
  process.env.PLAYWRIGHT_SIGNIN_PASSWORD,
);

test.describe("notifications", () => {
  test.skip(!isConfigured, "Set PLAYWRIGHT_BASE_URL and sign-in credentials to run e2e smoke tests.");

  test("user can open the alerts screen", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(process.env.PLAYWRIGHT_SIGNIN_EMAIL!);
    await page.getByLabel("Password").fill(process.env.PLAYWRIGHT_SIGNIN_PASSWORD!);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.goto("/notifications");

    await expect(page.getByRole("heading", { name: "Alerts" })).toBeVisible();
  });
});
