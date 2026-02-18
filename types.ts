
export interface PrayerTimes {
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
  [key: string]: string;
}

export interface PrayerData {
  date: string;
  times: PrayerTimes;
  city: string;
  isOffline?: boolean;
  lastUpdated?: string;
  source?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ManualLocation {
  city: string;
  coords: Coordinates;
}

export interface AppSettings {
  soundType: 'ezan' | 'beep' | 'custom'; // Changed from boolean useEzanSound
  customSoundSource?: string; // Base64 data URI of the custom file
  customSoundName?: string; // Name of the file for display
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  prayerReminders: Record<string, number>; // key: prayerKey, value: minutes (0 or 10)
  volume: number;
  locationMode: 'auto' | 'manual';
  manualLocation?: ManualLocation;
}

export enum PrayerName {
  Imsak = 'İmsak',
  Gunes = 'Güneş',
  Ogle = 'Öğle',
  Ikindi = 'İkindi',
  Aksam = 'Akşam',
  Yatsi = 'Yatsı'
}

export const PrayerKeys = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];

export interface NextPrayerInfo {
  name: PrayerName;
  key: string;
  time: string;
  minutesRemaining: number;
  isTomorrow: boolean;
}
