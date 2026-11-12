"use client";

import { useEffect, useRef, useState } from "react";

type AddressInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
};

type Coordinates = { latitude: string; longitude: string; placeId: string };
type GoogleApi = any;
let mapsScript: Promise<void> | null = null;

function loadMaps(key: string) {
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (!mapsScript) {
    mapsScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Maps could not load."));
      document.head.appendChild(script);
    }).catch((error) => { mapsScript = null; throw error; });
  }
  return mapsScript;
}

export function GoogleAddressInput({ value, onChange, name, placeholder = "Search for an address", className = "" }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<GoogleApi>(null);
  const markerInstance = useRef<GoogleApi>(null);
  const geocoder = useRef<GoogleApi>(null);
  const onChangeRef = useRef(onChange);
  const [address, setAddress] = useState(value ?? "");
  const [coordinates, setCoordinates] = useState<Coordinates>({ latitude: "", longitude: "", placeId: "" });
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { if (value !== undefined) setAddress(value); }, [value]);

  useEffect(() => {
    if (!key) { setMessage("Map is unavailable until the Google Maps key is configured. You may enter an address manually."); return; }
    let cancelled = false;
    let autocomplete: GoogleApi;
    let mapClick: GoogleApi;
    let markerDrag: GoogleApi;
    async function start() {
      await loadMaps(key!);
      if (cancelled || !inputRef.current || !mapRef.current) return;
      const g = (window as any).google;
      const initial = { lat: 6.5244, lng: 3.3792 };
      const map = new g.maps.Map(mapRef.current, { center: initial, zoom: 11, mapTypeControl: false, streetViewControl: false });
      const marker = new g.maps.Marker({ map, position: initial, draggable: true });
      const coder = new g.maps.Geocoder();
      mapInstance.current = map;
      markerInstance.current = marker;
      geocoder.current = coder;
      setReady(true);

      async function selectLocation(location: GoogleApi, explicitAddress?: string, explicitPlaceId?: string) {
        map.panTo(location);
        map.setZoom(16);
        marker.setPosition(location);
        const latitude = location.lat();
        const longitude = location.lng();
        let label = explicitAddress || "";
        let placeId = explicitPlaceId || "";
        if (!label) {
          try {
            const result = await coder.geocode({ location });
            if (cancelled) return;
            label = result.results?.[0]?.formatted_address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            placeId = result.results?.[0]?.place_id || "";
          } catch { label = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`; }
        }
        if (cancelled) return;
        setAddress(label);
        onChangeRef.current?.(label);
        setCoordinates({ latitude: String(latitude), longitude: String(longitude), placeId });
        setMessage("");
      }
      autocomplete = new g.maps.places.Autocomplete(inputRef.current, { fields: ["formatted_address", "geometry", "place_id"], componentRestrictions: { country: "ng" } });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) void selectLocation(place.geometry.location, place.formatted_address, place.place_id);
      });
      mapClick = map.addListener("click", (event: GoogleApi) => { if (event.latLng) void selectLocation(event.latLng); });
      markerDrag = marker.addListener("dragend", (event: GoogleApi) => { if (event.latLng) void selectLocation(event.latLng); });
    }
    start().catch(() => { if (!cancelled) setMessage("Google Maps could not load. Check the Maps API key and allowed domains."); });
    return () => { cancelled = true; autocomplete && (window as any).google?.maps?.event?.clearInstanceListeners(autocomplete); mapClick?.remove(); markerDrag?.remove(); };
  }, [key]);

  function detectLocation() {
    if (!navigator.geolocation) { setMessage("Location detection is not supported on this device."); return; }
    setMessage("Detecting your location…");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const g = (window as any).google;
      const position = new g.maps.LatLng(coords.latitude, coords.longitude);
      mapInstance.current?.panTo(position);
      mapInstance.current?.setZoom(16);
      markerInstance.current?.setPosition(position);
      let label = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
      let placeId = "";
      try {
        const result = await geocoder.current?.geocode({ location: position });
        label = result?.results?.[0]?.formatted_address || label;
        placeId = result?.results?.[0]?.place_id || "";
      } catch { /* Coordinates still usable without reverse geocoding. */ }
      setAddress(label);
      onChangeRef.current?.(label);
      setCoordinates({ latitude: String(coords.latitude), longitude: String(coords.longitude), placeId });
      setMessage("");
    }, () => setMessage("Location access was denied or unavailable. Search for an address or choose a pin instead."), { enableHighAccuracy: true, timeout: 12000 });
  }

  return <div className="space-y-3">
    <input ref={inputRef} name={name} required={!!name} value={address} onChange={(event) => {
      setAddress(event.target.value);
      onChangeRef.current?.(event.target.value);
      setCoordinates({ latitude: "", longitude: "", placeId: "" });
    }} placeholder={placeholder} className={className} autoComplete="street-address" />
    {name && <>
      <input type="hidden" name={`${name}_latitude`} value={coordinates.latitude} />
      <input type="hidden" name={`${name}_longitude`} value={coordinates.longitude} />
      <input type="hidden" name={`${name}_place_id`} value={coordinates.placeId} />
    </>}
    <div ref={mapRef} role="region" aria-label="Choose a delivery location on the map" className="h-64 w-full overflow-hidden rounded-xl bg-slate-200" style={{ display: key ? "block" : "none" }} />
    <div className="flex flex-wrap items-center gap-3">
      {ready && <button type="button" onClick={detectLocation} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Use my current location</button>}
      {ready && <span className="text-xs text-slate-500">Search, tap the map, or drag the pin to choose a location.</span>}
    </div>
    {message && <p role="status" className="text-xs text-orange-600">{message}</p>}
  </div>;
}
