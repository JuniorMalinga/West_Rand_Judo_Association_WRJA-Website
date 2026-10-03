import { useEffect, useState } from "react";

const VERSION = "v3.1.0";
let loadPromise = null;

export function loadMapbox() {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `https://api.mapbox.com/mapbox-gl-js/${VERSION}/mapbox-gl.css`;
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = `https://api.mapbox.com/mapbox-gl-js/${VERSION}/mapbox-gl.js`;
    script.async = true;
    script.onload = () => resolve(window.mapboxgl);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Mapbox failed to load"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

// Returns true once Mapbox is ready. Starts loading when the browser is idle.
export function useMapboxReady() {
  const [ready, setReady] = useState(Boolean(window.mapboxgl));

  useEffect(() => {
    if (ready) return undefined;
    let cancelled = false;

    const start = () =>
      loadMapbox()
        .then(() => {
          if (!cancelled) setReady(true);
        })
        .catch(() => {});

    const handle =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(start, { timeout: 3000 })
        : window.setTimeout(start, 1500);

    return () => {
      cancelled = true;
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [ready]);

  return ready;
}
