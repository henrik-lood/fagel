// Bird species from Firebase 'birds' collection
export interface BirdSpecies {
  id: string;
  latinName: string;
  name: string;
}

// Location for observations
export interface ObservationLocation {
  lat: number;
  lng: number;
  name?: string;
}

// User observation - stored in users/{uid}.birds array
export interface BirdObservation {
  birdId: string;
  seenSwe?: boolean;
  seenInt?: boolean;
  heardSwe?: boolean;
  heardInt?: boolean;
  ringedSwe?: boolean;
  ringedInt?: boolean;
  date?: string;
  comment?: string;
  location?: ObservationLocation;
}

// User document from Firebase 'users' collection
export interface UserDocument {
  birds: BirdObservation[];
  birdsMaster?: unknown[];
  birdsLists?: unknown[];
}

// For display purposes - enriched observation with species data
export interface EnrichedObservation extends BirdObservation {
  species?: BirdSpecies;
}

export type CustomFieldType = 'text' | 'number' | 'boolean' | 'select';

export interface CustomFieldDefinition {
  id: string;
  userId: string;
  name: string;
  type: CustomFieldType;
  options?: string[];
}
