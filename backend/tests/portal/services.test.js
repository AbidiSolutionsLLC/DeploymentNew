const ProjectGroup = require('../../models/projectGroupSchema');
const Project = require('../../models/projectSchema');
const Task = require('../../models/taskSchema');
const User = require('../../models/userSchema');
const Department = require('../../models/department');
const projectGroupService = require('../../services/projectGroupService');
const projectService = require('../../services/projectService');
const taskService = require('../../services/taskService');

describe('Project Portal service guards', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('project-group updates ignore owner and company mass-assignment', async () => {
    const group = {
      owner: { toString: () => 'user-1' },
      name: 'Before',
      description: 'Before',
      projects: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(ProjectGroup, 'findOne').mockResolvedValue(group);

    await projectGroupService.updateGroup(
      { id: 'user-1', role: 'Employee' },
      'company-1',
      'group-1',
      {
        name: 'After',
        owner: 'user-2',
        company: 'company-2',
        description: 'Updated',
      }
    );

    expect(group.name).toBe('After');
    expect(group.description).toBe('Updated');
    expect(group.owner.toString()).toBe('user-1');
    expect(group.company).toBeUndefined();
    expect(group.save).toHaveBeenCalledTimes(1);
  });

  test('project-group associations reject projects outside the current company', async () => {
    jest.spyOn(Project, 'countDocuments').mockResolvedValue(0);

    await expect(
      projectGroupService.validateProjects('company-1', ['project-1'])
    ).rejects.toMatchObject({
      status: 400,
      message: 'All grouped projects must belong to the group company',
    });
  });

  test('project references reject users outside the current company', async () => {
    jest.spyOn(User, 'countDocuments').mockResolvedValue(1);

    await expect(
      projectService.validateCompanyReferences('company-1', {
        owner: 'user-1',
        team: ['user-2'],
      })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Owner and team members must belong to the project company',
    });
  });

  test('project references reject departments outside the current company', async () => {
    jest.spyOn(User, 'countDocuments').mockResolvedValue(1);
    jest.spyOn(Department, 'exists').mockResolvedValue(null);

    await expect(
      projectService.validateCompanyReferences('company-1', {
        owner: 'user-1',
        department: 'department-2',
      })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Department must belong to the project company',
    });
  });

  test('task assignees reject users outside the current company', async () => {
    jest.spyOn(User, 'countDocuments').mockResolvedValue(0);

    await expect(
      taskService.validateCompanyTeam('company-1', ['user-2'])
    ).rejects.toMatchObject({
      status: 400,
      message: 'All task team members must belong to the task company',
    });

  });

  test('task dependencies reject self references', async () => {
    await expect(
      taskService.validateDependencies('company-1', 'project-1', 'task-1', ['task-1'])
    ).rejects.toMatchObject({
      status: 400,
      message: 'A task cannot depend on itself',
    });
  });

  describe('deleteProject status restrictions', () => {
    const adminUser = { id: 'admin-1', role: 'Super Admin', hasProjectPortalAccess: true };

    test('rejects deleting an Active project', async () => {
      const activeProject = {
        _id: 'proj-1',
        company: 'company-1',
        title: 'Active Proj',
        status: 'Active',
        team: [],
        owner: 'user-1',
      };
      jest.spyOn(Project, 'findOne').mockResolvedValue(activeProject);

      await expect(
        projectService.deleteProject(adminUser, 'company-1', 'proj-1')
      ).rejects.toMatchObject({
        status: 400,
        message: 'Cannot delete project: Project status is "Active". It must be marked as "Completed" or "Cancelled" before deletion.',
      });
    });

    test('rejects deleting a Completed project if incomplete tasks exist', async () => {
      const completedProject = {
        _id: 'proj-1',
        company: 'company-1',
        title: 'Completed Proj',
        status: 'Completed',
        team: [],
        owner: 'user-1',
      };
      jest.spyOn(Project, 'findOne').mockResolvedValue(completedProject);
      jest.spyOn(Task, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([{ title: 'Task 1', status: 'Todo' }]),
      });

      await expect(
        projectService.deleteProject(adminUser, 'company-1', 'proj-1')
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('task(s) are not completed'),
      });
    });

    test('allows deleting a Cancelled project even if tasks are incomplete', async () => {
      const deleteOne = jest.fn().mockResolvedValue(undefined);
      const cancelledProject = {
        _id: 'proj-1',
        company: 'company-1',
        title: 'Cancelled Proj',
        status: 'Cancelled',
        team: [],
        owner: 'user-1',
        deleteOne,
      };
      jest.spyOn(Project, 'findOne').mockResolvedValue(cancelledProject);
      jest.spyOn(Task, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([{ title: 'Incomplete Task', status: 'In Progress' }]),
      });
      const deleteManyTasks = jest.spyOn(Task, 'deleteMany').mockResolvedValue({ deletedCount: 1 });
      jest.spyOn(ProjectGroup, 'findByIdAndUpdate').mockResolvedValue(null);
      jest.spyOn(ProjectGroup, 'updateMany').mockResolvedValue({ modifiedCount: 0 });

      await projectService.deleteProject(adminUser, 'company-1', 'proj-1');

      expect(deleteManyTasks).toHaveBeenCalledWith({ project: 'proj-1', company: 'company-1' });
      expect(deleteOne).toHaveBeenCalledTimes(1);
    });

    test('allows deleting a Completed project when all tasks are Done', async () => {
      const deleteOne = jest.fn().mockResolvedValue(undefined);
      const completedProject = {
        _id: 'proj-1',
        company: 'company-1',
        title: 'Completed Proj',
        status: 'Completed',
        team: [],
        owner: 'user-1',
        deleteOne,
      };
      jest.spyOn(Project, 'findOne').mockResolvedValue(completedProject);
      jest.spyOn(Task, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([{ title: 'Done Task', status: 'Done' }]),
      });
      const deleteManyTasks = jest.spyOn(Task, 'deleteMany').mockResolvedValue({ deletedCount: 1 });
      jest.spyOn(ProjectGroup, 'findByIdAndUpdate').mockResolvedValue(null);
      jest.spyOn(ProjectGroup, 'updateMany').mockResolvedValue({ modifiedCount: 0 });

      await projectService.deleteProject(adminUser, 'company-1', 'proj-1');

      expect(deleteManyTasks).toHaveBeenCalledWith({ project: 'proj-1', company: 'company-1' });
      expect(deleteOne).toHaveBeenCalledTimes(1);
    });
  });
});
