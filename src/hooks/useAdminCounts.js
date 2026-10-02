import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

// Live numbers for the admin sidebar and overview (unread messages, pending payments...).
export default function useAdminCounts(enabled = true) {
  const [counts, setCounts] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("checking");

  const refresh = useCallback(async () => {
    try {
      setCounts(await api("/api/admin/counts"));
      setConnectionStatus("online");
    } catch {
      setConnectionStatus("offline");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("wrja:admin-changed", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("wrja:admin-changed", refresh);
    };
  }, [enabled, refresh]);

  return { counts, refresh, connectionStatus };
}
