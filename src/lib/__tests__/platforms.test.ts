import { describe, it, expect } from 'vitest';
import { formatPlatformLabel, PLATFORM_GROUPS, DEFAULT_PLATFORM_KEYS } from '../platforms';

describe('platforms.ts', () => {
  it('formats platform keys into human-readable labels correctly', () => {
    expect(formatPlatformLabel('PS5')).toBe('PlayStation 5');
    expect(formatPlatformLabel('PS4')).toBe('PlayStation 4');
    expect(formatPlatformLabel('PS3')).toBe('PlayStation 3');
    expect(formatPlatformLabel('PS2')).toBe('PlayStation 2');
    expect(formatPlatformLabel('PlayStation')).toBe('PlayStation');
    expect(formatPlatformLabel('PSP')).toBe('PlayStation Portable (PSP)');
    expect(formatPlatformLabel('PS Vita')).toBe('PlayStation Vita');

    expect(formatPlatformLabel('Nintendo Switch')).toBe('Nintendo Switch');
    expect(formatPlatformLabel('Switch 2')).toBe('Nintendo Switch 2');
    expect(formatPlatformLabel('GameCube')).toBe('Nintendo GameCube');
    expect(formatPlatformLabel('Wii')).toBe('Nintendo Wii');
    expect(formatPlatformLabel('NDS')).toBe('Nintendo DS');
    expect(formatPlatformLabel('3DS')).toBe('Nintendo 3DS');
    expect(formatPlatformLabel('GameBoy')).toBe('Game Boy');
    expect(formatPlatformLabel('GameBoy Color')).toBe('Game Boy Color');
    expect(formatPlatformLabel('GameBoy Advance')).toBe('Game Boy Advance');

    expect(formatPlatformLabel('Xbox')).toBe('Xbox');
    expect(formatPlatformLabel('Xbox 360')).toBe('Xbox 360');
    expect(formatPlatformLabel('Xbox One')).toBe('Xbox One');
    expect(formatPlatformLabel('Xbox Series X/S')).toBe('Xbox Series X/S');

    expect(formatPlatformLabel('PC')).toBe('PC');
    expect(formatPlatformLabel('Steam Deck')).toBe('Steam Deck');
  });

  it('returns original key for unmapped platforms', () => {
    expect(formatPlatformLabel('Sega Genesis')).toBe('Sega Genesis');
    expect(formatPlatformLabel('')).toBe('');
    expect(formatPlatformLabel(null)).toBe('');
  });

  it('contains expected grouped structure', () => {
    const groupNames = PLATFORM_GROUPS.map(g => g.group);
    expect(groupNames).toContain('PlayStation');
    expect(groupNames).toContain('Nintendo (Sobremesa)');
    expect(groupNames).toContain('Nintendo (Portátiles)');
    expect(groupNames).toContain('Xbox');
    expect(groupNames).toContain('PC & Otros');
  });

  it('includes key platforms in DEFAULT_PLATFORM_KEYS', () => {
    expect(DEFAULT_PLATFORM_KEYS.has('PS5')).toBe(true);
    expect(DEFAULT_PLATFORM_KEYS.has('Switch 2')).toBe(true);
    expect(DEFAULT_PLATFORM_KEYS.has('Nintendo 3DS')).toBe(true);
    expect(DEFAULT_PLATFORM_KEYS.has('Xbox')).toBe(true);
  });
});
