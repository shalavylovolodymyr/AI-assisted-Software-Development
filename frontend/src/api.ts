import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePreferences } from "./components/preferences";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(localStorage.getItem("signal-session-user")
        ? { "X-Demo-User": localStorage.getItem("signal-session-user")! }
        : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.message || "The request could not be completed. Please try again.",
      response.status,
    );
  }
  return response.json();
}

export function useData<T>(path: string, refreshMs?: number) {
  const { preferences } = usePreferences();
  return useQuery<T, Error>({
    queryKey: ["signal", path],
    queryFn: () => api<T>(path),
    refetchInterval: preferences.liveUpdates ? refreshMs : false,
  });
}

export function useChange(onSuccess?: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      path,
      data,
      method = "POST",
    }: {
      path: string;
      data: unknown;
      method?: string;
    }) => api<unknown>(path, { method, body: JSON.stringify(data) }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["signal"] });
      onSuccess?.();
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409)
        await client.invalidateQueries({ queryKey: ["signal"] });
    },
  });
}
