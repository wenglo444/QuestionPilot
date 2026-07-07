import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "./api";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiData<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { onSuccess, onError, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "An unexpected error occurred";
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [fetcher, onSuccess, onError]);

  useEffect(() => {
    if (enabled) fetch();
  }, [enabled, fetch]);

  const refetch = useCallback(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch };
}

// Convenience hooks for common API endpoints
export function useDashboardStats() {
  return useApiData(() => api.get<{
    activeProjects: number;
    totalQuestionnaires: number;
    timeSaved: number;
    avgConfidence: number;
    documentsIndexed: number;
    documentsProcessing: number;
  }>("/api/dashboard/stats"));
}

export function useProjects() {
  return useApiData(() => api.get<Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    questionnaireCount: number;
    documentCount: number;
    lastActivity: string;
  }>>("/api/projects"));
}

export function useProject(id: string) {
  return useApiData(() => api.get<Record<string, unknown>>(`/api/projects/${id}`), {
    enabled: !!id,
  });
}

export function useQuestionnaires(projectId?: string) {
  const endpoint = projectId
    ? `/api/projects/${projectId}/questionnaires`
    : "/api/questionnaires";
  return useApiData(() => api.get<Array<Record<string, unknown>>>(endpoint));
}

export function useDocuments(projectId?: string) {
  const endpoint = projectId
    ? `/api/projects/${projectId}/documents`
    : "/api/documents";
  return useApiData(() => api.get<Array<Record<string, unknown>>>(endpoint));
}
