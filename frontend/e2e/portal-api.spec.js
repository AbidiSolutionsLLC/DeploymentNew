import { expect, test } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: "../backend/.env.test" });

const apiBaseUrl = process.env.VITE_API_URL || "http://127.0.0.1:4010/api/v1";
const testSecret = process.env.TEST_AUTH_SECRET || process.env.VITE_TEST_AUTH_SECRET;
const adminA = "portal-test-admin-a@example.invalid";
const adminB = "portal-test-admin-b@example.invalid";

const authHeaders = (email, secret = testSecret) => ({
  "x-test-auth-secret": secret,
  "x-test-user-email": email,
});

test.describe("portal API isolation and persistence", () => {
  let api;
  let companyAProject;
  let companyBProject;
  let companyATask;
  let companyBTask;
  let companyAGroup;

  test.beforeAll(async ({ playwright }) => {
    api = await playwright.request.newContext({ baseURL: `${apiBaseUrl}/` });

    const projectsA = await api.get("projects?limit=1000", { headers: authHeaders(adminA) });
    expect(projectsA.ok()).toBeTruthy();
    const visibleA = (await projectsA.json()).data;
    companyAProject = visibleA.find((project) => project.title === "Portal Test Project A");
    expect(companyAProject).toBeTruthy();

    const tasksA = await api.get("tasks/user", { headers: authHeaders(adminA) });
    expect(tasksA.ok()).toBeTruthy();
    companyATask = (await tasksA.json()).data.find((task) => task.title === "Portal Test Task A");
    expect(companyATask).toBeTruthy();

    const projectsB = await api.get("projects?limit=1000", { headers: authHeaders(adminB) });
    expect(projectsB.ok()).toBeTruthy();
    companyBProject = (await projectsB.json()).data.find((project) => project.title === "Portal Test Project B");
    expect(companyBProject).toBeTruthy();

    const tasksB = await api.get("tasks/user", { headers: authHeaders(adminB) });
    expect(tasksB.ok()).toBeTruthy();
    companyBTask = (await tasksB.json()).data.find((task) => task.title === "Portal Test Task B");
    expect(companyBTask).toBeTruthy();

    const groupsA = await api.get("project-groups", { headers: authHeaders(adminA) });
    expect(groupsA.ok()).toBeTruthy();
    companyAGroup = (await groupsA.json()).data.find((group) => group.name === "Portal Test Group A");
    expect(companyAGroup).toBeTruthy();
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test("returns only the authenticated company's projects and blocks cross-company detail", async () => {
    const list = await api.get("projects?limit=1000", { headers: authHeaders(adminA) });
    const projects = (await list.json()).data;
    expect(projects.map((project) => project.title)).toEqual(["Portal Test Project A"]);

    const crossCompany = await api.get(`projects/${companyBProject._id}`, {
      headers: authHeaders(adminA),
    });
    expect([403, 404]).toContain(crossCompany.status());
  });

  test("rejects cross-company task mutation", async () => {
    const response = await api.put(`tasks/${companyBTask._id}`, {
      data: { status: "Done" },
      headers: { ...authHeaders(adminA), "content-type": "application/json" },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("rejects invalid test credentials and missing test identity", async () => {
    const invalidSecret = await api.get("projects?limit=1000", {
      headers: authHeaders(adminA, "invalid-test-secret"),
    });
    expect(invalidSecret.status()).toBe(401);

    const missingIdentity = await api.get("projects?limit=1000", {
      headers: { "x-test-auth-secret": testSecret },
    });
    expect(missingIdentity.status()).toBe(401);
  });

  test("persists a task status mutation after reload", async () => {
    const update = await api.put(`tasks/${companyATask._id}`, {
      data: { status: "Done" },
      headers: { ...authHeaders(adminA), "content-type": "application/json" },
    });
    expect(update.ok()).toBeTruthy();

    const reload = await api.get(`tasks/${companyATask._id}`, { headers: authHeaders(adminA) });
    expect(reload.ok()).toBeTruthy();
    expect((await reload.json()).data.status).toBe("Done");

    await api.put(`tasks/${companyATask._id}`, {
      data: { status: "In Progress" },
      headers: { ...authHeaders(adminA), "content-type": "application/json" },
    });
  });

  test("rejects invalid payloads and missing resources", async () => {
    const invalidProject = await api.post("projects", {
      data: { title: "", status: "NotAProjectStatus" },
      headers: { ...authHeaders(adminA), "content-type": "application/json" },
    });
    expect([400, 422]).toContain(invalidProject.status());

    const invalidTask = await api.post("tasks", {
      data: { title: "", project: "not-an-object-id" },
      headers: { ...authHeaders(adminA), "content-type": "application/json" },
    });
    expect([400, 422]).toContain(invalidTask.status());

    const missingProject = await api.get("projects/507f1f77bcf86cd799439011", {
      headers: authHeaders(adminA),
    });
    expect(missingProject.status()).toBe(404);

    const missingGroup = await api.delete("project-groups/507f1f77bcf86cd799439011", {
      headers: authHeaders(adminA),
    });
    expect(missingGroup.status()).toBe(404);
  });

  test("creates, updates, and deletes a project group within the tenant", async () => {
    const created = await api.post("project-groups", {
      data: {
        name: "Portal Test Temporary Group",
        description: "Created by release-gate test",
        projects: [companyAProject._id],
      },
      headers: { ...authHeaders(adminA), "content-type": "application/json" },
    });
    expect(created.status()).toBe(201);
    const createdGroup = (await created.json()).data;

    const updated = await api.put(`project-groups/${createdGroup._id}`, {
      data: { name: "Portal Test Updated Group" },
      headers: { ...authHeaders(adminA), "content-type": "application/json" },
    });
    expect(updated.ok()).toBeTruthy();
    expect((await updated.json()).data.name).toBe("Portal Test Updated Group");

    const deleted = await api.delete(`project-groups/${createdGroup._id}`, {
      headers: authHeaders(adminA),
    });
    expect(deleted.ok()).toBeTruthy();

    const original = await api.get(`project-groups/${companyAGroup._id}`, {
      headers: authHeaders(adminA),
    });
    expect([404, 405]).toContain(original.status());
  });
});
