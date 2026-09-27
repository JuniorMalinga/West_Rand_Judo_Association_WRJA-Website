import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

const locations = [
  {
    name: "Golden Score Judo Dojo",
    address: "26 Covent Road, Greenhills, Randfontein",
    coordinates: [27.7021, -26.1866],
  },
  {
    name: "KJK Judo",
    address: "NGK Paardekraal, Krugersdorp",
    coordinates: [27.7738, -26.0925],
  },
  {
    name: "West Rand Judo Association (NPC office)",
    address: "3 Octavia, 49 Otto Street, Krugersdorp North",
    coordinates: [27.7667, -26.0833],
  },
];

function isLikelyValidToken(token) {
  return (
    typeof token === "string" &&
    /^pk\.[A-Za-z0-9._-]{20,}$/.test(token.trim())
  );
}

export default function ContactMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const didInitializeRef = useRef(false);
  const [mapError, setMapError] = useState(null);

  // Map starts inert (no scroll/drag capture) so it never hijacks page
  // scroll — the person has to click it once to switch it on.
  const [isActive, setIsActive] = useState(false);

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const tokenLooksValid = isLikelyValidToken(token);

  useEffect(() => {
    if (
      !tokenLooksValid ||
      !mapContainerRef.current ||
      !window.mapboxgl ||
      didInitializeRef.current
    ) {
      return;
    }

    didInitializeRef.current = true;

    const mapboxgl = window.mapboxgl;
    mapboxgl.accessToken = token.trim();

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: locations[0].coordinates,
      zoom: 9.5,
    });

    map.on("error", (event) => {
      console.error("Mapbox error:", event?.error || event);
      setMapError(
        "The map failed to load — check that your Mapbox token is valid."
      );
    });

    map.on("load", () => {
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      const bounds = new mapboxgl.LngLatBounds();

      // FIX: Replaced the original locations.forEach block.
      // Each marker now has Google Maps and Waze navigation links.
      locations.forEach((location) => {
        const [lng, lat] = location.coordinates;

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

        const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
          <strong>${location.name}</strong><br />
          ${location.address}
          <div class="map-popup-links">
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>
            <a href="${wazeUrl}" target="_blank" rel="noopener noreferrer">Waze</a>
          </div>
        `);

        new mapboxgl.Marker({ color: "#c9a227" })
          .setLngLat(location.coordinates)
          .setPopup(popup)
          .addTo(map);

        bounds.extend(location.coordinates);
      });

      map.fitBounds(bounds, { padding: 80, maxZoom: 12 });
    });

    mapRef.current = map;
  }, [token, tokenLooksValid]);

  const handleActivate = () => {
    setIsActive(true);
    mapRef.current?.resize();
  };

  return (
    <Reveal className="contact-map">
      {tokenLooksValid && !mapError ? (
        <div className="contact-map-wrapper">
          <div
            ref={mapContainerRef}
            className={`contact-map-canvas ${
              isActive ? "contact-map-canvas-active" : ""
            }`}
          />

          {!isActive && (
            <button
              type="button"
              className="contact-map-activate"
              onClick={handleActivate}
              aria-label="Click to interact with the map"
            >
              <span className="contact-map-activate-icon">&#128205;</span>
              <span>Click to interact with the map</span>
            </button>
          )}
        </div>
      ) : (
        <div className="contact-map-placeholder">
          <p>
            {mapError ? (
              mapError
            ) : (
              <>
                Map not shown — add a real Mapbox public token as
                <code> VITE_MAPBOX_TOKEN</code> in <code>.env.local</code> to
                enable the live map. Get a free token at{" "}
                <a
                  href="https://account.mapbox.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  account.mapbox.com
                </a>
                . It should start with <code>pk.</code> and be a long string —
                not a placeholder.
              </>
            )}
          </p>
        </div>
      )}
    </Reveal>
  );
}