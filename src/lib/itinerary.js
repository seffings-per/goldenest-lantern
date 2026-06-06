// Itinerary suggestion engine
// Fills empty day slots based on category variety and neighborhood grouping.

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
// Previously suggested slots are replaced with fresh picks.
export function generateItinerary(allPlaces, trip) {
  const { itinerary = [] } = trip;

  // IDs that are manually locked in
  const manualIds = new Set();
  itinerary.forEach(day =>
    day.slots.forEach(s => {
      if (!s.suggested && s.placeId && s.placeId !== '__custom__')
        manualIds.add(s.placeId);
    })
  );

  // Sorted candidate pool
  let pool = allPlaces
    .filter(p => p.status !== 'never_again' && !manualIds.has(p.id))
    .sort((a, b) => (PRIORITY[b.status] || 0) - (PRIORITY[a.status] || 0));

  const usedIds = new Set([...manualIds]);

  return itinerary.map((day, dayIdx) => {
    const manualSlots = day.slots.filter(s => !s.suggested);
    const toFill = Math.max(0, 4 - manualSlots.length);

    if (toFill === 0 || pool.length === 0) return { ...day, slots: manualSlots };

    const preferredHoods = HOOD_GROUPS[dayIdx % HOOD_GROUPS.length];
    const suggestions    = pickForDay(pool, toFill, preferredHoods, usedIds);

    suggestions.forEach(s => {
      usedIds.add(s.placeId);
      pool = pool.filter(p => p.id !== s.placeId);
    });

    return { ...day, slots: [...manualSlots, ...suggestions] };
  });
}

// Swap a single suggested slot for the next-best alternative.
export function swapSuggestion(allPlaces, trip, dayIdx, slotIdx) {
  const { itinerary = [] } = trip;
  const currentSlot = itinerary[dayIdx]?.slots[slotIdx];
  if (!currentSlot) return trip;

  // IDs currently scheduled (excluding the slot being swapped)
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

// Pick up to `count` places for a day from the pool.
function pickForDay(pool, count, preferredHoods, usedIds) {
  const picked = new Set();
  const results = [];

  for (const ts of TIME_SLOTS) {
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
