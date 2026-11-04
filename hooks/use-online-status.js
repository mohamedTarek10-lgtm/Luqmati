"use client";

import { useSyncExternalStore } from "react";

function subscribeToOnlineStatus(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineStatus() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribeToOnlineStatus, getOnlineStatus, () => true);
}

