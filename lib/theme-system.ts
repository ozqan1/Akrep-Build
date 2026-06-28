/**
 * Akrep Galeri Tema Sistemi
 * 5 farklı önceden tanımlanmış tema seçeneği
 */

export type ThemeName = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset';

export interface ThemePalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  blur?: number; // iOS blur effect intensity
}

export const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  // Açık Tema - Beyaz ve temiz
  light: {
    primary: '#0a7ea4',
    secondary: '#40c4ff',
    background: '#ffffff',
    surface: '#f5f5f5',
    foreground: '#11181c',
    muted: '#687076',
    border: '#e5e7eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    blur: 10,
  },

  // Koyu Tema - Gerçek siyah ve iOS tarzı blur
  dark: {
    primary: '#0a7ea4',
    secondary: '#40c4ff',
    background: '#000000',
    surface: '#1a1a1a',
    foreground: '#ecedee',
    muted: '#9ba1a6',
    border: '#334155',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    blur: 15,
  },

  // Okyanus Teması - Mavi tonları
  ocean: {
    primary: '#0369a1',
    secondary: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    foreground: '#e0f2fe',
    muted: '#64748b',
    border: '#0c4a6e',
    success: '#06d6a0',
    warning: '#fbbf24',
    error: '#f87171',
    blur: 12,
  },

  // Orman Teması - Yeşil tonları
  forest: {
    primary: '#15803d',
    secondary: '#22c55e',
    background: '#0f2818',
    surface: '#1a3a2a',
    foreground: '#dcfce7',
    muted: '#6b7280',
    border: '#166534',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    blur: 12,
  },

  // Gün Batımı Teması - Turuncu/Kırmızı tonları
  sunset: {
    primary: '#dc2626',
    secondary: '#f97316',
    background: '#1f1a16',
    surface: '#2d2420',
    foreground: '#fef3c7',
    muted: '#8b7355',
    border: '#92400e',
    success: '#84cc16',
    warning: '#fbbf24',
    error: '#ef4444',
    blur: 12,
  },
};

/**
 * Tema yönetim hook'u
 */
export function useTheme(themeName: ThemeName = 'light'): ThemePalette {
  return THEME_PALETTES[themeName];
}

/**
 * Tema adlarını al
 */
export function getThemeNames(): ThemeName[] {
  return Object.keys(THEME_PALETTES) as ThemeName[];
}

/**
 * Tema adını Türkçeye çevir
 */
export function getThemeLabel(themeName: ThemeName): string {
  const labels: Record<ThemeName, string> = {
    light: 'Açık',
    dark: 'Koyu',
    ocean: 'Okyanus',
    forest: 'Orman',
    sunset: 'Gün Batımı',
  };
  return labels[themeName];
}
