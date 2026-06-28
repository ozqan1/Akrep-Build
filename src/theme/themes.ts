import { ImageSourcePropType } from 'react-native';

export type ThemeId = 'siyah_inci' | 'gece_mavisi' | 'zumrut' | 'yakut' | 'ozel';
export type Appearance = 'amoled' | 'light';

export interface ThemeColors {
  /** Primary accent used for main buttons, active tabs, highlights. */
  accent: string;
  /** Secondary accent for gradients / glows. */
  accent2: string;
  /** On-accent text color (text drawn over accent buttons). */
  onAccent: string;
  /** Base background color (behind the wallpaper image). */
  background: string;
  /** Card / surface background. */
  surface: string;
  /** Slightly elevated / alternate surface. */
  surfaceAlt: string;
  /** Input / pill background. */
  input: string;
  /** Primary text. */
  text: string;
  /** Dimmed / secondary text. */
  textDim: string;
  /** Hairline border color. */
  border: string;
  /** Tab bar background. */
  tabBar: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  /** Wallpaper used when appearance === 'amoled'. */
  wallpaper: ImageSourcePropType;
  /** Two-stop gradient that matches the wallpaper (used as fallback / overlays). */
  gradient: [string, string];
  colors: ThemeColors;
}

const WALLPAPERS: Record<ThemeId, ImageSourcePropType> = {
  siyah_inci: require('../../assets/backgrounds/black_pearl.jpg'),
  gece_mavisi: require('../../assets/backgrounds/night_blue.jpg'),
  zumrut: require('../../assets/backgrounds/emerald.jpg'),
  yakut: require('../../assets/backgrounds/ruby.jpg'),
  ozel: require('../../assets/backgrounds/ozel.jpg'),
};

const baseDark = {
  background: '#000000',
  surface: 'rgba(22,22,24,0.92)',
  surfaceAlt: 'rgba(38,38,42,0.92)',
  input: 'rgba(30,30,33,0.95)',
  text: '#FFFFFF',
  textDim: '#9A9AA2',
  border: 'rgba(255,255,255,0.08)',
  tabBar: 'rgba(10,10,12,0.96)',
};

export const THEMES: Record<ThemeId, Theme> = {
  siyah_inci: {
    id: 'siyah_inci',
    name: 'Siyah İnci',
    description: 'AMOLED siyah üzerine sıcak amber',
    wallpaper: WALLPAPERS.siyah_inci,
    gradient: ['#1a1a1f', '#000000'],
    colors: {
      accent: '#FF8A00',
      accent2: '#FFB347',
      onAccent: '#FFFFFF',
      ...baseDark,
    },
  },
  gece_mavisi: {
    id: 'gece_mavisi',
    name: 'Gece Mavisi',
    description: 'Yıldızlı gece mavisi',
    wallpaper: WALLPAPERS.gece_mavisi,
    gradient: ['#0a1230', '#02040e'],
    colors: {
      accent: '#3B82F6',
      accent2: '#60A5FA',
      onAccent: '#FFFFFF',
      ...baseDark,
    },
  },
  zumrut: {
    id: 'zumrut',
    name: 'Zümrüt',
    description: 'Derin zümrüt yeşili',
    wallpaper: WALLPAPERS.zumrut,
    gradient: ['#06281e', '#010a08'],
    colors: {
      accent: '#10B981',
      accent2: '#34D399',
      onAccent: '#04130d',
      ...baseDark,
    },
  },
  yakut: {
    id: 'yakut',
    name: 'Yakut',
    description: 'Ateşli yakut kırmızısı',
    wallpaper: WALLPAPERS.yakut,
    gradient: ['#3c0812', '#0c0104'],
    colors: {
      accent: '#E11D48',
      accent2: '#FB7185',
      onAccent: '#FFFFFF',
      ...baseDark,
    },
  },
  ozel: {
    id: 'ozel',
    name: 'Nebi Özkan Özel',
    description: 'Akrep temalı altın imza',
    wallpaper: WALLPAPERS.ozel,
    gradient: ['#2a1605', '#0a0500'],
    colors: {
      accent: '#F5B301',
      accent2: '#FFD75E',
      onAccent: '#1a1200',
      ...baseDark,
    },
  },
};

const lightOverrides = {
  background: '#F2F3F7',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEEF3',
  input: '#EEF0F5',
  text: '#101114',
  textDim: '#6B6F7A',
  border: 'rgba(0,0,0,0.08)',
  tabBar: 'rgba(255,255,255,0.97)',
};

export function resolveTheme(id: ThemeId, appearance: Appearance): Theme {
  const base = THEMES[id];
  if (appearance === 'amoled') return base;
  return {
    ...base,
    colors: {
      ...base.colors,
      ...lightOverrides,
      onAccent: base.colors.onAccent,
    },
  };
}

export const THEME_LIST: Theme[] = [
  THEMES.siyah_inci,
  THEMES.gece_mavisi,
  THEMES.zumrut,
  THEMES.yakut,
  THEMES.ozel,
];
