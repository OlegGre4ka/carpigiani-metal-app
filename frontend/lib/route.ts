/** Address for "Get directions": Google Maps with the route to the office */
export function routeHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
