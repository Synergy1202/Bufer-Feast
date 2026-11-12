import type { Quote } from "./types";
export class RequestError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code = "NETWORK",
    public field?: string,
    public quote?: Quote,
  ) {
    super(message);
  }
}
export async function requestJson<T>(
  route: string,
  options: {
    method?: string;
    bodyJSON?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 20000);
  const cancel = () => controller.abort();
  options.signal?.addEventListener("abort", cancel, { once: true });
  try {
    const response = await fetch(route, {
      method: options.method || "GET",
      headers: {
        ...(options.bodyJSON ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      body: options.bodyJSON,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new RequestError(
        "Open the app using npm run dev, not Live Server. The Next.js API is not responding here.",
      );
    const data = await response.json();
    if (!response.ok)
      throw new RequestError(
        data.error || "The request was not confirmed.",
        response.status,
        data.code,
        data.field,
        data.quote,
      );
    return data as T;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    if (error instanceof Error && error.name === "AbortError")
      throw new RequestError(
        "The request was interrupted or timed out. If saving, retry the same request to avoid duplicates.",
      );
    throw new RequestError(
      "Cannot reach the Next.js server. Check that it is running. If saving, retry the same request.",
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", cancel);
  }
}
export const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
