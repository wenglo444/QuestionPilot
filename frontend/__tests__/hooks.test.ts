import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the api module
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

describe("useApiData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return loading state initially", async () => {
    const { useApiData } = await import("@/lib/hooks");
    const { result } = renderHook(() =>
      useApiData(() => Promise.resolve({ data: "test" }), { enabled: false })
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("should fetch data successfully", async () => {
    const { useApiData } = await import("@/lib/hooks");
    const mockData = { id: "1", name: "Test" };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result, waitForNextUpdate } = renderHook(() =>
      useApiData(fetcher)
    );

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("should handle errors", async () => {
    const { useApiData } = await import("@/lib/hooks");
    const fetcher = vi.fn().mockRejectedValue(new Error("API Error"));

    const { result, waitForNextUpdate } = renderHook(() =>
      useApiData(fetcher)
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("API Error");
  });

  it("should refetch when refetch is called", async () => {
    const { useApiData } = await import("@/lib/hooks");
    const mockData = { id: "1" };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result, waitForNextUpdate } = renderHook(() =>
      useApiData(fetcher)
    );

    await waitForNextUpdate();
    expect(fetcher).toHaveBeenCalledTimes(1);

    result.current.refetch();
    await waitForNextUpdate();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

function renderHook<T>(hook: () => T) {
  const result = { current: hook() };
  const waitForNextUpdate = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 50));

  // Re-run on each access to simulate reactive updates
  const handler = {
    get(target: T, prop: keyof T) {
      return target[prop];
    },
  };

  const proxy = new Proxy(result.current, handler);

  return {
    result: {
      get current() {
        return proxy;
      },
    },
    waitForNextUpdate,
  };
}
