const mongoose = require('mongoose');
const projectService = require('../../services/projectService');
const taskService = require('../../services/taskService');
const projectGroupService = require('../../services/projectGroupService');
const Project = require('../../models/projectSchema');
const Task = require('../../models/taskSchema');
const User = require('../../models/userSchema');

describe('Project Portal RBAC Enforcement', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const companyId = new mongoose.Types.ObjectId();

  const superAdminId = new mongoose.Types.ObjectId();
  const superAdmin = {
    _id: superAdminId,
    id: superAdminId.toString(),
    role: 'Super Admin',
    company: companyId,
    hasProjectPortalAccess: true,
  };

  const managerUserId = new mongoose.Types.ObjectId();
  const managerUser = {
    _id: managerUserId,
    id: managerUserId.toString(),
    role: 'Manager',
    company: companyId,
    hasProjectPortalAccess: true,
  };

  const employeeUserId = new mongoose.Types.ObjectId();
  const employeeUser = {
    _id: employeeUserId,
    id: employeeUserId.toString(),
    role: 'Employee',
    company: companyId,
    hasProjectPortalAccess: true,
  };

  const unauthorizedEmployeeId = new mongoose.Types.ObjectId();
  const unauthorizedEmployee = {
    _id: unauthorizedEmployeeId,
    id: unauthorizedEmployeeId.toString(),
    role: 'Employee',
    company: companyId,
    hasProjectPortalAccess: false,
  };

  const hrUserId = new mongoose.Types.ObjectId();
  const hrUser = {
    _id: hrUserId,
    id: hrUserId.toString(),
    role: 'HR',
    company: companyId,
    hasProjectPortalAccess: true,
  };

  const unauthorizedHrId = new mongoose.Types.ObjectId();
  const unauthorizedHr = {
    _id: unauthorizedHrId,
    id: unauthorizedHrId.toString(),
    role: 'HR',
    company: companyId,
    hasProjectPortalAccess: false,
  };

  describe('Project Portal Access Gate', () => {
    test('blocks users without project portal access', async () => {
      await expect(
        projectService.getAllProjects(unauthorizedEmployee, companyId, {})
      ).rejects.toMatchObject({
        status: 403,
        message: 'You do not have access to the Project Portal.',
      });
    });

    test('allows super admin even if hasProjectPortalAccess is false on user object', async () => {
      const adminNoFlag = { ...superAdmin, hasProjectPortalAccess: false };
      const chain = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(Project, 'find').mockReturnValue(chain);
      jest.spyOn(Project, 'countDocuments').mockResolvedValue(0);

      const result = await projectService.getAllProjects(adminNoFlag, companyId, {});
      expect(result).toBeDefined();
    });
  });

  describe('Project Creation RBAC', () => {
    test('blocks Manager from creating a project', async () => {
      await expect(
        projectService.createProject(managerUser, companyId, {
          title: 'New Project',
          owner: managerUser._id,
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Only Project Administrators can create new projects.',
      });
    });

    test('blocks Employee from creating a project', async () => {
      await expect(
        projectService.createProject(employeeUser, companyId, {
          title: 'New Project',
          owner: employeeUser._id,
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Only Project Administrators can create new projects.',
      });
    });
  });

  describe('Task Creation RBAC', () => {
    test('blocks Employee from creating a task', async () => {
      await expect(
        taskService.createTask(employeeUser, companyId, {
          title: 'Employee Task',
          project: new mongoose.Types.ObjectId(),
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members cannot create new tasks.',
      });
    });

    test('blocks Manager from creating a task in a project they do not manage or belong to', async () => {
      const projectId = new mongoose.Types.ObjectId();
      const unrelatedManagerId = new mongoose.Types.ObjectId();
      jest.spyOn(Project, 'findOne').mockResolvedValue({
        _id: projectId,
        company: companyId,
        owner: unrelatedManagerId,
        team: [],
      });

      await expect(
        taskService.createTask(managerUser, companyId, {
          title: 'Manager Task',
          project: projectId,
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Project managers can only create tasks in projects they manage or belong to.',
      });
    });
  });

  describe('Task Modification RBAC (Critical vs Uncritical)', () => {
    test('blocks Employee from modifying critical field: team assignee', async () => {
      const taskId = new mongoose.Types.ObjectId();
      const mockTask = {
        _id: taskId,
        team: [employeeUser._id],
        project: new mongoose.Types.ObjectId(),
        company: companyId,
        save: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: mockTask.project, owner: managerUser._id }),
      });

      await expect(
        taskService.updateTask(employeeUser, companyId, taskId, {
          team: [new mongoose.Types.ObjectId()],
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members can only update task status, progress percentage, worked hours, and description.',
      });
    });

    test('blocks Employee from modifying critical field: priority', async () => {
      const taskId = new mongoose.Types.ObjectId();
      const mockTask = {
        _id: taskId,
        team: [employeeUser._id],
        project: new mongoose.Types.ObjectId(),
        company: companyId,
        priority: 'Medium',
        save: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: mockTask.project, owner: managerUser._id }),
      });

      await expect(
        taskService.updateTask(employeeUser, companyId, taskId, {
          priority: 'High',
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members can only update task status, progress percentage, worked hours, and description.',
      });
    });

    test('blocks Employee from modifying another employee\'s task', async () => {
      const taskId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      const mockTask = {
        _id: taskId,
        team: [otherUserId],
        project: new mongoose.Types.ObjectId(),
        company: companyId,
        save: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: mockTask.project, owner: managerUser._id }),
      });

      await expect(
        taskService.updateTask(employeeUser, companyId, taskId, {
          status: 'In Progress',
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'You can only modify tasks assigned to you.',
      });
    });

    test('allows Employee to update uncritical fields (description, status, completionPercent, workedHours) on own task', async () => {
      const taskId = new mongoose.Types.ObjectId();
      const mockTask = {
        _id: taskId,
        title: 'Task Title',
        team: [employeeUser._id],
        project: new mongoose.Types.ObjectId(),
        company: companyId,
        description: 'Old Description',
        status: 'To Do',
        completionPercent: 0,
        workedHours: 2,
        save: jest.fn(),
      };
      mockTask.save.mockResolvedValue(mockTask);

      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: mockTask.project, owner: managerUser._id }),
      });

      await taskService.updateTask(employeeUser, companyId, taskId, {
        description: 'Updated uncritical description',
        status: 'In Progress',
        completionPercent: 50,
        workedHours: 6,
      });

      expect(mockTask.description).toBe('Updated uncritical description');
      expect(mockTask.status).toBe('In Progress');
      expect(mockTask.completionPercent).toBe(50);
      expect(mockTask.workedHours).toBe(6);
      expect(mockTask.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Project Group RBAC', () => {
    test('blocks Manager from creating a project group', async () => {
      await expect(
        projectGroupService.createGroup(managerUser, companyId, {
          name: 'Marketing Portfolio',
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Only Project Administrators can create project groups',
      });
    });

    test('blocks Employee from deleting a project group', async () => {
      jest.spyOn(require('../../models/projectGroupSchema'), 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        company: companyId,
      });

      await expect(
        projectGroupService.deleteGroup(employeeUser, companyId, 'group-1')
      ).rejects.toMatchObject({
        status: 403,
        message: 'Not authorized to delete this group',
      });
    });
  });

  describe('HR Role RBAC Enforcement (Matches Employee Privileges)', () => {
    test('blocks HR without portal access from accessing project portal', async () => {
      await expect(
        projectService.getAllProjects(unauthorizedHr, companyId, {})
      ).rejects.toMatchObject({
        status: 403,
        message: 'You do not have access to the Project Portal.',
      });
    });

    test('blocks HR from creating projects', async () => {
      await expect(
        projectService.createProject(hrUser, companyId, {
          title: 'HR Project',
          owner: hrUser._id,
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Only Project Administrators can create new projects.',
      });
    });

    test('blocks HR from creating tasks', async () => {
      await expect(
        taskService.createTask(hrUser, companyId, {
          title: 'HR Task',
          project: new mongoose.Types.ObjectId(),
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members cannot create new tasks.',
      });
    });

    test('blocks HR from deleting tasks', async () => {
      const taskId = new mongoose.Types.ObjectId();
      jest.spyOn(Task, 'findOne').mockResolvedValue({
        _id: taskId,
        company: companyId,
        project: new mongoose.Types.ObjectId(),
      });

      await expect(
        taskService.deleteTask(hrUser, companyId, taskId)
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members cannot delete tasks.',
      });
    });

    test('blocks HR from creating project groups', async () => {
      await expect(
        projectGroupService.createGroup(hrUser, companyId, {
          name: 'HR Portfolio',
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Only Project Administrators can create project groups',
      });
    });

    test('blocks HR from deleting project groups', async () => {
      jest.spyOn(require('../../models/projectGroupSchema'), 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        company: companyId,
      });

      await expect(
        projectGroupService.deleteGroup(hrUser, companyId, 'group-hr')
      ).rejects.toMatchObject({
        status: 403,
        message: 'Not authorized to delete this group',
      });
    });

    test('blocks HR from modifying critical field (priority) on assigned task', async () => {
      const taskId = new mongoose.Types.ObjectId();
      const mockTask = {
        _id: taskId,
        team: [hrUser._id],
        project: new mongoose.Types.ObjectId(),
        company: companyId,
        priority: 'Medium',
        save: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: mockTask.project, owner: managerUser._id }),
      });

      await expect(
        taskService.updateTask(hrUser, companyId, taskId, {
          priority: 'High',
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members can only update task status, progress percentage, worked hours, and description.',
      });
    });

    test('blocks HR from modifying another user\'s task', async () => {
      const taskId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      const mockTask = {
        _id: taskId,
        team: [otherUserId],
        project: new mongoose.Types.ObjectId(),
        company: companyId,
        save: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: mockTask.project, owner: managerUser._id }),
      });

      await expect(
        taskService.updateTask(hrUser, companyId, taskId, {
          status: 'In Progress',
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'You can only modify tasks assigned to you.',
      });
    });

    test('allows HR to update uncritical fields on own assigned task', async () => {
      const taskId = new mongoose.Types.ObjectId();
      const mockTask = {
        _id: taskId,
        title: 'HR Review Task',
        team: [hrUser._id],
        project: new mongoose.Types.ObjectId(),
        company: companyId,
        description: 'Original HR Description',
        status: 'To Do',
        completionPercent: 0,
        workedHours: 1,
        save: jest.fn(),
      };
      mockTask.save.mockResolvedValue(mockTask);

      jest.spyOn(Task, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(Project, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: mockTask.project, owner: managerUser._id }),
      });

      await taskService.updateTask(hrUser, companyId, taskId, {
        description: 'Updated HR notes',
        status: 'In Progress',
        completionPercent: 40,
        workedHours: 4,
      });

      expect(mockTask.description).toBe('Updated HR notes');
      expect(mockTask.status).toBe('In Progress');
      expect(mockTask.completionPercent).toBe(40);
      expect(mockTask.workedHours).toBe(4);
      expect(mockTask.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Project Portal Roles (Decoupled from People Portal Roles)', () => {
    test('Employee with projectRole = Manager can create tasks for managed projects', async () => {
      const empManagerId = new mongoose.Types.ObjectId();
      const empManager = {
        _id: empManagerId,
        id: empManagerId.toString(),
        role: 'Employee', // People Portal role is STILL Employee!
        projectRole: 'Manager', // Elevated in Project Portal
        company: companyId,
        hasProjectPortalAccess: true,
      };

      const projectId = new mongoose.Types.ObjectId();
      jest.spyOn(Project, 'findOne').mockResolvedValue({
        _id: projectId,
        owner: empManagerId,
        team: [],
      });
      jest.spyOn(Task.prototype, 'save').mockImplementation(function() {
        return Promise.resolve(this);
      });

      const task = await taskService.createTask(empManager, companyId, {
        title: 'Manager Task Created By Elevated Employee',
        project: projectId,
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('Manager Task Created By Elevated Employee');
      expect(empManager.role).toBe('Employee'); // Confirm company role is unchanged!
    });

    test('Employee with projectRole = Manager is still blocked from creating projects', async () => {
      const empManagerId = new mongoose.Types.ObjectId();
      const empManager = {
        _id: empManagerId,
        id: empManagerId.toString(),
        role: 'Employee',
        projectRole: 'Manager',
        company: companyId,
        hasProjectPortalAccess: true,
      };

      await expect(
        projectService.createProject(empManager, companyId, {
          title: 'Project Creation Should Fail for Manager',
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Only Project Administrators can create new projects.',
      });
    });

    test('Employee with projectRole = Admin can create projects', async () => {
      const empAdminId = new mongoose.Types.ObjectId();
      const empAdmin = {
        _id: empAdminId,
        id: empAdminId.toString(),
        role: 'Employee', // People Portal role is STILL Employee!
        projectRole: 'Admin', // Admin in Project Portal
        company: companyId,
        hasProjectPortalAccess: true,
      };

      jest.spyOn(projectService, 'validateCompanyReferences').mockResolvedValue(true);
      jest.spyOn(Project.prototype, 'save').mockImplementation(function() {
        return Promise.resolve(this);
      });

      const newProj = await projectService.createProject(empAdmin, companyId, {
        title: 'Admin Project Created by Elevated Employee',
        owner: empAdminId,
      });

      expect(newProj).toBeDefined();
      expect(empAdmin.role).toBe('Employee'); // Confirm People Portal role is untouched!
    });

    test('Manager in People Portal with projectRole = Employee is restricted to employee permissions in Project Portal', async () => {
      const mgrDemotedId = new mongoose.Types.ObjectId();
      const mgrDemoted = {
        _id: mgrDemotedId,
        id: mgrDemotedId.toString(),
        role: 'Manager', // People Portal role is Manager
        projectRole: 'Employee', // But in Project Portal, restricted to Employee
        company: companyId,
        hasProjectPortalAccess: true,
      };

      await expect(
        taskService.createTask(mgrDemoted, companyId, {
          title: 'Should be blocked',
          project: new mongoose.Types.ObjectId(),
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members cannot create new tasks.',
      });
    });

    test('userService.updateProjectPortalAccess updates projectRole and preserves company role', async () => {
      const targetUser = {
        _id: new mongoose.Types.ObjectId(),
        company: companyId,
        role: 'Employee',
        hasProjectPortalAccess: false,
        projectRole: null,
        save: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(targetUser);
      jest.spyOn(User, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      await require('../../services/userService').updateProjectPortalAccess(superAdmin, {
        userId: targetUser._id,
        projectRole: 'Manager',
        hasProjectPortalAccess: true,
      });

      expect(targetUser.projectRole).toBe('Project Manager');
      expect(targetUser.hasProjectPortalAccess).toBe(true);
      expect(targetUser.role).toBe('Employee'); // Untouched!
      expect(targetUser.save).toHaveBeenCalledTimes(1);
    });

    test('Standardized role Project Administrator has full portal powers', async () => {
      const projAdminId = new mongoose.Types.ObjectId();
      const projAdmin = {
        _id: projAdminId,
        id: projAdminId.toString(),
        role: 'Employee',
        projectRole: 'Project Administrator',
        company: companyId,
        hasProjectPortalAccess: true,
      };

      jest.spyOn(projectService, 'validateCompanyReferences').mockResolvedValue(true);
      jest.spyOn(Project.prototype, 'save').mockImplementation(function() {
        return Promise.resolve(this);
      });

      const newProj = await projectService.createProject(projAdmin, companyId, {
        title: 'Project Admin Created Project',
        owner: projAdminId,
      });

      expect(newProj).toBeDefined();
      expect(projAdmin.role).toBe('Employee');
    });

    test('Standardized role Team Member is restricted to task execution', async () => {
      const teamMemberId = new mongoose.Types.ObjectId();
      const teamMember = {
        _id: teamMemberId,
        id: teamMemberId.toString(),
        role: 'Employee',
        projectRole: 'Team Member',
        company: companyId,
        hasProjectPortalAccess: true,
      };

      await expect(
        taskService.createTask(teamMember, companyId, {
          title: 'Blocked Task',
          project: new mongoose.Types.ObjectId(),
        })
      ).rejects.toMatchObject({
        status: 403,
        message: 'Team members cannot create new tasks.',
      });
    });
  });
});
