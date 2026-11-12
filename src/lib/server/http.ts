import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "./orders";
import { SupabaseStorageError } from "./storage";
import { AuthProblem } from "./problems";

const buckets = new Map<string, { start: number; count: number }>();
export function guard(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    const hosts = [
      request.headers.get("host"),
      request.headers.get("x-forwarded-host"),
    ];
    let allowed = false;
    try {
      allowed = hosts.includes(new URL(origin).host);
    } catch {}
    if (!allowed) {
      throw new ApiError(
        "Open the application and API from the same Next.js server.",
        403,
        null,
        "ORIGIN_MISMATCH",
      );
    }
  }
  // Development guard only, not a distributed production rate limiter.
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "local";
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now - bucket.start > 60000) bucket = { start: now, count: 0 };
  bucket.count++;
  buckets.set(ip, bucket);
  if (bucket.count > 180) {
    throw new ApiError(
      "Too many demo requests. Wait a minute and retry.",
      429,
      null,
      "RATE_LIMIT",
    );
  }
  if (buckets.size > 1000) {
    for (const [key, value] of buckets)
      if (now - value.start > 60000) buckets.delete(key);
  }
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new ApiError("Use application/json.", 415);
  }
  if (Number(request.headers.get("content-length") || 0) > 16384)
    throw new ApiError("The request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("An order payload is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new ApiError("The request is too large.", 413);
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new ApiError("Invalid JSON.");
  }
  return { raw, body };
}
export function reply(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
function storageHint(code: string): string {
  switch (code) {
    case "42501":
      return "The database reported an access/permission error. Keep RLS enabled; the key permissions or table configuration need checking.";
    case "PGRST125":
    case "READ_NOT_CONFIRMED":
    case "COUNT_NOT_CONFIRMED":
      return "Check SUPABASE_URL: use the project base URL only, without /rest/v1, a table path or query parameters. The database probe could not confirm a proper response.";
    case "42P01":
    case "42703":
    case "PGRST204":
    case "PGRST205":
      return "The database could not find an expected table or column. Apply the supplied migrations, including the v0.4 customer-order ownership migration, without deleting existing data.";
    case "22P02":
    case "23502":
    case "23503":
    case "23514":
      return "The database rejected a value or constraint. We need to compare the table's column types and constraints with the supplied SQL.";
    case "PGRST116":
    case "UNEXPECTED_ROW":
      return "The lookup returned an unexpected row shape or count. Check the table structure and uniqueness constraint.";
    case "HTTP_401":
    case "PGRST301":
    case "PGRST303":
      return "The project rejected authentication. Check the server-side key locally; do not share its value.";
    case "PUBLIC_KEY_NOT_ALLOWED":
      return "Use a server-only secret key here, not a publishable/browser key. Do not disable RLS.";
    case "CONFIG_MISSING":
    case "INVALID_PROJECT_URL":
    case "CLIENT_INIT_FAILED":
      return "Check the project BASE URL and server-only key in .env.local, then restart Next.js. The URL must have no /rest/v1, table path or query. Do not paste credentials into chat.";
    case "INVALID_STORAGE_MODE":
      return "ORDER_STORAGE must be local or supabase.";
    case "LOCAL_NOT_DURABLE":
      return "Configure Supabase before deploying this project on Vercel.";
    case "NETWORK_UNCONFIRMED":
      return "The database response could not be confirmed. Check the connection before retrying.";
    default:
      return "Report the diagnostic code so the failed database operation can be investigated.";
  }
}
export function apiError(error: unknown) {
  if (error instanceof AuthProblem)
    return reply({ error: error.message, code: error.code }, error.status);
  if (error instanceof ApiError) {
    return reply(
      {
        error: error.message,
        field: error.field,
        code: error.code,
        ...(error.quote ? { quote: error.quote } : {}),
      },
      error.status,
    );
  }
  if (error instanceof SupabaseStorageError) {
    const diagnostic = {
      source: "supabase",
      operation: error.operation,
      code: error.storageCode,
      httpStatus: error.providerStatus || null,
    };
    // Code and fixed operation names only. Do NOT log raw provider errors/details.
    console.error("JIE_Bulk_order storage diagnostic:", diagnostic);
    return reply(
      {
        error: `Supabase did not confirm ${error.operation} [${error.operation}/${error.storageCode}]. ${storageHint(error.storageCode)} Keep the pending request and retry the SAME save after the issue is addressed.`,
        code: "STORAGE_UNAVAILABLE",
        diagnostic,
      },
      503,
    );
  }
  const name =
    error instanceof TypeError
      ? "TypeError"
      : error instanceof SyntaxError
        ? "SyntaxError"
        : error instanceof RangeError
          ? "RangeError"
          : "Error";
  console.error("JIE_Bulk_order storage diagnostic:", {
    operation: "unclassified",
    code: name,
  });
  return reply(
    {
      error: `Order storage did not confirm the request [unclassified/${name}]. Keep the pending request; report this code before starting another order.`,
      code: "STORAGE_UNAVAILABLE",
      diagnostic: { operation: "unclassified", code: name },
    },
    503,
  );
}
