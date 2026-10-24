"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";

// Map of the office: OpenStreetMap through the Leaflet library (free, no key), the tiles
// softly tinted to the cream colours of the site, the brand cone as the marker.
// The library is loaded only in the browser and only where the map is (Contacts, admin).
// The mouse wheel zooms only after a click on the map, so scrolling the page is not caught.
// The address stands next to the cone all the time (label), so it is seen even when the map is
// zoomed in close. onPick (admin panel): a click on the map (or dragging the marker) moves the
// point; a new lat/lng from outside (an address found by the search) moves it and zooms in.

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  /** Text for the marker (the name and address of the office) */
  label?: string;
  onPick?: (lat: number, lng: number) => void;
  className?: string;
};

const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

export function SiteMap({ lat, lng, zoom = 16, label = "", onPick, className = "" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const marker = useRef<import("leaflet").Marker | null>(null);
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);

  // The map is made once; the point is moved below
  useEffect(() => {
    let gone = false;
    import("leaflet").then((L) => {
      if (gone || !box.current || map.current) return;
      const created = L.map(box.current, {
        center: [lat, lng],
        zoom,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      created.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: ATTRIBUTION }).addTo(created);
      const icon = L.divIcon({
        className: "",
        html: '<span class="site-map-pin"><img src="/images/logo.webp" alt="" /></span>',
        iconSize: [28, 58],
        // The tip of the cone is the point
        iconAnchor: [14, 57],
      });
      const point = L.marker([lat, lng], { icon, draggable: Boolean(pick.current), keyboard: false, title: label }).addTo(created);
      point.bindTooltip(label, { permanent: true, direction: "right", offset: [12, -30], className: "site-map-label" });
      if (!label) point.closeTooltip();
      point.on("dragend", () => {
        const at = point.getLatLng();
        pick.current?.(at.lat, at.lng);
      });
      created.on("click", (event) => {
        // The wheel zooms after the first click; leaving the map turns it off again
        created.scrollWheelZoom.enable();
        if (pick.current) {
          point.setLatLng(event.latlng);
          pick.current(event.latlng.lat, event.latlng.lng);
        }
      });
      created.on("mouseout", () => created.scrollWheelZoom.disable());
      map.current = created;
      marker.current = point;
    });
    return () => {
      gone = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- made once; the point is followed below
  }, []);

  // A new point from outside (an address found, typed coordinates): the marker and the view follow
  useEffect(() => {
    const point = marker.current;
    if (!point || !map.current) return;
    const at = point.getLatLng();
    if (Math.abs(at.lat - lat) > 1e-7 || Math.abs(at.lng - lng) > 1e-7) {
      point.setLatLng([lat, lng]);
      map.current.setView([lat, lng], Math.max(map.current.getZoom(), zoom));
    }
  }, [lat, lng, zoom]);

  // The address next to the cone follows the text (the admin types it)
  useEffect(() => {
    const point = marker.current;
    if (!point) return;
    point.setTooltipContent(label);
    if (label) point.openTooltip();
    else point.closeTooltip();
  }, [label]);

  return (
    // isolate: the layers of the map stay under the menus and windows of the site
    <div
      ref={box}
      className={`site-map relative isolate overflow-hidden bg-[#efe4d2] ${onPick ? "cursor-crosshair" : ""} ${className}`}
    />
  );
}
