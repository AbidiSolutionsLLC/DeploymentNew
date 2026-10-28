const taskService = require('../../services/taskService');
const Task = require('../../models/taskSchema');
const Project = require('../../models/projectSchema');
const User = require('../../models/userSchema');
const userService = require('../../services/userService');
const notificationService = require('../../utils/notificationService');

describe('Task Multiple Assignees & Edge Cases', () => {
  const companyId = '507f1f77bcf86cd799439011';
  const projectId = '507f1f77bcf86cd799439012';
  const adminUser = {
    _id: '507f1f77bcf86cd799439001',
    id: '507f1f77bcf86cd799439001',
    role: 'Admin',
    company: companyId,
    hasProjectPortalAccess: true,
    projectRole: 'Project Administrator',
  };
  const assignee1 = '507f1f77bcf86cd799439021';
  const assignee2 = '507f1f77bcf86cd799439022';
  const outsideUser = '507f1f77bcf86cd799439099';

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(notificationService, 'createNotification').mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Task Creation with Multiple Assignees', () => {
    test('creates a task with 2 assignees and notifies both', async () => {
      jest.spyOn(Project, 'findOne').mockResolvedValue({
        _id: projectId,
        title: 'Project Alpha',
        company: companyId,
      });
      jest.spyOn(User, 'countDocuments').mockResolvedValue(2);

      jest.spyOn(Task.prototype, 'save').mockImplementation(function () {
        this._id = '507f1f77bcf86cd799439033';
        this.populate = jest.fn().mockResolvedValue(this);
        return Promise.resolve(this);
      });

      const result = await taskService.createTask(
        adminUser,
        companyId,
        {
          title: 'Co-assigned Feature Task',
          project: projectId,
          team: [assignee1, assignee2],
          status: 'Todo',
        }
      );

      expect(result.team.map(String)).toEqual([assignee1, assignee2]);
      const calls = notificationService.createNotification.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls.map((c) => c[0].recipient.toString())).toEqual([assignee1, assignee2]);
      expect(calls[0][0].type).toBe('TASK_ASSIGNED');
      expect(calls[1][0].type).toBe('TASK_ASSIGNED');
    });

    test('accepts data.assignees array and normalizes to team', async () => {
      jest.spyOn(Project, 'findOne').mockResolvedValue({
        _id: projectId,
        title: 'Project Alpha',
        company: companyId,
      });
      jest.spyOn(User, 'countDocuments').mockResolvedValue(2);

      jest.spyOn(Task.prototype, 'save').mockImplementation(function () {
        this._id = '507f1f77bcf86cd799439034';
        this.populate = jest.fn().mockResolvedValue(this);
        return Promise.resolve(this);
      });

      const result = await taskService.createTask(
        adminUser,
        companyId,
        {
          title: 'Task via assignees payload',
          project: projectId,
          assignees: [assignee1, assignee2],
        }
      );

      expect(result.team.map(String)).toEqual([assignee1, assignee2]);
    });

    test('deduplicates duplicate assignees on creation', async () => {
      jest.spyOn(Project, 'findOne').mockResolvedValue({
        _id: projectId,
        title: 'Project Alpha',
        company: companyId,
      });
      jest.spyOn(User, 'countDocuments').mockResolvedValue(1);

      jest.spyOn(Task.prototype, 'save').mockImplementation(function () {
        this._id = '507f1f77bcf86cd799439035';
        this.populate = jest.fn().mockResolvedValue(this);
        return Promise.resolve(this);
      });

      const result = await taskService.createTask(
        adminUser,
        companyId,
        {
          title: 'Duplicate Assignees Task',
          project: projectId,
          team: [assignee1, assignee1, assignee1],
        }
      );

      expect(result.team.map(String)).toEqual([assignee1]);
      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });

    test('rejects assignees who do not belong to the company', async () => {
      jest.spyOn(Project, 'findOne').mockResolvedValue({
        _id: projectId,
        title: 'Project Alpha',
        company: companyId,
      });
      // User.countDocuments returns 1 when 2 were passed (one outside company)
      jest.spyOn(User, 'countDocuments').mockResolvedValue(1);

      await expect(
        taskService.createTask(adminUser, companyId, {
          title: 'Cross-company Assignee Task',
          project: projectId,
          team: [assignee1, outsideUser],
        })
      ).rejects.toMatchObject({
        status: 400,
        message: 'All task team members must belong to the task company',
      });
    });
  });

  describe('Task Updating & Reassignment to 2 Members', () => {
    test('adding a 2nd assignee notifies ONLY the newly added member', async () => {
      const existingTask = new Task({
        _id: '507f1f77bcf86cd799439040',
        title: 'Existing Single Assignee Task',
        company: companyId,
        project: projectId,
        team: [assignee1],
        status: 'Todo',
      });
      existingTask.populate = jest.fn().mockResolvedValue(existingTask);

      jest.spyOn(Task, 'findOne').mockResolvedValue(existingTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: projectId, title: 'Project Alpha' }),
      });
      jest.spyOn(User, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(existingTask, 'save').mockResolvedValue(existingTask);

      await taskService.updateTask(
        adminUser,
        companyId,
        existingTask._id,
        {
          team: [assignee1, assignee2],
        }
      );

      expect(existingTask.team.map(String)).toEqual([assignee1, assignee2]);
      // Only assignee2 is newly added, so only assignee2 should receive notification
      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: assignee2,
          type: 'TASK_ASSIGNED',
        })
      );
    });

    test('blocks Employee from altering team members on assigned task', async () => {
      const employeeUser = {
        _id: assignee1,
        id: assignee1,
        role: 'Employee',
        company: companyId,
        hasProjectPortalAccess: true,
        projectRole: 'Team Member',
      };

      const existingTask = new Task({
        _id: '507f1f77bcf86cd799439041',
        title: 'Task Assigned to Two Employees',
        company: companyId,
        project: projectId,
        team: [assignee1, assignee2],
        status: 'Todo',
      });

      jest.spyOn(Task, 'findOne').mockResolvedValue(existingTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: projectId, owner: adminUser._id }),
      });

      await expect(
        taskService.updateTask(
          employeeUser,
          companyId,
          existingTask._id,
          {
            team: [assignee1], // Employee trying to remove assignee2
          }
        )
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members can only update task status, progress percentage, worked hours, and description.',
      });
    });

    test('allows second assignee (co-assignee) to update uncritical fields', async () => {
      const secondAssigneeUser = {
        _id: assignee2,
        id: assignee2,
        role: 'Employee',
        company: companyId,
        hasProjectPortalAccess: true,
        projectRole: 'Team Member',
      };

      const existingTask = new Task({
        _id: '507f1f77bcf86cd799439042',
        title: 'Task Assigned to Two Employees',
        company: companyId,
        project: projectId,
        team: [assignee1, assignee2],
        status: 'Todo',
        description: 'Original description',
      });
      existingTask.populate = jest.fn().mockResolvedValue(existingTask);

      jest.spyOn(Task, 'findOne').mockResolvedValue(existingTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: projectId, owner: adminUser._id }),
      });
      jest.spyOn(existingTask, 'save').mockResolvedValue(existingTask);

      const updated = await taskService.updateTask(
        secondAssigneeUser,
        companyId,
        existingTask._id,
        {
          description: 'Updated by 2nd assignee',
          status: 'In Progress',
          completionPercent: 50,
        }
      );

      expect(updated.description).toBe('Updated by 2nd assignee');
      expect(updated.status).toBe('In Progress');
      expect(updated.completionPercent).toBe(50);
    });
  });

  describe('User Summary with Multi-assigned Tasks', () => {
    test('getUserSummary counts task if user is one of multiple assignees', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: assignee2,
        bookedLeaves: 2,
      });

      const countSpy = jest.spyOn(Task, 'countDocuments').mockResolvedValue(3);
      const TimeLog = require('../../models/timeLogsSchema');
      jest.spyOn(TimeLog, 'find').mockResolvedValue([]);

      const summary = await userService.getUserSummary(assignee2, companyId);

      expect(countSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          company: companyId,
          status: { $ne: 'Done' },
          $or: [{ team: assignee2 }, { assignee: assignee2 }],
        })
      );
      expect(summary.taskCount).toBe(3);
    });
  });
});
