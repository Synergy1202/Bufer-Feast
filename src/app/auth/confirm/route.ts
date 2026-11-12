import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url),
    hash = url.searchParams.get("token_hash"),
    type = url.searchParams.get("type");
  if (!hash || !/^[-A-Za-z0-9_]{20,256}$/.test(hash) || type !== "email")
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/login?error=confirmation" },
    });
  // Do not consume a one-time email link on GET: email scanners may visit it.
  // Store it briefly in an HttpOnly cookie, remove it from the visible URL, and
  // require an explicit same-origin POST from the confirmation page.
  const jar = await cookies();
  const host = (request.headers.get("host") || "").split(":")[0];
  jar.set(
    "jie_bulk_order-pending-confirmation",
    Buffer.from(JSON.stringify({ hash, type })).toString("base64url"),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production" &&
        !["localhost", "127.0.0.1"].includes(host),
      maxAge: 600,
    },
  );
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: "/confirm-email",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
