import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    {
      message: "Orders are placed from the checkout page.",
      code: "ENDPOINT_RETIRED",
    },
    { status: 410 },
  );
}
