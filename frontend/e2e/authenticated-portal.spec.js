import { expect, test } from "@playwright/test";

const testUser = {
  id: "portal-test-admin-a@example.invalid",
  email: "portal-test-admin-a@example.invalid",
  name: "Portal Test Admin A",
  role: "Admin",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    window.localStorage.setItem("portalTestAuth", "true");
    const persisted = {
      auth: {
        user,
        azureAccount: null,
        isAuthenticated: true,
        loading: false,
      },
      user: user,
      attendanceTimer: {
        checkInn: null,
        checkOut: null,
        todayLog: null,
        loading: false,
        error: null,
      },
    };
    window.localStorage.setItem("persist:root", JSON.stringify(
      Object.fromEntries(Object.entries(persisted).map(([key, value]) => [key, JSON.stringify(value)]))
    ));
  }, testUser);
});

test("loads the project dashboard with live seeded data", async ({ page }) => {
  await page.goto("/project/projectDashboard", { waitUntil: "domcontentloaded" });

  await expect(page.locator("body")).toContainText("Project Command Center");
  await expect(page.locator("body")).toContainText("Portal Test Project A");
  await expect(page.locator("body")).toContainText("Portal Test Task A");
});

test("supports project search and opens project detail", async ({ page }) => {
  await page.goto("/project/projects", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Portal Test Project A", { exact: true }).first()).toBeVisible();
  const search = page.getByPlaceholder(/search/i).first();
  await search.fill("Portal Test Project A");
  await expect(page.locator("body")).toContainText("Portal Test Project A");
  await expect(page.getByText("Portal Test Project B")).toHaveCount(0);

  await page.getByText("Portal Test Project A", { exact: true }).first().click();
  await expect(page).toHaveURL(/\/project\/projectDetailed\//);
  await expect(page.locator("body")).toContainText("Portal Test Project A");
});

test("loads assigned tasks and project groups", async ({ page }) => {
  await page.goto("/project/myTasks", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
  await expect(page.getByText("Portal Test Task A", { exact: true }).first()).toBeVisible();

  await page.goto("/project/projectGroups", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Project Groups" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Portal Test Group A");
});

test("updates a task status and retains it after reload", async ({ page }) => {
  await page.goto("/project/myTasks", { waitUntil: "domcontentloaded" });

  const taskRow = page.getByRole("row").filter({ hasText: "Portal Test Task A" });
  const status = taskRow.getByRole("button", { name: "In Progress" });
  await expect(status).toBeVisible();
  await status.click();
  await page.locator('[data-modern-select-dropdown="true"]').getByText("Done", { exact: true }).click();
  await expect(taskRow.getByRole("button", { name: "Done" })).toBeVisible();

  await page.reload({ waitUntil: "domcontentloaded" });
  const reloadedTaskRow = page.getByRole("row").filter({ hasText: "Portal Test Task A" });
  await expect(reloadedTaskRow.getByRole("button", { name: "Done" })).toBeVisible();

  await reloadedTaskRow.getByRole("button", { name: "Done" }).click();
  await page.locator('[data-modern-select-dropdown="true"]').getByText("In Progress", { exact: true }).click();
});
