export interface PanoLink {
  targetSceneId: string;
  targetAssetUrl: string;
  bearing: number;
  road: string;
  distanceM: number;
}

export interface MoroccoLocation {
  id: string;
  sceneId: string;
  cityId: string;
  cityNameEn: string;
  cityNameAr: string;
  roadEn: string;
  roadAr: string;
  lat: number;
  lng: number;
  heading: number;
  assetBaseUrl: string;
  links: PanoLink[];
  capturedAt: string;
  descriptionEn?: string;
  descriptionAr?: string;
  category?: 'boulevard' | 'medina' | 'coastal' | 'landmark' | 'suburban' | 'mountain';
}

export interface RoundResult {
  roundNumber: number;
  location: MoroccoLocation;
  guess: { lat: number; lng: number } | null;
  distanceKm: number;
  points: number;
  timeTakenSec: number;
}

export type MovementMode = 'move' | 'no-move' | 'nmpz';

export interface GameSettings {
  language: 'ar' | 'en';
  theme: 'dark' | 'light';
  cityFilter: 'all' | string;
  movementMode: MovementMode;
  timeLimitSec: number | null; // null = unlimited, or 60, 90, 120
  soundEnabled: boolean;
}

export interface CityMeta {
  id: string;
  nameEn: string;
  nameAr: string;
  regionEn: string;
  regionAr: string;
  center: [number, number];
  zoom: number;
  icon: string;
  taglineEn: string;
  taglineAr: string;
}
