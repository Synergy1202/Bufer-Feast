"use client";
import { RequestError, errorText, requestJson } from "./api-client";
import { finishOrder, savePending, setSubmission } from "./client-store";
import type { PendingOrder, TestOrder } from "./types";
let inFlight: Promise<TestOrder> | null = null;
export function sendPending(pending: PendingOrder): Promise<TestOrder> {
  if (inFlight) return inFlight;
  setSubmission(true);
  inFlight = requestJson<{ order: TestOrder }>("/api/orders", {
    method: "POST",
    bodyJSON: pending.bodyJSON,
    headers: {
      "Idempotency-Key": pending.requestKey,
      "X-Order-Access": pending.key,
    },
  })
    .then(({ order }) => {
      finishOrder(order, pending.key);
      return order;
    })
    .catch((error: unknown) => {
      if (
        error instanceof RequestError &&
        error.status >= 400 &&
        error.status < 500 &&
        ![
          "REQUEST_CONFLICT",
          "AUTH_REQUIRED",
          "SESSION_EXPIRED",
          "ACCOUNT_CHANGED",
        ].includes(error.code)
      )
        savePending(null);
      setSubmission(false, errorText(error));
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
