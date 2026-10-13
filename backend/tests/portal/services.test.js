const ProjectGroup = require('../../models/projectGroupSchema');
const Project = require('../../models/projectSchema');
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
});
