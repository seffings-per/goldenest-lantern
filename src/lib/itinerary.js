// Itinerary suggestion engine
// Fills empty day slots based on category variety and neighborhood grouping.
// Respects arrival time on Day 1 and departure time on the last day.

// Convert a time string to minutes since midnight.
// Handles both 12h ("3:00 PM") and 24h ("15:00") formats.
export function parseTime(timeStr) {
  if (!timeStr) return Infinity;
  const match = timeStr.trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return Infinity;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2] || '0', 10);
  const ampm = match[3];
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

const TIME_SLOTS = [
  { time: '11:00 AM', cats: ['brunch', 'coffee'] },
  { time: '2:00 PM',  cats: ['art', 'shopping', 'outdoors', 'spiritual', 'cheap'] },
  { time: '7:00 PM',  cats: ['dinner', 'fancy', 'nice', 'dresscode', 'lunch'] },
  { time: '10:00 PM', cats: ['bars', 'music', 'drag', 'dive', 'latenight'] },
];

// Neighborhoods to cluster per day (rotated by day index)
const HOOD_GROUPS = [
  ['French Quarter', 'Marigny', 'Frenchmen Street'],
  ['Bywater', 'Algiers'],
  ['Garden District', 'Uptown', 'Magazine Street'],
  ['Mid-City', 'Treme', 'CBD / Warehouse'],
];

const PRIORITY = { must_go: 10, want_to_try: 9, tried_liked: 5, loved: 4, meh: 1 };

// Returns a new itinerary array.
// Manual slots (suggested !== true) are always preserved.
// Previously suggested slots are cleared and replaced with fresh picks.
// Respects arrivalTime on Day 1 and departureTime on last day.
export function generateItinerary(allPlaces, trip) {
  const {
    itinerary = [],
    arrivalTime = '',
    departureTime = '',
    accommodationHood = '',
    travelTimeFromAirport = 0,
    travelTimeToAirport = 0,
  } = trip;
  const dayCount = itinerary.length;

  // IDs that are manually locked in (non-suggested slots)
  const manualIds = new Set();
  itinerary.forEach(day =>
    day.slots.forEach(s => {
      if (!s.suggested && s.placeId && s.placeId !== '__custom__')
        manualIds.add(s.placeId);
    })
  );

  // Sorted candidate pool — exclude never_again and manually placed
  let pool = allPlaces
    .filter(p => p.status !== 'never_again' && !manualIds.has(p.id))
    .sort((a, b) => (PRIORITY[b.status] || 0) - (PRIORITY[a.status] || 0));

  const usedIds = new Set([...manualIds]);

  return itinerary.map((day, dayIdx) => {
    const isFirstDay = dayIdx === 0;
    const isLastDay  = dayIdx === dayCount - 1;

    // Time window for suggestions — add travel buffer from/to airport
    const minMins = (isFirstDay && arrivalTime)
      ? parseTime(arrivalTime) + Number(travelTimeFromAirport || 0)
      : 0;
    const maxMins = (isLastDay && departureTime)
      ? parseTime(departureTime) - Number(travelTimeToAirport || 0)
      : Infinity;

    // Only use time slots that fall strictly inside the window
    const allowedTs = TIME_SLOTS.filter(ts => {
      const t = parseTime(ts.time);
      return t > minMins && t < maxMins;
    });

    // Keep manual (non-suggested) slots regardless of time window
    const manualSlots = day.slots.filter(s => !s.suggested);
    const toFill = Math.max(0, 4 - manualSlots.length);

    if (toFill === 0 || pool.length === 0 || allowedTs.length === 0) {
      return { ...day, slots: manualSlots.sort((a, b) => parseTime(a.time) - parseTime(b.time)) };
    }

    // On Day 1, prefer accommodation neighborhood; otherwise rotate through HOOD_GROUPS
    const preferredHoods = (isFirstDay && accommodationHood)
      ? [accommodationHood, ...HOOD_GROUPS[0].filter(h => h !== accommodationHood)]
      : HOOD_GROUPS[dayIdx % HOOD_GROUPS.length];

    const suggestions = pickForDay(pool, toFill, preferredHoods, usedIds, allowedTs);

    suggestions.forEach(s => {
      usedIds.add(s.placeId);
      pool = pool.filter(p => p.id !== s.placeId);
    });

    const merged = [...manualSlots, ...suggestions]
      .sort((a, b) => parseTime(a.time) - parseTime(b.time));
    return { ...day, slots: merged };
  });
}

// Swap a single suggested slot for the next-best alternative.
export function swapSuggestion(allPlaces, trip, dayIdx, slotIdx) {
  const { itinerary = [] } = trip;
  const currentSlot = itinerary[dayIdx]?.slots[slotIdx];
  if (!currentSlot) return trip;

  // All currently scheduled IDs except the one being swapped
  const occupied = new Set();
  itinerary.forEach((day, di) =>
    day.slots.forEach((s, si) => {
      if (s.placeId && s.placeId !== '__custom__') {
        if (di === dayIdx && si === slotIdx) return;
        occupied.add(s.placeId);
      }
    })
  );

  const matchingTs = TIME_SLOTS.find(ts => ts.time === currentSlot.time);
  const catSet = matchingTs ? new Set(matchingTs.cats) : null;

  const candidates = allPlaces
    .filter(p => !occupied.has(p.id) && p.status !== 'never_again' && p.id !== currentSlot.placeId)
    .sort((a, b) => (PRIORITY[b.status] || 0) - (PRIORITY[a.status] || 0));

  const pick =
    (catSet && candidates.find(p => p.categories?.some(c => catSet.has(c)))) ||
    candidates[0];

  if (!pick) return trip;

  return {
    ...trip,
    itinerary: itinerary.map((day, di) =>
      di !== dayIdx ? day : {
        ...day,
        slots: day.slots.map((s, si) =>
          si !== slotIdx
            ? s
            : { ...s, placeId: pick.id, placeName: pick.name, suggested: true }
        ),
      }
    ),
  };
}

// Pick up to `count` places from the pool using the allowed time slots.
function pickForDay(pool, count, preferredHoods, usedIds, allowedTs) {
  const picked = new Set();
  const results = [];

  for (const ts of allowedTs) {
    if (results.length >= count) break;
    const catSet = new Set(ts.cats);

    const find = (test) => pool.find(p => !usedIds.has(p.id) && !picked.has(p.id) && test(p));

    const pick =
      find(p => preferredHoods.includes(p.neighborhood) && p.categories?.some(c => catSet.has(c))) ||
      find(p => p.categories?.some(c => catSet.has(c))) ||
      find(p => preferredHoods.includes(p.neighborhood)) ||
      find(() => true);

    if (pick) {
      picked.add(pick.id);
      results.push({
        placeId:   pick.id,
        placeName: pick.name,
        time:      ts.time,
        notes:     '',
        suggested: true,
      });
    }
  }

  return results;
}
