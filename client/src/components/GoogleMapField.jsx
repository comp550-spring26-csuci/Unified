import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const DEFAULT_CENTER = { lat: 34.1817, lng: -118.8376 };
let googleMapsPromise = null;

function isValidLocation(value) {
  return (
    value &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  );
}

function normalizeLocation(value) {
  if (!isValidLocation(value)) return null;
  return {
    lat: Number(value.lat),
    lng: Number(value.lng),
  };
}

function getGoogleMapsLink(value) {
  const location = normalizeLocation(value);
  if (!location) return "";
  return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
}

function loadGoogleMapsApi() {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-google-maps-loader="true"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function waitForGoogleMapsReady(timeoutMs = 10000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function check() {
      const maps = window.google?.maps;
      const places = maps?.places;

      if (
        typeof maps?.Map === "function" &&
        typeof maps?.Marker === "function" &&
        typeof places?.PlacesService === "function" &&
        typeof places?.AutocompleteService === "function" &&
        typeof places?.AutocompleteSessionToken === "function"
      ) {
        resolve(window.google);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Google Maps libraries did not finish loading"));
        return;
      }

      window.setTimeout(check, 50);
    }

    check();
  });
}

export function GoogleMapPicker({
  value,
  onChange,
  onPlaceSelect,
  height = 320,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const autocompleteSessionTokenRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  onChangeRef.current = onChange;

  function updateMarkerPosition(location) {
    if (!mapRef.current || !window.google?.maps) return;

    mapRef.current.setCenter(location);
    mapRef.current.setZoom(15);

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position: location,
      });
    } else {
      markerRef.current.setPosition(location);
    }
  }

  function handleSearch() {
    const query = searchText.trim();
    if (!query) return;
    if (!autocompleteServiceRef.current) {
      setError("Map search is not ready yet");
      return;
    }

    setIsSearching(true);
    setError("");
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        sessionToken: autocompleteSessionTokenRef.current,
      },
      async (predictions, status) => {
        setIsSearching(false);

        if (status !== window.google?.maps?.places?.PlacesServiceStatus?.OK) {
          setSuggestions([]);
          setError("No matching location found on Google Maps");
          return;
        }

        if (!predictions?.length) {
          setSuggestions([]);
          setError("No matching location found on Google Maps");
          return;
        }

        await handlePredictionSelect(predictions[0]);
      },
    );
  }

  useEffect(() => {
    let cancelled = false;

    loadGoogleMapsApi()
      .then(() => waitForGoogleMapsReady())
      .then((google) => {
        if (cancelled || !mapContainerRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(mapContainerRef.current, {
            center: normalizeLocation(value) || DEFAULT_CENTER,
            zoom: normalizeLocation(value) ? 15 : 10,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          mapRef.current.addListener("click", (event) => {
            const nextLocation = {
              lat: Number(event.latLng.lat().toFixed(6)),
              lng: Number(event.latLng.lng().toFixed(6)),
            };

            if (!markerRef.current) {
              markerRef.current = new google.maps.Marker({
                map: mapRef.current,
                position: nextLocation,
              });
            } else {
              markerRef.current.setPosition(nextLocation);
            }

            onChangeRef.current?.(nextLocation);
          });
        }

        if (!placesServiceRef.current) {
          placesServiceRef.current = new google.maps.places.PlacesService(
            document.createElement("div"),
          );
        }
        if (!autocompleteServiceRef.current) {
          autocompleteServiceRef.current =
            new google.maps.places.AutocompleteService();
        }
        if (!autocompleteSessionTokenRef.current) {
          autocompleteSessionTokenRef.current =
            new google.maps.places.AutocompleteSessionToken();
        }

        setIsReady(true);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load Google Maps");
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  useEffect(() => {
    if (!isReady || !window.google?.maps || !mapRef.current) return;

    const location = normalizeLocation(value);
    if (!location) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current.setCenter(DEFAULT_CENTER);
      mapRef.current.setZoom(10);
      return;
    }

    updateMarkerPosition(location);
  }, [isReady, value]);

  useEffect(() => {
    if (!isReady || !autocompleteServiceRef.current) return undefined;

    const query = searchText.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          sessionToken: autocompleteSessionTokenRef.current,
        },
        (predictions, status) => {
          if (
            status !== window.google?.maps?.places?.PlacesServiceStatus?.OK &&
            status !== window.google?.maps?.places?.PlacesServiceStatus
              ?.ZERO_RESULTS
          ) {
            setSuggestions([]);
            setError("Failed to load Google Maps suggestions");
            return;
          }

          setSuggestions(predictions || []);
          setError("");
        },
      );
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isReady, searchText]);

  function handlePredictionSelect(prediction) {
    return new Promise((resolve) => {
      if (!placesServiceRef.current || !prediction?.place_id) {
        setError("Failed to use selected Google Maps suggestion");
        resolve();
        return;
      }

      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["formatted_address", "geometry", "name"],
          sessionToken: autocompleteSessionTokenRef.current,
        },
        (place, status) => {
          if (
            status !== window.google?.maps?.places?.PlacesServiceStatus?.OK ||
            !place?.geometry?.location
          ) {
            setError("Failed to use selected Google Maps suggestion");
            resolve();
            return;
          }

          const nextLocation = {
            lat: Number(place.geometry.location.lat().toFixed(6)),
            lng: Number(place.geometry.location.lng().toFixed(6)),
          };

          updateMarkerPosition(nextLocation);
          onChangeRef.current?.(nextLocation);
          setSearchText(place.formatted_address || place.name || prediction.description || "");
          onPlaceSelect?.(place.name || place.formatted_address || prediction.description || "");
          setSuggestions([]);
          autocompleteSessionTokenRef.current =
            new window.google.maps.places.AutocompleteSessionToken();
          resolve();
        },
      );
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Alert severity="info">
        Google Maps picker is disabled. Add `VITE_GOOGLE_MAPS_API_KEY` to
        `client/.env` and restart the frontend dev server.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.25}>
      {error ? <Alert severity="warning">{error}</Alert> : null}
      <Box sx={{ position: "relative" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.25 }}>
          <TextField
            fullWidth
            size="small"
            label="Search Google Maps"
            placeholder="Search address, venue, or place"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={isSearching || !searchText.trim()}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </Stack>
        {suggestions.length > 0 ? (
          <Box
            sx={{
              position: "absolute",
              top: 52,
              left: 0,
              right: { xs: 0, sm: 96 },
              zIndex: 10,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "background.paper",
              boxShadow: 3,
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {suggestions.slice(0, 6).map((suggestion, index) => {
              const text = suggestion.description || "";
              return (
                <Button
                  key={`${text}-${index}`}
                  fullWidth
                  variant="text"
                  onClick={() => handlePredictionSelect(suggestion)}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    px: 1.5,
                    py: 1,
                    borderRadius: 0,
                    borderBottom:
                      index === Math.min(suggestions.length, 6) - 1
                        ? "none"
                        : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {text}
                </Button>
              );
            })}
          </Box>
        ) : null}
        <Box
          ref={mapContainerRef}
          sx={{
            width: "100%",
            height,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        Click anywhere on the map to drop or move the event pin.
      </Typography>
    </Stack>
  );
}

export function GoogleMapViewer({ value, height = 320 }) {
  const location = normalizeLocation(value);
  if (!location) {
    return (
      <Typography variant="body2" color="text.secondary">
        No map location was added for this event.
      </Typography>
    );
  }

  const iframeSrc = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
  const externalLink = getGoogleMapsLink(location);

  return (
    <Stack spacing={1.25}>
      <Box
        component="iframe"
        title="Event map"
        src={iframeSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sx={{
          width: "100%",
          height,
          border: 0,
          borderRadius: 2,
          overflow: "hidden",
        }}
      />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Pin: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          component="a"
          href={externalLink}
          target="_blank"
          rel="noreferrer"
        >
          Open In Google Maps
        </Button>
      </Stack>
    </Stack>
  );
}
