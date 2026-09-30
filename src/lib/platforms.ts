/**
 * Platform Configuration & Groupings for LibraryTracker
 * Organizes consoles chronologically by brand while preserving underlying reference keys.
 */

export interface PlatformItem {
  key: string;
  label: string;
}

export interface PlatformGroup {
  group: string;
  platforms: PlatformItem[];
}

export const PLATFORM_GROUPS: PlatformGroup[] = [
  {
    group: 'PlayStation',
    platforms: [
      { key: 'PlayStation', label: 'PlayStation' },
      { key: 'PS2', label: 'PlayStation 2' },
      { key: 'PSP', label: 'PlayStation Portable (PSP)' },
      { key: 'PS3', label: 'PlayStation 3' },
      { key: 'PS Vita', label: 'PlayStation Vita' },
      { key: 'PS4', label: 'PlayStation 4' },
      { key: 'PS5', label: 'PlayStation 5' },
    ],
  },
  {
    group: 'Nintendo (Sobremesa)',
    platforms: [
      { key: 'NES', label: 'NES' },
      { key: 'SNES', label: 'SNES' },
      { key: 'GameCube', label: 'Nintendo GameCube' },
      { key: 'Wii', label: 'Nintendo Wii' },
      { key: 'Nintendo Switch', label: 'Nintendo Switch' },
      { key: 'Switch 2', label: 'Nintendo Switch 2' },
    ],
  },
  {
    group: 'Nintendo (Portátiles)',
    platforms: [
      { key: 'GameBoy', label: 'Game Boy' },
      { key: 'GameBoy Color', label: 'Game Boy Color' },
      { key: 'GameBoy Advance', label: 'Game Boy Advance' },
      { key: 'NDS', label: 'Nintendo DS' },
    ],
  },
  {
    group: 'Xbox',
    platforms: [
      { key: 'Xbox', label: 'Xbox' },
      { key: 'Xbox 360', label: 'Xbox 360' },
      { key: 'Xbox One', label: 'Xbox One' },
      { key: 'Xbox Series X/S', label: 'Xbox Series X/S' },
    ],
  },
  {
    group: 'PC & Otros',
    platforms: [
      { key: 'PC', label: 'PC' },
      { key: 'Steam Deck', label: 'Steam Deck' },
      { key: 'Mobile', label: 'Mobile' },
      { key: 'Otro', label: 'Otro' },
    ],
  },
];

// Flat map of keys for quick check
export const DEFAULT_PLATFORM_KEYS = new Set(
  PLATFORM_GROUPS.flatMap(g => g.platforms.map(p => p.key))
);

// Map of reference key to display label
const PLATFORM_LABEL_MAP: Record<string, string> = {
  'PlayStation': 'PlayStation',
  'PS1': 'PlayStation',
  'PS2': 'PlayStation 2',
  'PSP': 'PlayStation Portable (PSP)',
  'PS3': 'PlayStation 3',
  'PS Vita': 'PlayStation Vita',
  'PSVita': 'PlayStation Vita',
  'PS4': 'PlayStation 4',
  'PS5': 'PlayStation 5',
  'NES': 'NES',
  'SNES': 'SNES',
  'GameCube': 'Nintendo GameCube',
  'Wii': 'Nintendo Wii',
  'Nintendo Switch': 'Nintendo Switch',
  'Switch 2': 'Nintendo Switch 2',
  'GameBoy': 'Game Boy',
  'GameBoy Color': 'Game Boy Color',
  'GameBoy Advance': 'Game Boy Advance',
  'NDS': 'Nintendo DS',
  'Xbox': 'Xbox',
  'Xbox 360': 'Xbox 360',
  'Xbox One': 'Xbox One',
  'Xbox Series X/S': 'Xbox Series X/S',
  'PC': 'PC',
  'Steam Deck': 'Steam Deck',
  'Mobile': 'Mobile',
  'Otro': 'Otro',
};

/**
 * Returns formatted human-readable label for a platform key
 */
export function formatPlatformLabel(key?: string | null): string {
  if (!key) return '';
  return PLATFORM_LABEL_MAP[key] || key;
}
