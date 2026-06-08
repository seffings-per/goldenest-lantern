# The Goldenest Lantern — CLAUDE.md

> New Orleans travel planner PWA. Built for a small shared group (2 people) to track places, people, and trips in NOLA. All data is scoped to a shared "workspace" so both users see the same data.

---

## Tech Stack

| Layer | Library / Version |
|---|---|
| Build tool | Vite 8 |
| UI | React 19 + React Router DOM v7 |
| Styling | CSS Modules (no Tailwind, no component library) |
| Database & Auth | Firebase 12 — Firestore + Google Auth |
| Hosting | Firebase Hosting → goldenest-lantern.web.app |
| Maps | `@googlemaps/js-api-loader` v1.16.10 |

---

## Commands

```bash
npm run dev        # local dev server
npm run build      # production build → dist/
firebase deploy --only hosting   # deploy to Firebase
git add -A && git commit -m "..." && git push   # push to GitHub
```

---

## Environment Variables

Stored in `.env.local` (gitignored — never commit this file).

```
VITE_GOOGLE_MAPS_KEY=...    # Google Maps API key — enables Places search, map view, geocoding
```

If this key is missing, all Google Maps features gracefully hide themselves (guarded by `MAPS_KEY_SET` export from `src/lib/googlePlaces.js`).

---

## Firestore Data Model

```
workspaces/{workspaceId}/
  places/{placeId}       — NOLA places (see placeSchema.js for full field list)
  people/{personId}      — people who recommend places
  trips/{tripId}         — trips with itinerary, logistics, and post-trip log

userProfiles/{uid}/
  workspaceId            — maps a Firebase user to their workspace
  joinedAt

workspaces/{workspaceId}/
  members[]              — array of UIDs
  memberNames{}          — map of uid → display name
  inviteCode             — 6-char uppercase code for joining
```

### Place fields (key ones)
- `status` — `want_to_try | must_go | tried_liked | loved | meh | never_again`
- `categories[]` — ids from `CATEGORIES` in `constants.js`
- `neighborhood` — from `NEIGHBORHOODS` list in `constants.js`
- `location` — `{ lat, lng }` — set from Google Places or geocoder, used for map view
- `visitHistory[]` — `{ tripId, tripLabel, date, rating, notes }` — populated after trips

### Trip fields (key ones)
- `itinerary[]` — array of day objects `{ day, date, slots[] }`
- `slots[]` — `{ placeId, placeName, time, notes, suggested }` — `suggested: true` = engine-generated, `false` = manually placed
- `accommodation`, `accommodationHood` — where staying
- `arrivalTime`, `departureTime` — HH:MM (24h, from `<input type="time">`)
- `travelTimeFromAirport`, `travelTimeToAirport` — minutes (number)
- `status` — `upcoming | completed`
- `log[]` — post-trip entries `{ placeId, placeName, date, rating, notes }`

---

## Key Files

### `src/lib/constants.js`
All dropdown lists. **Keep these alphabetically sorted** (except `Other` always last in NEIGHBORHOODS).
- `CATEGORIES` — 18 place categories with id, label, icon
- `NEIGHBORHOODS` — 12 NOLA neighborhoods
- `BEST_FOR` — 9 occasion tags
- `TRIP_VIBES` — 6 trip mood options
- `STATUS_META` — display config (label, icon, color) for each place status

### `src/lib/placeSchema.js`
Canonical shape of a place document. `EMPTY_PLACE` is the default state for `PlaceForm`. Update this when adding new place fields.

### `src/lib/db.js`
All Firestore reads and writes. Every page goes through these functions — nothing talks to Firestore directly.
- `getPlaces / addPlace / updatePlace / deletePlace`
- `getTrips / addTrip / updateTrip / deleteTrip`
- `getPeople / addPerson / updatePerson / deletePerson`
- `createWorkspace / joinWorkspace / getUserWorkspace / getWorkspaceInfo`

### `src/lib/googlePlaces.js`
Google Maps API loader wrapper. Loads each library lazily and caches it.
- `loadPlacesLib()` — for autocomplete (PlaceForm, AccommodationSearch)
- `loadMapsLib()` / `loadMarkerLib()` — for the map view (PlacesMap)
- `geocodeAddress(address)` — geocodes a string, appends "New Orleans, LA"
- `MAPS_KEY_SET` — boolean, used to gate all Google features

Uses **Google Places New API**: `AutocompleteSuggestion.fetchAutocompleteSuggestions()` and `place.fetchFields()`. Not the legacy Places API.

