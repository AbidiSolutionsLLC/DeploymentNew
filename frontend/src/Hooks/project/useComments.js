import { useState, useEffect } from 'react';

export const useComments = (projectId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hardcoded data - replace with actual API call
  const mockComments = [
    {
      id: 1,
      user: {
        id: 1,
        name: "John Doe",
        avatar: "/generic-person.png"
      },
      content: "Great progress on this project! The new design system looks amazing and will really help with consistency across the platform.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      replies: []
    },
    {
      id: 2,
      user: {
        id: 2,
        name: "Sarah Wilson",
        avatar: "/sarah-wilson-portrait.png"
      },
      content: "I've updated the design mockups based on the user feedback. The new color scheme should improve accessibility. Please review when you have a chance.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      replies: []
    },
    {
      id: 3,
      user: {
        id: 3,
        name: "Mike Johnson",
        avatar: "/mike-johnson-speaker.png"
      },
      content: "The frontend implementation is going smoothly. I should have the product catalog page ready for review by tomorrow.",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      replies: []
    }
  ];

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Replace this with actual API call:
        // const response = await fetch(`/api/projects/${projectId}/comments`);
        // const data = await response.json();
        
        setComments(mockComments);
        setError(null);
      } catch (err) {
        setError(err.message);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchComments();
    }
  }, [projectId]);

  const addComment = async (content) => {
    try {
      // Replace with actual API call:
      // const response = await fetch(`/api/projects/${projectId}/comments`, {
      //   method: 'POST',
      //   body: JSON.stringify({ content })
      // });

      const newComment = {
        id: Date.now(),
        user: {
          id: 1,
          name: "Current User",
          avatar: "/current-user-display.png"
        },
        content,
        timestamp: new Date(),
        replies: []
      };

      setComments(prevComments => [newComment, ...prevComments]);
      return { success: true, data: newComment };
    } catch (err) {
      throw new Error('Failed to add comment');
    }
  };

  return {
    comments,
    loading,
    error,
    addComment,
    refetch: () => fetchComments()
  };
};
