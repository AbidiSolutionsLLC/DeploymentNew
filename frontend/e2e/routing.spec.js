import { test, expect } from "@playwright/test";

test("unauthenticated users are sent to the login page", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator("body")).not.toContainText("Project Dashboard");
});

test("protected project routes do not expose portal content without authentication", async ({ page }) => {
  await page.goto("/project/projectDashboard", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator("body")).not.toContainText("Project Dashboard");
});

for (const route of [
  "/project/projectDashboard",
  "/project/projects",
  "/project/myTasks",
  "/project/projectGroups",
  "/project/projectDetailed/507f1f77bcf86cd799439011",
]) {
  test(`protects ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
}

test("login form exposes required controls and stays within the viewport", async ({ page }) => {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
  await expect(page.getByLabel("Email Address")).toHaveAttribute("required", "");
  await expect(page.getByLabel("Password")).toHaveAttribute("required", "");
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot Password?" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`login layout has no horizontal overflow at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
}
