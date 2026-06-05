// ╔══════════════════════════════════════════════════════════════╗
// ║            PLACE SCHEMA — field reference                    ║
// ║  This is the canonical shape of a "place" document in       ║
// ║  Firestore. Use this as the default state in PlaceForm.      ║
// ╚══════════════════════════════════════════════════════════════╝

export const EMPTY_PLACE = {
  // ── Core identity ──────────────────────────────────────────
  name:         '',          // string  — display name
  address:      '',          // string  — street address
  neighborhood: '',          // string  — from NEIGHBORHOODS list
  website:      '',          // string  — optional URL

  // ── Classification ─────────────────────────────────────────
  categories:   [],          // string[] — ids from CATEGORIES
  bestFor:      [],          // string[] — from BEST_FOR list
  status:       'want_to_try', // string — from PLACE_STATUS values

  // ── Notes ──────────────────────────────────────────────────
  notes:        '',          // string  — free-text: vibes, what to order, etc.

  // ── Recommendation provenance ──────────────────────────────
  //  recommendedBy:  who told you about this place.
  //    Can be a freeform name ("Celeste", "Instagram foodie", "NYT")
  //    OR a reference to a person in the People list (by name or id).
  //  recommendationContext:  any extra note about the rec itself.
  //    e.g. "Said the frozen daiquiris are life-changing"
  //         "Saw it on @nolafoodie, specifically the oyster po'boy"
  recommendedBy:          '', // string — name/handle/source
  recommendationContext:  '', // string — optional context / quote

  // ── Visit history (populated post-trip) ────────────────────
  visitHistory: [],
  // each entry shape:
  // { tripId, tripLabel, date, notes, rating }
  // rating: 'loved' | 'meh' | 'never_again' | null

  // ── Timestamps (set by db.js via serverTimestamp) ──────────
  // createdAt, updatedAt
};

// ── Form section config ─────────────────────────────────────────
// Used to render PlaceForm in logical grouped sections.

export const PLACE_FORM_SECTIONS = [
  {
    id: 'identity',
    heading: 'The Place',
    fields: ['name', 'address', 'neighborhood', 'website'],
  },
  {
    id: 'classification',
    heading: 'How We Know It',
    fields: ['status', 'categories', 'bestFor'],
  },
  {
    id: 'recommendation',
    heading: 'Who Told Us',
    fields: ['recommendedBy', 'recommendationContext'],
    // Only shown / highlighted when status === 'want_to_try'
    // but still editable for all statuses
  },
  {
    id: 'notes',
    heading: 'Notes & Vibes',
    fields: ['notes'],
  },
];