### `src/lib/itinerary.js`
Itinerary suggestion engine.
- `generateItinerary(allPlaces, trip)` — fills empty slots for all days. Respects arrival/departure time windows (subtracts travel time to/from airport). Manual slots (`suggested !== true`) are always preserved and never overwritten.
- `swapSuggestion(allPlaces, trip, dayIdx, slotIdx)` — replaces one suggested slot with the next best alternative.
- `parseTime(timeStr)` — converts both 12h (`"3:00 PM"`) and 24h (`"15:00"`) to minutes since midnight. Returns `Infinity` for empty/invalid strings.

**Suggestion logic:** 4 TIME_SLOTS per day (11am, 2pm, 7pm, 10pm), each mapped to category types. Neighborhood groups rotate by day index. Priority scoring: `must_go: 10, want_to_try: 9, tried_liked: 5, loved: 4, meh: 1`. `never_again` places are excluded.

---

## Pages

| Page | Route | What it does |
|---|---|---|
| `Login.jsx` | `/login` | Google sign-in |
| `WorkspaceSetup.jsx` | `/setup` | Create or join a workspace with invite code |
| `OracleBoard.jsx` | `/` | Home / dashboard |
| `Places.jsx` | `/places` | List + map view of all NOLA places |
| `People.jsx` | `/people` | People who make recommendations |
| `Trips.jsx` | `/trips` | Trip planning, itinerary, post-trip log |

---

## Components

```
src/components/
  AppShell.jsx                    — nav + auth wrapper
  LanternIcon.jsx                 — SVG logo
  places/
    PlaceCard.jsx                 — card in the places grid
    PlaceDetail.jsx               — detail overlay for a place
    PlaceForm.jsx                 — add/edit place form (includes Google Places autocomplete)
    PlacesMap.jsx                 — Google Map with AdvancedMarkerElement pins, geocodes missing locations
  people/
    PersonCard.jsx
    PersonForm.jsx
  trips/
    TripCard.jsx
    TripForm.jsx                  — add/edit trip form with itinerary builder
    AccommodationSearch.jsx       — Google Places search filtered to lodging
```

---

## Non-Obvious Implementation Details

**Slot index tracking (TripForm + Trips detail view)**
Slots are sorted chronologically for *display* but stored in insertion order in Firestore. Any operation that mutates a slot (update, remove, swap) must use the *original array index* before sorting. In TripForm, slots are mapped to `{ slot, si }` pairs before sorting so `si` (original index) is always available. Same pattern in the detail view with `origIdx`.

**`suggested` flag**
`suggested: true` = placed by the engine. `suggested: false` (or absent) = manually placed. `generateItinerary` clears all `suggested: true` slots and regenerates them, but never touches `suggested: false` slots. This is how "keep your manual picks" works.

**24h time from `<input type="time">`**
The browser returns `"HH:MM"` format. `parseTime` handles this because without AM/PM it treats the hour as-is (e.g. `"15:00"` → 900 min). No conversion needed.

**Google Maps `mapId`**
`PlacesMap` uses `mapId: 'DEMO_MAP_ID'` which is required for `AdvancedMarkerElement`. If switching to a production map ID, set it in the Google Cloud Console and update the `mapId` in `PlacesMap.jsx`.

**`AccommodationSearch` neighborhood detection**
`detectNeighborhood()` in `AccommodationSearch.jsx` maps Google's `formattedAddress` string to NOLA neighborhood labels by checking for key substrings. If a new area needs to be recognized, add a `[substring, label]` pair to the `checks` array.

**Firestore workspace isolation**
Every read/write uses `wsCol(workspaceId, collection)` and `wsDoc(workspaceId, collection, id)`. The `workspaceId` comes from `WorkspaceContext`. Never write directly to a top-level collection — all user data lives under `workspaces/{id}/`.

---

## Features Built (as of June 2026)

- Google Auth + shared workspace with invite code
- Places: add/edit/delete, status tracking, categories, neighborhoods, recommendations, visit history
- Places: Google Places autocomplete for address/name fill
- Places: map view with color-coded markers (by status), geocodes places without coordinates
- People: track who recommends places
- Trips: plan trips with date range, vibe, notes, accommodation
- Trips: itinerary builder — add stops per day with time and notes
- Trips: ✨ itinerary suggestion engine — auto-fills empty slots by category and neighborhood, respects arrival/departure time windows
- Trips: swap individual suggested slots for alternatives
- Trips: logistics section (accommodation, arrival/departure times, travel time to/from airport) — editable after trip creation
- Trips: accommodation searchable via Google Places (lodging filter)
- Trips: itinerary slots clickable in detail view — change place, get new suggestion, or remove
- Trips: post-trip log — check off visited places, rate them, add notes
- Trips: visit history written back to the place record after logging
- All dropdowns and lists sorted alphabetically
- Slots sorted by time within each day
