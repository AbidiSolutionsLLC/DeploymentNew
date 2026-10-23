const Project = require('../../models/projectSchema');
const Task = require('../../models/taskSchema');
const { projectSchema, projectUpdateSchema } = require('../../JoiSchema/ProjectJoiSchema');
const { taskSchema } = require('../../JoiSchema/TaskJoiSchema');
const projectService = require('../../services/projectService');
const taskService = require('../../services/taskService');

describe('Project Portal contracts', () => {
  test('Joi and Mongoose project statuses stay aligned', () => {
    const modelValues = Project.schema.path('status').enumValues;
    const joiValues = projectSchema.describe().keys.status.allow;

    expect(joiValues).toEqual(expect.arrayContaining(modelValues));
    expect(modelValues).toEqual(expect.arrayContaining(joiValues));
  });

  test('Joi and Mongoose task statuses and priorities stay aligned', () => {
    const priorityModelValues = Task.schema.path('priority').enumValues;
    const taskDescription = taskSchema.describe().keys;

    expect(taskDescription.priority.allow).toEqual(expect.arrayContaining(priorityModelValues));
    expect(priorityModelValues).toEqual(expect.arrayContaining(taskDescription.priority.allow));
    expect(taskDescription.status.type).toBe('string');
    expect(Task.schema.path('status').instance).toBe('String');
  });

  test('project create and update department requirements match Mongoose', () => {
    expect(projectSchema.validate({ title: 'Portal' }).error).toBeTruthy();
    expect(projectUpdateSchema.validate({ title: 'Portal' }).error).toBeFalsy();
    expect(Project.schema.path('department').isRequired).toBe(true);
  });

  test('task duration contract is numeric and non-negative', () => {
    expect(taskSchema.validate({
      title: 'Task',
      project: '507f1f77bcf86cd799439011',
      duration: 2,
    }).error).toBeFalsy();
    expect(taskSchema.validate({
      title: 'Task',
      project: '507f1f77bcf86cd799439011',
      duration: -1,
    }).error).toBeTruthy();
  });

  test('task completion percent contract is between 0 and 100', () => {
    expect(taskSchema.validate({
      title: 'Task',
      project: '507f1f77bcf86cd799439011',
      completionPercent: 50,
    }).error).toBeFalsy();
    expect(taskSchema.validate({
      title: 'Task',
      project: '507f1f77bcf86cd799439011',
      completionPercent: 120,
    }).error).toBeTruthy();
  });

  test('service exports required project portal methods', () => {
    expect(typeof projectService.getProjectDashboard).toBe('function');
    expect(typeof projectService.getProjectDashboardCards).toBe('function');
    expect(typeof projectService.addProjectDashboardCard).toBe('function');
    expect(typeof projectService.removeProjectDashboardCard).toBe('function');
    expect(typeof taskService.getProjectTasks).toBe('function');
  });
});
