// src/hooks/useProjects.js
import { useState, useEffect, useCallback } from "react";
import api from "../api/projectApi";

/**
 * useProjects
 * - autoFetch: boolean (default true) — whether to fetch immediately on mount
 * Returns: { projects, loading, error, refetch }
 */
export default function useProjects({ autoFetch = true } = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProjects();
      // projectApi returns { data: [...] } (axios-like shape in our mock)
      setProjects(res.data);
      return res.data;
    } catch (err) {
      // Normalize error message
      const message =
        err?.message ||
        (err?.response && err.response.data) ||
        "Failed to fetch projects";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!autoFetch) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getProjects();
        if (!mounted) return;
        setProjects(res.data);
      } catch (err) {
        if (!mounted) return;
        const message =
          err?.message ||
          (err?.response && err.response.data) ||
          "Failed to fetch projects";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [autoFetch]);

  return { projects, loading, error, refetch: fetchProjects };
}
