"use client";


import {
  APILoadingStatus,
  APIProvider,
  Circle,
  Map as GoogleMap,
  type MapMouseEvent,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { LocateFixed, MapPin } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  readDeliveryLocation,
  saveDeliveryLocation,
} from "@/lib/delivery-location";

export type PickedLocation = {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
};

type AddressInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onLocationChange?: (location: PickedLocation | null) => void;
  name?: string;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  showMap?: boolean;
  tone?: "dark" | "light";
  rememberAsDeliveryLocation?: boolean;
  initialLocation?: PickedLocation | null;
};

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const LAGOS = { lat: 6.5244, lng: 3.3792 };
const SAME_SPOT = 0.00005;
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3},?\s*/i;

const TONES = {
  dark: {
    panel: "border-[#333333] bg-[#111111] text-white",
    active: "bg-[#222222]",
    muted: "text-[#a0a0a0]",
    note: "text-[#FF8A4C]",
    chip: "bg-[#111111]/90 text-white",
    label: "text-white",
  },
  light: {
    panel: "border-slate-200 bg-white text-slate-900",
    active: "bg-slate-100",
    muted: "text-slate-500",
    note: "text-orange-700",
    chip: "bg-white/95 text-slate-800",
    label: "text-slate-900",
  },
} as const;

type Suggestion = {
  kind: "place";
  id: string;
  main: string;
  secondary: string;
  prediction: google.maps.places.PlacePrediction;
};
type Option = Suggestion | { kind: "current"; id: "current" };

let mapsAuthFailed = false;
const authFailureListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  const w = window as Window & { gm_authFailure?: () => void };
  const previous = w.gm_authFailure;
  w.gm_authFailure = () => {
    mapsAuthFailed = true;
    for (const notify of authFailureListeners) notify();
    previous?.();
  };
}

