// taskApi.js
import api from '../axios';

const API_URL = '/tasks';

const getMyTasks = async () => {
  const response = await api.get(`${API_URL}/user`);
  return response.data?.data || response.data;
};

const getTaskById = async (taskId) => {
  const response = await api.get(`${API_URL}/${taskId}`);
  return response.data?.data || response.data;
};

const getProjectTasks = async (projectId) => {
  const response = await api.get(`${API_URL}/project/${projectId}`);
  return response.data?.data || response.data;
};

const createTask = async (taskData) => {
  if (taskData instanceof FormData) {
    const response = await api.post(API_URL, taskData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data || response.data;
  }

  // Normalize in case data was passed as { projectId, taskData }
  let data = taskData;
  if (taskData && taskData.taskData && typeof taskData.taskData === 'object') {
    data = {
      ...taskData.taskData,
      project: taskData.projectId || taskData.project || taskData.taskData.project,
    };
  }

  const fileList = data?.files || data?.attachments;
  const hasFiles = Array.isArray(fileList) && fileList.some((f) => f instanceof File || f instanceof Blob);

  if (hasFiles) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'files' || key === 'attachments') return;
      const val = data[key];
      if (val === undefined || val === null) return;
      if (Array.isArray(val)) {
        val.forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, val);
      }
    });

    fileList.forEach((file) => {
      if (file instanceof File || file instanceof Blob) {
        formData.append('attachments', file);
      }
    });

    const response = await api.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data || response.data;
  }

  const response = await api.post(API_URL, data);
  return response.data?.data || response.data;
};

const updateTask = async (id, updates) => {
  if (updates instanceof FormData) {
    const response = await api.put(`${API_URL}/${id}`, updates, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data || response.data;
  }

  const fileList = updates?.files || updates?.attachments;
  const hasFiles = Array.isArray(fileList) && fileList.some((f) => f instanceof File || f instanceof Blob);

  if (hasFiles) {
    const formData = new FormData();
    Object.keys(updates).forEach((key) => {
      if (key === 'files' || key === 'attachments') return;
      const val = updates[key];
      if (val === undefined || val === null) return;
      if (Array.isArray(val)) {
        if (key === 'deletedAttachmentIds' || key === 'renamedAttachments') {
          formData.append(key, JSON.stringify(val));
        } else {
          val.forEach((item) => formData.append(key, item));
        }
      } else {
        formData.append(key, val);
      }
    });

    fileList.forEach((file) => {
      if (file instanceof File || file instanceof Blob) {
        formData.append('attachments', file);
      }
    });

    const response = await api.put(`${API_URL}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data || response.data;
  }

  const response = await api.put(`${API_URL}/${id}`, updates);
  return response.data?.data || response.data;
};

const updateTaskStatus = async (id, status) => {
  const response = await api.patch(`${API_URL}/${id}/status`, { status });
  return response.data?.data || response.data;
};

const deleteTask = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data?.data || response.data;
};

const uploadTaskAttachments = async (taskId, files = []) => {
  const formData = new FormData();
  const fileList = Array.isArray(files) ? files : [files];
  fileList.forEach((file) => {
    formData.append('attachments', file);
  });

  const response = await api.post(`${API_URL}/${taskId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data || response.data;
};

const deleteTaskAttachment = async (taskId, attachmentId) => {
  const response = await api.delete(`${API_URL}/${taskId}/attachments/${attachmentId}`);
  return response.data?.data || response.data;
};

const renameTaskAttachment = async (taskId, attachmentId, name) => {
  const response = await api.patch(`${API_URL}/${taskId}/attachments/${attachmentId}`, { name });
  return response.data?.data || response.data;
};

const getTaskComments = async (taskId) => {
  const response = await api.get(`${API_URL}/${taskId}/comments`);
  return response.data?.data || response.data;
};

const addTaskComment = async (taskId, commentData, files = []) => {
  if (commentData instanceof FormData) {
    const response = await api.post(`${API_URL}/${taskId}/comments`, commentData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data || response.data;
  }

  const fileList = files?.length ? files : (commentData?.files || []);
  const hasFiles = fileList && fileList.length > 0;

  if (hasFiles) {
    const formData = new FormData();
    const content = typeof commentData === 'string' ? commentData : (commentData?.content || commentData?.text || '');
    formData.append('content', content);

    const replyTo = commentData?.replyTo;
    if (replyTo) {
      formData.append('replyTo', JSON.stringify(replyTo));
    }

    fileList.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await api.post(`${API_URL}/${taskId}/comments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data || response.data;
  }

  const payload = typeof commentData === 'string'
    ? { content: commentData }
    : {
        content: commentData?.content || commentData?.text || '',
        replyTo: commentData?.replyTo,
      };

  const response = await api.post(`${API_URL}/${taskId}/comments`, payload);
  return response.data?.data || response.data;
};

const deleteTaskComment = async (taskId, commentId) => {
  const response = await api.delete(`${API_URL}/${taskId}/comments/${commentId}`);
  return response.data?.data || response.data;
};

const getProjectActivities = async (projectId) => {
  const response = await api.get(`/activities/project/${projectId}`);
  return response.data?.data || response.data;
};

const taskApi = {
  getMyTasks,
  getTaskById,
  getProjectTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  uploadTaskAttachments,
  deleteTaskAttachment,
  renameTaskAttachment,
  getTaskComments,
  addTaskComment,
  deleteTaskComment,
  getProjectActivities,
};

export default taskApi;
