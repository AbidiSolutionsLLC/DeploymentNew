const taskService = require('../../../services/taskService');
const Task = require('../../../models/taskSchema');
const Project = require('../../../models/projectSchema');
const User = require('../../../models/userSchema');
const mongoose = require('mongoose');
const { ForbiddenError, NotFoundError } = require('../../../utils/ExpressError');

describe('Task Attachments Management Service', () => {
  const companyId = new mongoose.Types.ObjectId();
  const adminUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'Admin',
    projectRole: 'Project Administrator',
    hasProjectPortalAccess: true,
  };
  const assigneeUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Assignee User',
    email: 'assignee@example.com',
    role: 'Employee',
    projectRole: 'Team Member',
    hasProjectPortalAccess: true,
  };
  const otherUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Other User',
    email: 'other@example.com',
    role: 'Employee',
    projectRole: 'Team Member',
    hasProjectPortalAccess: true,
  };

  let projectId;
  let taskId;

  beforeEach(async () => {
    // Setup mock users in DB
    await User.create([
      { ...adminUser, company: companyId, password: 'password123' },
      { ...assigneeUser, company: companyId, password: 'password123' },
      { ...otherUser, company: companyId, password: 'password123' },
    ]);

    // Setup project in DB
    const project = await Project.create({
      title: 'Portal Redesign',
      company: companyId,
      owner: adminUser._id,
      team: [assigneeUser._id],
      department: new mongoose.Types.ObjectId(),
    });
    projectId = project._id;

    // Create a base task with initial attachments
    const mockFiles = [
      {
        originalname: 'initial_doc.pdf',
        url: 'https://storage.azure.com/abidiPro/tasks/attachments/init_123.pdf',
        blobName: 'abidiPro/tasks/attachments/init_123.pdf',
        size: 5000,
        mimetype: 'application/pdf',
      },
    ];

    const task = await taskService.createTask(
      adminUser,
      companyId,
      {
        title: 'Implement Task Attachments',
        project: projectId.toString(),
        team: [assigneeUser._id.toString()],
        status: 'Todo',
      },
      mockFiles
    );
    taskId = task._id;
  });

  it('should create a task with attachments and map fields properly', async () => {
    const task = await Task.findById(taskId);
    expect(task.attachments).toHaveLength(1);
    expect(task.attachments[0].originalname).toBe('initial_doc.pdf');
    expect(task.attachments[0].name).toBe('initial_doc.pdf');
    expect(task.attachments[0].blobName).toBe('abidiPro/tasks/attachments/init_123.pdf');
    expect(task.attachments[0].size).toBe(5000);
    expect(task.attachments[0].mimetype).toBe('application/pdf');
  });

  it('should keep comment attachments isolated from task attachments', async () => {
    // Add comment with its own attachments
    const commentFiles = [
      {
        originalname: 'comment_image.png',
        url: 'https://storage.azure.com/abidiPro/tasks/attachments/comment_img.png',
        blobName: 'abidiPro/tasks/attachments/comment_img.png',
        size: 1200,
        mimetype: 'image/png',
      },
    ];

    await taskService.addComment(
      assigneeUser,
      companyId,
      taskId,
      { text: 'Look at this comment image' },
      commentFiles
    );

    const task = await Task.findById(taskId);
    // Task-level attachments must STILL be only 1 (not mixed with comment attachments)
    expect(task.attachments).toHaveLength(1);
    expect(task.attachments[0].originalname).toBe('initial_doc.pdf');

    // Comment attachments must be inside the comment
    expect(task.comments).toHaveLength(1);
    expect(task.comments[0].attachments).toHaveLength(1);
    expect(task.comments[0].attachments[0].originalname).toBe('comment_image.png');
  });

  it('should allow adding more attachments to an existing task', async () => {
    const moreFiles = [
      {
        originalname: 'second_doc.docx',
        url: 'https://storage.azure.com/abidiPro/tasks/attachments/doc_456.docx',
        blobName: 'abidiPro/tasks/attachments/doc_456.docx',
        size: 8000,
        mimetype: 'application/msword',
      },
    ];

    const updatedTask = await taskService.addAttachments(
      assigneeUser,
      companyId,
      taskId,
      moreFiles
    );

    expect(updatedTask.attachments).toHaveLength(2);
    expect(updatedTask.attachments[1].originalname).toBe('second_doc.docx');
  });

  it('should allow deleting an attachment from a task', async () => {
    const task = await Task.findById(taskId);
    const attachmentId = task.attachments[0]._id;

    const updatedTask = await taskService.deleteAttachment(
      assigneeUser,
      companyId,
      taskId,
      attachmentId
    );

    expect(updatedTask.attachments).toHaveLength(0);
    const inDb = await Task.findById(taskId);
    expect(inDb.attachments).toHaveLength(0);
  });

  it('should allow renaming an attachment on a task', async () => {
    const task = await Task.findById(taskId);
    const attachmentId = task.attachments[0]._id;

    const updatedTask = await taskService.renameAttachment(
      assigneeUser,
      companyId,
      taskId,
      attachmentId,
      'renamed_specification.pdf'
    );

    expect(updatedTask.attachments[0].originalname).toBe('renamed_specification.pdf');
    expect(updatedTask.attachments[0].name).toBe('renamed_specification.pdf');

    const inDb = await Task.findById(taskId);
    expect(inDb.attachments[0].originalname).toBe('renamed_specification.pdf');
  });

  it('should handle deletion and renaming via updateTask payload', async () => {
    const task = await Task.findById(taskId);
    const attachmentId = task.attachments[0]._id;

    // Add another attachment first
    await taskService.addAttachments(adminUser, companyId, taskId, [
      {
        originalname: 'keep_me.pdf',
        url: 'https://storage.azure.com/abidiPro/tasks/attachments/keep.pdf',
        blobName: 'abidiPro/tasks/attachments/keep.pdf',
        size: 3000,
        mimetype: 'application/pdf',
      },
    ]);

    // Update task: delete first attachment, rename second attachment, and upload a third file
    const newFiles = [
      {
        originalname: 'third_file.zip',
        url: 'https://storage.azure.com/abidiPro/tasks/attachments/third.zip',
        blobName: 'abidiPro/tasks/attachments/third.zip',
        size: 15000,
        mimetype: 'application/zip',
      },
    ];

    const updated = await taskService.updateTask(
      adminUser,
      companyId,
      taskId,
      {
        deletedAttachmentIds: [attachmentId.toString()],
        renamedAttachments: [{ id: 'keep_me.pdf', name: 'renamed_keep.pdf' }],
      },
      newFiles
    );

    // Initial doc should be gone, keep_me renamed, third_file added
    expect(updated.attachments).toHaveLength(2);
    expect(updated.attachments.some((a) => a.originalname === 'initial_doc.pdf')).toBe(false);
    expect(updated.attachments.some((a) => a.originalname === 'renamed_keep.pdf')).toBe(true);
    expect(updated.attachments.some((a) => a.originalname === 'third_file.zip')).toBe(true);
  });

  it('should prevent an unrelated employee from modifying task attachments', async () => {
    await expect(
      taskService.deleteAttachment(
        otherUser,
        companyId,
        taskId,
        new mongoose.Types.ObjectId()
      )
    ).rejects.toThrow(ForbiddenError);

    await expect(
      taskService.addAttachments(
        otherUser,
        companyId,
        taskId,
        [{ originalname: 'hacker.exe', url: 'http://test', size: 100 }]
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it('should generate collision-free taskID when tasks were deleted or TSK-035 exists', async () => {
    // Simulate existing task with TSK-035
    await Task.create({
      taskID: 'TSK-035',
      title: 'Legacy task 35',
      company: companyId,
      project: projectId,
      createdBy: adminUser._id,
      team: [assigneeUser._id],
      status: 'Todo',
      priority: 'Low',
    });

    // Create a new task via taskService.createTask
    const newTask = await taskService.createTask(
      adminUser,
      companyId,
      {
        title: 'New collision-free task',
        project: projectId.toString(),
        team: [assigneeUser._id.toString()],
        status: 'Todo',
        priority: 'Medium',
      },
      []
    );

    expect(newTask).toBeDefined();
    expect(newTask.taskID).toBeDefined();
    // Must not collide with TSK-035 and should be TSK-036 or higher
    expect(newTask.taskID).not.toBe('TSK-035');
    const taskNum = parseInt(newTask.taskID.replace('TSK-', ''), 10);
    expect(taskNum).toBeGreaterThanOrEqual(36);
  });
});
