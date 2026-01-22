import { useState, useEffect } from 'react';

export const useProject = (projectId) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hardcoded data - replace with actual API call
  const mockProject = {
    id: projectId,
    name: "E-Commerce Platform Redesign",
    description: "Complete redesign of the e-commerce platform with modern UI/UX, improved performance, and mobile-first approach. This project includes user research, wireframing, prototyping, and full development implementation.",
    status: "active",
    priority: "high",
    dueDate: "2024-03-15",
    createdAt: "2024-01-15",
    teamMembers: [
      {
        id: 1,
        name: "John Doe",
        role: "Project Manager",
        avatar: "/generic-person.png"
      },
      {
        id: 2,
        name: "Sarah Wilson",
        role: "UI/UX Designer",
        avatar: "/sarah-wilson-portrait.png"
      },
      {
        id: 3,
        name: "Mike Johnson",
        role: "Frontend Developer",
        avatar: "/mike-johnson-speaker.png"
      },
      {
        id: 4,
        name: "Emily Chen",
        role: "Backend Developer",
        avatar: "/emily-chen-portrait.png"
      }
    ],
    progress: 65
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Replace this with actual API call:
        // const response = await fetch(`/api/projects/${projectId}`);
        // const data = await response.json();
        
        setProject(mockProject);
        setError(null);
      } catch (err) {
        setError(err.message);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  return { project, loading, error, refetch: () => fetchProject() };
};
