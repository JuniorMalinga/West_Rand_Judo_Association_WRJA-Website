import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { useMapboxReady } from "../lib/loadMapbox";
import { getMapDirectionsLinks } from "../lib/mapDirections";
import { openPrivacySettings, usePrivacyPreferences } from "../lib/privacyPreferences";

// Same three real locations as the Contact page map, shown here as a
// quick overview so visitors don't have to leave the homepage to see
// roughly where the clubs are.
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
  return typeof token === "string" && /^pk\.[A-Za-z0-9._-]{20,}$/.test(token.trim());
}

export default function LocationSection() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const didInitializeRef = useRef(false);
  const [mapError, setMapError] = useState(null);
  // Same click-to-activate pattern as the Contact page map, so this
  // never hijacks scroll while someone's scrolling past it on Home.
  const [isActive, setIsActive] = useState(false);
  const { externalContent } = usePrivacyPreferences();

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const tokenLooksValid = isLikelyValidToken(token);
  const mapboxReady = useMapboxReady(externalContent);

  useEffect(() => {
    if (!externalContent || !tokenLooksValid || !mapContainerRef.current || !mapboxReady || didInitializeRef.current) {
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
      setMapError("The map failed to load — check that your Mapbox token is valid.");
    });

    map.on("load", () => {
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      const bounds = new mapboxgl.LngLatBounds();

      locations.forEach((location) => {
        const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(
          `<strong>${location.name}</strong><br />${location.address}${getMapDirectionsLinks(location.coordinates)}`
        );

        new mapboxgl.Marker({ color: "#c9a227" })
          .setLngLat(location.coordinates)
          .setPopup(popup)
          .addTo(map);

        bounds.extend(location.coordinates);
      });

      map.fitBounds(bounds, { padding: 80, maxZoom: 12 });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      didInitializeRef.current = false;
    };
  }, [externalContent, token, tokenLooksValid, mapboxReady]);

  const handleActivate = () => {
    setIsActive(true);
    mapRef.current?.resize();
  };

  const handleMapKeyDown = (event) => {
    if (!isActive && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <Reveal className="location">
      {!externalContent ? (
        <div className="location-map-placeholder">
          <p>The interactive map uses Mapbox, an optional external service.</p>
          <button type="button" className="policy-settings-button" onClick={openPrivacySettings}>
            Manage privacy preferences to enable the map
          </button>
          <p><a href="https://maps.google.com/?q=West+Rand+Judo+Association+Krugersdorp" target="_blank" rel="noopener noreferrer">Open directions in Google Maps</a></p>
        </div>
      ) : tokenLooksValid && !mapError ? (
        <div
          className={`location-map-wrapper ${isActive ? "" : "map-wrapper-static"}`}
          onClick={() => { if (!isActive) handleActivate(); }}
          onKeyDown={handleMapKeyDown}
          role={isActive ? undefined : "button"}
          tabIndex={isActive ? -1 : 0}
          aria-label={isActive ? undefined : "Enable map interactions. Press Enter or Space to pan and zoom."}
        >
          <div
            ref={mapContainerRef}
            className={`location-map-canvas ${isActive ? "location-map-canvas-active" : ""}`}
          />
        </div>
      ) : (
        <div className="location-map-placeholder">
          <p>
            {mapError ? (
              mapError
            ) : (
              <>
                Map not shown — add a real Mapbox public token as
                <code> VITE_MAPBOX_TOKEN</code> in <code>.env.local</code> to
                enable the live map.
              </>
            )}
          </p>
        </div>
      )}
    </Reveal>
  );
}