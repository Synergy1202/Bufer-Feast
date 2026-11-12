"use client";
import { useSyncExternalStore } from "react";
import { errorText, requestJson } from "./api-client";
import type { AccountUser, AuthStatus } from "./types";
type State = {
  loading: boolean;
  configured: boolean;
  user: AccountUser | null;
  error: string;
  reason: string;
};
const INITIAL: State = {
  loading: true,
  configured: false,
  user: null,
  error: "",
  reason: "",
};
let state = INITIAL,
  started = false,
  version = 0;
let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}
export async function refreshAuth() {
  const turn = ++version;
  state = { ...state, loading: true, error: "" };
  emit();
  try {
    const result = await requestJson<AuthStatus>("/api/auth/session");
    if (turn === version) {
      state = {
        loading: false,
        configured: result.configured,
        user: result.user,
        error: "",
        reason: result.reason || "",
      };
      emit();
    }
    return result;
  } catch (error) {
    if (turn === version) {
      state = {
        loading: false,
        configured: state.configured,
        user: null,
        error: errorText(error),
        reason: state.reason,
      };
      emit();
    }
    throw error;
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started && typeof window !== "undefined") {
    started = true;
    queueMicrotask(() => {
      refreshAuth().catch(() => {});
    });
    window.addEventListener("focus", () => {
      refreshAuth().catch(() => {});
    });
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("jie_bulk_order-account-changed");
      channel.onmessage = () => {
        refreshAuth().catch(() => {});
      };
    }
  }
  return () => listeners.delete(listener);
}
export function useAuth() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}
export async function authChanged() {
  const status = await refreshAuth();
  channel?.postMessage("changed");
  return status;
}
export async function logoutCustomer() {
  await requestJson("/api/auth/logout", { method: "POST", bodyJSON: "{}" });
  version++;
  state = { ...state, loading: false, user: null, error: "" };
  emit();
  channel?.postMessage("changed");
}
