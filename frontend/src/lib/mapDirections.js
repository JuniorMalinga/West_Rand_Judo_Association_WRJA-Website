export function getMapDirectionsLinks([longitude, latitude]) {
  const destination = `${latitude},${longitude}`;
  const links = [
    ["Apple Maps", `https://maps.apple.com/?daddr=${destination}`],
    ["Google Maps", `https://www.google.com/maps/dir/?api=1&destination=${destination}`],
    ["Waze", `https://waze.com/ul?ll=${destination}&navigate=yes`],
  ];

  return `<div class="map-popup-links">${links.map(([label, url]) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
  ).join("")}</div>`;
}