function subscribeToAuthFailure(listener: () => void) {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

function useMapsAuthFailed() {
  return useSyncExternalStore(
    subscribeToAuthFailure,
    () => mapsAuthFailed,
    () => false,
  );
}

export function GoogleAddressInput(props: AddressInputProps) {
  if (!MAPS_KEY) return <ManualAddressInput {...props} />;
  return (
    <APIProvider apiKey={MAPS_KEY} region="NG" language="en">
      <AddressPicker {...props} />
    </APIProvider>
  );
}

function HiddenFields({
  name,
  address,
  location,
}: {
  name?: string;
  address: string;
  location: PickedLocation | null;
}) {
  if (!name) return null;
  return (
    <>
      <input type="hidden" name={name} value={address} />
      <input
        type="hidden"
        name={`${name}_latitude`}
        value={location ? String(location.latitude) : ""}
      />
      <input
        type="hidden"
        name={`${name}_longitude`}
        value={location ? String(location.longitude) : ""}
      />
      <input
        type="hidden"
        name={`${name}_place_id`}
        value={location?.placeId ?? ""}
      />
    </>
  );
}

function ManualAddressInput({
  value,
  onChange,
  name,
  id,
  ariaLabel,
  placeholder = "Search for an address",
  className = "",
  required,
  showMap = true,
  tone = "dark",
}: AddressInputProps) {
  const [address, setAddress] = useState(value ?? "");
  useEffect(() => {
    if (value !== undefined) setAddress(value);
  }, [value]);
  return (
    <div className={showMap ? "space-y-3" : "w-full"}>
      <input
        id={id}
        aria-label={ariaLabel}
        value={address}
        onChange={(event) => {
          setAddress(event.target.value);
          onChange?.(event.target.value);
        }}
        placeholder={placeholder}
        className={className}
        required={required ?? Boolean(name)}
        autoComplete="street-address"
      />
      <HiddenFields name={name} address={address} location={null} />
      {showMap && (
        <p role="status" className={`text-xs ${TONES[tone].note}`}>
          The map is unavailable until a Google Maps key is configured. You
          can type the address instead.
        </p>
      )}
    </div>
  );
}

function AddressPicker({
  value,
  onChange,
  onLocationChange,
  name,
  id,
  ariaLabel,
  placeholder = "Search for an address",
  className = "",
  required,
  showMap = true,
  tone = "dark",
  rememberAsDeliveryLocation = false,
  initialLocation = null,
}: AddressInputProps) {
  const theme = TONES[tone];
  const reactId = useId();
  const listId = `${reactId}-suggestions`;
  const mapId = `address-map-${reactId}`;
  const detailsId = `${reactId}-details`;

  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");
  const map = useMap(mapId);
  const apiStatus = useApiLoadingStatus();
  const authFailed = useMapsAuthFailed();
  const apiFailed =
    authFailed ||
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE;

  const [query, setQuery] = useState(
    value ?? initialLocation?.address ?? "",
  );
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(
    initialLocation,
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState("");
  const [moving, setMoving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [accuracy, setAccuracy] = useState<{
    lat: number;
    lng: number;
    radius: number;
  } | null>(null);
  const [start] = useState(() => {
    if (initialLocation) {
      return {
        center: {
          lat: initialLocation.latitude,
          lng: initialLocation.longitude,
        },
        zoom: 17,
      };
    }
    const saved = readDeliveryLocation();
    return saved
      ? { center: { lat: saved.latitude, lng: saved.longitude }, zoom: 15 }
      : { center: LAGOS, zoom: 11 };
  });

  const onChangeRef = useRef(onChange);
  const onLocationChangeRef = useRef(onLocationChange);
  const detailsRef = useRef("");
  const lastEmitted = useRef<string | undefined>(undefined);
  const sessionToken =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const suggestSeq = useRef(0);
  const geocodeSeq = useRef(0);
  const userMovedMap = useRef(false);
  const locationRef = useRef<PickedLocation | null>(initialLocation);

  useEffect(() => {
    onChangeRef.current = onChange;
    onLocationChangeRef.current = onLocationChange;
  }, [onChange, onLocationChange]);

  useEffect(() => {
    if (value === undefined || value === lastEmitted.current) return;
    setQuery(value);
    setLocation(null);
    locationRef.current = null;
    setDetails("");
    detailsRef.current = "";
  }, [value]);

  const submittedAddress = location
    ? withDetails(location.address, details)
    : query;

  const publish = useCallback((next: PickedLocation | null, text: string) => {
    const full = next ? withDetails(next.address, detailsRef.current) : text;
    lastEmitted.current = full;
    onChangeRef.current?.(full);
    onLocationChangeRef.current?.(next ? { ...next, address: full } : null);
  }, []);

  const choose = useCallback(
    (next: PickedLocation, panMap: boolean, zoom = 17) => {
      locationRef.current = next;
      setLocation(next);
      setQuery(next.address);
      setOpen(false);
      setSuggestions([]);
      setMessage("");
      setAccuracy(null);
      if (panMap && map) {
        map.panTo({ lat: next.latitude, lng: next.longitude });
        map.setZoom(zoom);
      }
      if (rememberAsDeliveryLocation) saveDeliveryLocation(next);
      publish(next, next.address);
    },
    [map, publish, rememberAsDeliveryLocation],
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!geocoding) return null;
      try {
        const { results } = await new geocoding.Geocoder().geocode({
          location: { lat, lng },
        });
        const best =
          results.find(
            (result) =>
              !result.types.includes("plus_code") &&
              !PLUS_CODE.test(result.formatted_address),
          ) ??
          results.find((result) => !result.types.includes("plus_code")) ??
          results[0];
        if (!best) return null;
        const address =
          best.formatted_address.replace(PLUS_CODE, "").trim() ||
          best.formatted_address;
        return { address, placeId: best.place_id };
      } catch {
        return null;
      }
    },
    [geocoding],
  );

  useEffect(() => {
    const text = query.trim();
    if (!places || !open || text.length < 3 || text === location?.address) {
      setSuggestions([]);
      return;
    }
    const seq = ++suggestSeq.current;
    const timer = window.setTimeout(async () => {
      try {
        sessionToken.current ??= new places.AutocompleteSessionToken();
        const center = map?.getCenter()?.toJSON() ?? start.center;
        const { suggestions: results } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: text,
            sessionToken: sessionToken.current,
            includedRegionCodes: ["ng"],
            language: "en",
            locationBias: { center, radius: 30000 },
          });
        if (seq !== suggestSeq.current) return;
        setSuggestions(
          results.flatMap(({ placePrediction: p }) =>
            p
              ? [
                  {
                    kind: "place" as const,
                    id: p.placeId,
                    main: p.mainText?.text ?? p.text.text,
                    secondary: p.secondaryText?.text ?? "",
                    prediction: p,
                  },
                ]
              : [],
          ),
        );
        setActive(-1);
      } catch {
        if (seq === suggestSeq.current) setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [places, query, open, location, map, start]);

  const options: Option[] = useMemo(
    () => [{ kind: "current", id: "current" }, ...suggestions],
    [suggestions],
  );

  async function selectSuggestion(suggestion: Suggestion) {
    setOpen(false);
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location", "id"] });
      sessionToken.current = null;
      if (!place.location) throw new Error("No coordinates");
      choose(
        {
          address:
            place.formattedAddress ??
            [suggestion.main, suggestion.secondary].filter(Boolean).join(", "),
          latitude: place.location.lat(),
          longitude: place.location.lng(),
          placeId: place.id,
        },
        true,
      );
    } catch {
      setMessage(
        "We couldn't load that address. Try another search or move the map pin.",
      );
    }
  }

  async function locateMe() {
    setOpen(false);
    if (!navigator.geolocation) {
      setMessage("This device can't share its location. Search for your address instead.");
      return;
    }
    setMessage("Finding your location…");
    let position: GeolocationPosition;
    try {
      position = await getBestPosition();
    } catch (error) {
      const denied =
        error instanceof GeolocationPositionError &&
        error.code === error.PERMISSION_DENIED;
      setMessage(
        denied
          ? "Location access is blocked. Allow it in your browser settings, or search for your address."
          : "We couldn't get your location. Search for your address instead.",
      );
      return;
    }

    const { latitude, longitude, accuracy: metres } = position.coords;
    const found = await reverseGeocode(latitude, longitude);
    choose(
      {
        address: found?.address ?? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        latitude,
        longitude,
        placeId: found?.placeId ?? "",
      },
      true,
      zoomForAccuracy(metres),
    );

    if (metres > 50) {
      setAccuracy({ lat: latitude, lng: longitude, radius: metres });
      const range = metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres / 10) * 10} m`;
      setMessage(
        showMap
          ? `Your device could only place you within about ${range} (the orange circle). Drag the map so the pin sits on your building, or search for your street.`
          : `Your device could only place you within about ${range}. If this isn't your address, type your street instead.`,
      );
    }
  }

  function pick(option: Option) {
    if (option.kind === "current") void locateMe();
    else void selectSuggestion(option);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (event.key === "Enter" && open && active >= 0) {
      event.preventDefault();
      pick(options[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  async function handleIdle() {
    setMoving(false);
    const center = map?.getCenter();
    if (!center) return;
    const lat = center.lat();
    const lng = center.lng();
    const current = locationRef.current;
    const moved =
      !current ||
      Math.abs(current.latitude - lat) > SAME_SPOT ||
      Math.abs(current.longitude - lng) > SAME_SPOT;
    if (!moved || (!current && !userMovedMap.current)) return;
    userMovedMap.current = false;
    const seq = ++geocodeSeq.current;
    setResolving(true);
    const found = await reverseGeocode(lat, lng);
    if (seq !== geocodeSeq.current) return;
    setResolving(false);
    choose(
      {
        address: found?.address ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
        placeId: found?.placeId ?? "",
      },
      false,
    );
  }

  function handleMapClick(event: MapMouseEvent) {
    const latLng = event.detail.latLng;
    if (!latLng || !map) return;
    userMovedMap.current = true;
    map.panTo(latLng);
  }

  const listOpen = open && !apiFailed;
  const pinHint = resolving
    ? "Finding this address…"
    : location
      ? "Drag the map to put the pin on your exact spot"
      : "Search above, or drag the map to your location";

  return (
    <div className={showMap ? "space-y-3" : "w-full"}>
      <div className={showMap ? "relative" : undefined}>
        <input
          id={id}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            listOpen && active >= 0 ? `${listId}-${active}` : undefined
          }
          value={query}
          onChange={(event) => {
            const text = event.target.value;
            setQuery(text);
            setOpen(true);
            setMessage("");
            setAccuracy(null);
            if (locationRef.current) {
              locationRef.current = null;
              setLocation(null);
            }
            publish(null, text);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={className}
          required={required ?? Boolean(name)}
          autoComplete="off"
        />
        {listOpen && (
          <div
            id={listId}
            role="listbox"
            className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-xl border py-1 text-left shadow-2xl ${theme.panel}`}
          >
            {options.map((option, index) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard selection is handled on the combobox input (arrow keys + Enter), per the ARIA combobox pattern.
              <div
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                tabIndex={-1}
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(option)}
                className={`flex cursor-pointer items-start gap-3 px-4 py-3 text-sm ${index === active ? theme.active : ""}`}
              >
                {option.kind === "current" ? (
                  <>
                    <LocateFixed
                      size={18}
                      className="mt-0.5 shrink-0 text-[#FF5500]"
                      aria-hidden="true"
                    />
                    <span className="font-semibold">Use my current location</span>
                  </>
                ) : (
                  <>
                    <MapPin
                      size={18}
                      className={`mt-0.5 shrink-0 ${theme.muted}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {option.main}
                      </span>
                      {option.secondary && (
                        <span className={`block truncate text-xs ${theme.muted}`}>
                          {option.secondary}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>
            ))}
            {suggestions.length > 0 && (
              <div
                className={`px-4 pb-2 pt-1 text-right text-[11px] ${theme.muted}`}
              >
                Powered by Google
              </div>
            )}
          </div>
        )}
      </div>

      {showMap && (
        <div className={apiFailed ? "hidden" : "space-y-3"}>
          <div className="relative h-64 w-full overflow-hidden rounded-xl bg-slate-200">
            <GoogleMap
              id={mapId}
              defaultCenter={start.center}
              defaultZoom={start.zoom}
              gestureHandling="greedy"
              disableDefaultUI
              zoomControl
              clickableIcons={false}
              onDragstart={() => {
                userMovedMap.current = true;
                setMoving(true);
                setAccuracy(null);
              }}
              onIdle={() => void handleIdle()}
              onClick={handleMapClick}
              className="h-full w-full"
            >
              {accuracy && (
                <Circle
                  center={{ lat: accuracy.lat, lng: accuracy.lng }}
                  radius={accuracy.radius}
                  clickable={false}
                  strokeColor="#FF5500"
                  strokeOpacity={0.7}
                  strokeWeight={1.5}
                  fillColor="#FF5500"
                  fillOpacity={0.12}
                />
              )}
            </GoogleMap>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30"
            />
            <svg
              aria-hidden="true"
              width="40"
              height="48"
              viewBox="0 0 40 48"
              className="pointer-events-none absolute left-1/2 top-1/2 drop-shadow-md transition-transform duration-150"
              style={{
                transform: `translate(-50%, calc(-100% - ${moving ? 10 : 0}px))`,
              }}
            >
              <path
                d="M20 47C20 47 37 29.5 37 18A17 17 0 0 0 3 18C3 29.5 20 47 20 47Z"
                fill="#FF5500"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle cx="20" cy="18" r="6.5" fill="#ffffff" />
            </svg>
            <p
              className={`pointer-events-none absolute left-1/2 top-3 max-w-[90%] -translate-x-1/2 rounded-full px-3 py-1.5 text-center text-xs font-semibold shadow ${theme.chip}`}
            >
              {pinHint}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void locateMe()}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-800"
          >
            <LocateFixed size={16} aria-hidden="true" />
            Use my current location
          </button>

          {location && (
            <div className="space-y-1.5">
              <label
                htmlFor={detailsId}
                className={`block text-sm font-semibold ${theme.label}`}
              >
                Flat / house number &amp; landmark{" "}
                <span className={`font-normal ${theme.muted}`}>(optional)</span>
              </label>
              <input
                id={detailsId}
                aria-describedby={`${detailsId}-hint`}
                value={details}
                onChange={(event) => {
                  setDetails(event.target.value);
                  detailsRef.current = event.target.value;
                  publish(locationRef.current, query);
                }}
                placeholder="e.g. Flat 3, blue gate, opposite the church"
                className={className}
                autoComplete="off"
              />
              <p id={`${detailsId}-hint`} className={`text-xs ${theme.muted}`}>
                Added to the address above so the rider can find your door.
              </p>
            </div>
          )}
        </div>
      )}

      <HiddenFields name={name} address={submittedAddress} location={location} />

      {apiFailed && (
        <p role="status" className={`text-xs ${theme.note}`}>
          Google Maps couldn't load. You can still type the address.
        </p>
      )}
      {message && !apiFailed && (
        <p
          role="status"
          className={
            showMap
              ? `text-xs ${theme.note}`
              : `absolute left-0 right-0 top-full mt-2 text-left text-xs ${theme.note}`
          }
        >
          {!listOpen || showMap ? message : ""}
        </p>
      )}
    </div>
  );
}

function getBestPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    let best: GeolocationPosition | null = null;
    let watchId = 0;
    const finish = () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timer);
      if (best) resolve(best);
    };
    const timer = window.setTimeout(() => {
      if (best) finish();
      else {
        navigator.geolocation.clearWatch(watchId);
        reject(new Error("Timed out"));
      }
    }, 10000);
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!best || position.coords.accuracy < best.coords.accuracy) best = position;
        if (position.coords.accuracy <= 30) finish();
      },
      (error) => {
        if (best) return;
        navigator.geolocation.clearWatch(watchId);
        window.clearTimeout(timer);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

function zoomForAccuracy(metres: number) {
  if (metres <= 50) return 18;
  if (metres <= 250) return 17;
  if (metres <= 1000) return 15;
  if (metres <= 5000) return 13;
  return 12;
}

function withDetails(address: string, details: string) {
  const extra = details.trim();
  return extra ? `${extra}, ${address}` : address;
}
