// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Testdaten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    kategorie?: LookupValue;
    bemerkungen?: string;
  };
}

export const APP_IDS = {
  TESTDATEN: '6a9014e744bb16b9032133f9',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'testdaten': {
    kategorie: [{ key: "option_b", label: "Option B" }, { key: "option_c", label: "Option C" }, { key: "option_a", label: "Option A" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'testdaten': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'datum': 'date/date',
    'kategorie': 'lookup/select',
    'bemerkungen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateTestdaten = StripLookup<Testdaten['fields']>;