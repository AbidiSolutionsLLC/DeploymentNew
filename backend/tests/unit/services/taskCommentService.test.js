const taskService = require('../../../services/taskService');
const Task = require('../../../models/taskSchema');
const mongoose = require('mongoose');
const { ForbiddenError, BadRequestError, NotFoundError } = require('../../../utils/ExpressError');

describe('Task Comments & Attachments Service', () => {
  const companyId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const user1 = { _id: new mongoose.Types.ObjectId(), name: 'Alice Smith', email: 'alice@example.com', role: 'Employee' };
  const user2 = { _id: new mongoose.Types.ObjectId(), name: 'Bob Jones', email: 'bob@example.com', role: 'Employee' };
  const adminUser = { _id: new mongoose.Types.ObjectId(), name: 'Admin User', email: 'admin@example.com', role: 'Admin' };

  let taskId;

  beforeEach(async () => {
    const task = await Task.create({
      title: 'Fix issue #101',
      description: 'Important task',
      company: companyId,
      project: projectId,
      createdBy: user1._id,
      comments: [],
    });
    taskId = task._id;
  });

  it('should add a text comment successfully', async () => {
    const comment = await taskService.addComment(user1, companyId, taskId, {
      text: 'Working on this task today.',
    });

    expect(comment).toBeDefined();
    expect(comment.text).toBe('Working on this task today.');
    expect(comment.attachments).toHaveLength(0);

    const task = await Task.findById(taskId);
    expect(task.comments).toHaveLength(1);
    expect(task.comments[0].text).toBe('Working on this task today.');
  });

  it('should add a comment with attachments', async () => {
    const mockFiles = [
      {
        originalname: 'spec.pdf',
        url: 'https://storage.azure.com/abidiPro/tasks/attachments/spec_123.pdf',
        blobName: 'abidiPro/tasks/attachments/spec_123.pdf',
        size: 2048,
        mimetype: 'application/pdf',
      },
    ];

    const comment = await taskService.addComment(
      user1,
      companyId,
      taskId,
      { text: 'Here is the attached document' },
      mockFiles
    );

    expect(comment).toBeDefined();
    expect(comment.attachments).toHaveLength(1);
    expect(comment.attachments[0].name).toBe('spec.pdf');
    expect(comment.attachments[0].blobName).toBe('abidiPro/tasks/attachments/spec_123.pdf');
  });

  it('should allow comment with attachment only and no text', async () => {
    const mockFiles = [
      {
        originalname: 'screenshot.png',
        url: 'https://storage.azure.com/abidiPro/tasks/attachments/screen_123.png',
        blobName: 'abidiPro/tasks/attachments/screen_123.png',
        size: 4096,
        mimetype: 'image/png',
      },
    ];

    const comment = await taskService.addComment(user1, companyId, taskId, { text: '' }, mockFiles);

    expect(comment).toBeDefined();
    expect(comment.attachments).toHaveLength(1);
    expect(comment.text).toBe('');
  });

  it('should reject comment if both text and attachments are empty', async () => {
    await expect(
      taskService.addComment(user1, companyId, taskId, { text: '   ' }, [])
    ).rejects.toThrow(BadRequestError);
  });

  it('should add a reply to an existing comment (WhatsApp style)', async () => {
    // Original comment
    const original = await taskService.addComment(user1, companyId, taskId, {
      text: 'Has the database schema been updated?',
    });

    // Bob replies to Alice's comment
    const reply = await taskService.addComment(user2, companyId, taskId, {
      text: 'Yes, it was merged an hour ago.',
      replyTo: {
        commentId: original._id,
        userName: user1.name,
        text: original.text,
      },
    });

    expect(reply.replyTo).toBeDefined();
    expect(reply.replyTo.commentId.toString()).toBe(original._id.toString());
    expect(reply.replyTo.userName).toBe('Alice Smith');
    expect(reply.replyTo.text).toBe('Has the database schema been updated?');
  });

  it('should allow comment author to delete their comment', async () => {
    const comment = await taskService.addComment(user1, companyId, taskId, {
      text: 'A typo here',
    });

    const result = await taskService.deleteComment(user1, companyId, taskId, comment._id);
    expect(result.commentId.toString()).toBe(comment._id.toString());

    const task = await Task.findById(taskId);
    expect(task.comments).toHaveLength(0);
  });

  it('should block non-author non-admin from deleting another user comment', async () => {
    const comment = await taskService.addComment(user1, companyId, taskId, {
      text: 'Alice message',
    });

    await expect(
      taskService.deleteComment(user2, companyId, taskId, comment._id)
    ).rejects.toThrow(ForbiddenError);
  });

  it('should allow admin to delete any comment', async () => {
    const comment = await taskService.addComment(user1, companyId, taskId, {
      text: 'Flagged message',
    });

    const result = await taskService.deleteComment(adminUser, companyId, taskId, comment._id);
    expect(result.commentId.toString()).toBe(comment._id.toString());

    const task = await Task.findById(taskId);
    expect(task.comments).toHaveLength(0);
  });
});
