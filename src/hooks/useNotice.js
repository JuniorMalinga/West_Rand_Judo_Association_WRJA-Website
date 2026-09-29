import { useCallback, useEffect, useRef, useState } from "react";

// Small success/error banner state for admin panels.
export default function useNotice(duration = 3500) {
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback((type, text) => {
    window.clearTimeout(timer.current);
    setNotice({ type, text });
    if (type !== "error") {
      timer.current = window.setTimeout(() => setNotice(null), duration);
    }
  }, [duration]);

  const clear = useCallback(() => setNotice(null), []);
  return { notice, show, clear };
}
