import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const ADMIN_COUNTS_SYNC_INTERVAL = 1000;

// Live numbers for the admin sidebar and overview (unread messages, pending payments...).
export default function useAdminCounts(enabled = true) {
  const [counts, setCounts] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const inflight = useRef(null);

  const refresh = useCallback(async () => {
    if (inflight.current) return inflight.current;
    inflight.current = api("/api/admin/counts")
      .then((nextCounts) => {
        setCounts(nextCounts);
        setConnectionStatus("online");
      })
      .catch(() => {
        setConnectionStatus("offline");
      })
      .finally(() => {
        inflight.current = null;
      });
    return inflight.current;
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    const timer = window.setInterval(refreshIfVisible, ADMIN_COUNTS_SYNC_INTERVAL);
    window.addEventListener("wrja:admin-changed", refresh);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("wrja:admin-changed", refresh);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [enabled, refresh]);

  return { counts, refresh, connectionStatus };
}
