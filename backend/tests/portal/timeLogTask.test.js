const TimeLog = require('../../models/timeLogsSchema');
const Task = require('../../models/taskSchema');
const Timesheet = require('../../models/timesheetSchema');
const timeLogService = require('../../services/timeLogService');
const timesheetService = require('../../services/timesheetService');

describe('TimeLog and Timesheet Task Integration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('createTimeLog links task, sets project and optionally marks task Done', async () => {
    const taskMock = {
      _id: 'task-123',
      project: 'project-456',
      status: 'In Progress',
      completionPercent: 50,
      save: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(Task, 'findOne').mockResolvedValue(taskMock);

    const savedLog = {
      _id: 'log-1',
      job: 'Dev work',
      hours: 4,
      task: 'task-123',
      project: 'project-456',
    };

    jest.spyOn(TimeLog.prototype, 'save').mockResolvedValue(savedLog);
    jest.spyOn(TimeLog, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ...savedLog,
        task: { _id: 'task-123', title: 'Feature Task', status: 'Done' },
        project: { _id: 'project-456', title: 'Portal Project' },
      }),
    });

    const result = await timeLogService.createTimeLog(
      { id: 'user-1', role: 'Employee' },
      'company-1',
      {
        job: 'Dev work',
        date: '2026-10-23',
        description: 'Completed my task and logged hours',
        hours: 4,
        taskId: 'task-123',
        markAsDone: true,
      }
    );

    expect(Task.findOne).toHaveBeenCalledWith({ _id: 'task-123', company: 'company-1' });
    expect(taskMock.status).toBe('Done');
    expect(taskMock.completionPercent).toBe(100);
    expect(taskMock.save).toHaveBeenCalled();
    expect(result.task).toBeDefined();
    expect(result.task.title).toBe('Feature Task');
  });

  test('updateTimeLog prevents updating if log is already added to a timesheet', async () => {
    const existingLog = {
      _id: 'log-1',
      isAddedToTimesheet: true,
      company: 'company-1',
    };
    jest.spyOn(TimeLog, 'findOne').mockResolvedValue(existingLog);

    await expect(
      timeLogService.updateTimeLog(
        { id: 'user-1', role: 'Employee' },
        'company-1',
        'log-1',
        { job: 'New Title', hours: 5 }
      )
    ).rejects.toMatchObject({
      message: 'Cannot update time log already added to a timesheet',
    });
  });

  test('deleteTimeLog prevents deleting if log is already added to a timesheet', async () => {
    const existingLog = {
      _id: 'log-1',
      isAddedToTimesheet: true,
      company: 'company-1',
    };
    jest.spyOn(TimeLog, 'findOne').mockResolvedValue(existingLog);

    await expect(
      timeLogService.deleteTimeLog(
        { id: 'user-1', role: 'Employee' },
        'company-1',
        'log-1'
      )
    ).rejects.toMatchObject({
      message: 'Cannot delete log already in timesheet',
    });
  });

  test('updateTimeLog allows changing or detaching task when not added to timesheet', async () => {
    const existingLog = {
      _id: 'log-1',
      isAddedToTimesheet: false,
      company: 'company-1',
      job: 'Old Title',
      hours: 2,
      task: 'old-task',
      project: 'old-project',
      save: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(TimeLog, 'findOne').mockResolvedValue(existingLog);
    jest.spyOn(TimeLog, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ...existingLog,
        task: null,
        project: null,
      }),
    });

    // Detach task by passing taskId: ""
    const result = await timeLogService.updateTimeLog(
      { id: 'user-1', role: 'Employee' },
      'company-1',
      'log-1',
      { taskId: "" }
    );

    expect(existingLog.task).toBeNull();
    expect(existingLog.project).toBeNull();
    expect(existingLog.save).toHaveBeenCalled();
  });
});
