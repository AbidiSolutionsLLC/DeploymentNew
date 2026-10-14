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
    const statusModelValues = Task.schema.path('status').enumValues;
    const priorityModelValues = Task.schema.path('priority').enumValues;
    const taskDescription = taskSchema.describe().keys;

    expect(taskDescription.status.allow).toEqual(expect.arrayContaining(statusModelValues));
    expect(statusModelValues).toEqual(expect.arrayContaining(taskDescription.status.allow));
    expect(taskDescription.priority.allow).toEqual(expect.arrayContaining(priorityModelValues));
    expect(priorityModelValues).toEqual(expect.arrayContaining(taskDescription.priority.allow));
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

  test('attachment mapping preserves Azure upload metadata', () => {
    const file = {
      blobName: 'portal/task.pdf',
      url: 'https://example.test/task.pdf',
      originalname: 'task.pdf',
      mimetype: 'application/pdf',
      size: 42,
    };

    expect(projectService.mapAttachments([file])).toEqual([{
      public_id: 'portal/task.pdf',
      url: 'https://example.test/task.pdf',
      originalname: 'task.pdf',
      format: 'application/pdf',
      size: 42,
    }]);
    expect(taskService.mapAttachments([file])).toEqual([{
      public_id: 'portal/task.pdf',
      url: 'https://example.test/task.pdf',
      originalname: 'task.pdf',
      format: 'application/pdf',
      size: 42,
    }]);
  });
});
