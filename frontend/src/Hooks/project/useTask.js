import { useState, useEffect } from 'react';

export const useTasks = (projectId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hardcoded data - replace with actual API call
  const mockTasks = [
    {
      id: 1,
      title: "Design System Setup",
      description: "Create a comprehensive design system with components, colors, and typography guidelines",
      status: "done",
      priority: "high",
      assignee: {
        id: 2,
        name: "Sarah Wilson",
        avatar: "/sarah-wilson-portrait.png"
      },
      dueDate: "2024-02-10",
      commentsCount: 5,
      createdAt: "2024-01-20"
    },
    {
      id: 2,
      title: "User Authentication Flow",
      description: "Implement secure user authentication with login, register, and password reset functionality",
      status: "in-progress",
      priority: "high",
      assignee: {
        id: 4,
        name: "Emily Chen",
        avatar: "/emily-chen-portrait.png"
      },
      dueDate: "2024-02-20",
      commentsCount: 3,
      createdAt: "2024-01-25"
    },
    {
      id: 3,
      title: "Product Catalog Page",
      description: "Build responsive product catalog with filtering, sorting, and search capabilities",
      status: "under-review",
      priority: "medium",
      assignee: {
        id: 3,
        name: "Mike Johnson",
        avatar: "/mike-johnson-speaker.png"
      },
      dueDate: "2024-02-25",
      commentsCount: 2,
      createdAt: "2024-02-01"
    },
    {
      id: 4,
      title: "Shopping Cart Integration",
      description: "Integrate shopping cart functionality with add, remove, and quantity update features",
      status: "todo",
      priority: "medium",
      assignee: {
        id: 3,
        name: "Mike Johnson",
        avatar: "/mike-johnson-speaker.png"
      },
      dueDate: "2024-03-05",
      commentsCount: 1,
      createdAt: "2024-02-05"
    },
    {
      id: 5,
      title: "Payment Gateway Setup",
      description: "Configure secure payment processing with multiple payment methods",
      status: "backlog",
      priority: "high",
      assignee: {
        id: 4,
        name: "Emily Chen",
        avatar: "/emily-chen-portrait.png"
      },
      dueDate: "2024-03-10",
      commentsCount: 0,
      createdAt: "2024-02-08"
    },
    {
      id: 6,
      title: "Mobile Responsive Testing",
      description: "Test and optimize the platform for various mobile devices and screen sizes",
      status: "backlog",
      priority: "low",
      assignee: {
        id: 2,
        name: "Sarah Wilson",
        avatar: "/sarah-wilson-portrait.png"
      },
      dueDate: "2024-03-15",
      commentsCount: 0,
      createdAt: "2024-02-10"
    }
  ];

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Replace this with actual API call:
        // const response = await fetch(`/api/projects/${projectId}/tasks`);
        // const data = await response.json();
        
        setTasks(mockTasks);
        setError(null);
      } catch (err) {
        setError(err.message);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      // Replace with actual API call:
      // await fetch(`/api/tasks/${taskId}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ status: newStatus })
      // });

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === parseInt(taskId) ? { ...task, status: newStatus } : task
        )
      );
      return { success: true };
    } catch (err) {
      throw new Error('Failed to update task status');
    }
  };

  const createTask = async (taskData) => {
    try {
      // Replace with actual API call:
      // const response = await fetch(`/api/projects/${projectId}/tasks`, {
      //   method: 'POST',
      //   body: JSON.stringify(taskData)
      // });

      const newTask = {
        id: Date.now(),
        ...taskData,
        status: 'backlog',
        commentsCount: 0,
        createdAt: new Date().toISOString()
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      return { success: true, data: newTask };
    } catch (err) {
      throw new Error('Failed to create task');
    }
  };

  return {
    tasks,
    loading,
    error,
    updateTaskStatus,
    createTask,
    refetch: () => fetchTasks()
  };
};
