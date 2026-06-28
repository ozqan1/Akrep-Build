/**
 * Akrep Galeri - Genişletilmiş Tema Sistemi
 * 5 farklı tema ve özelleştirme seçenekleri
 */

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textDim: string;
  accent: string;
  accent2: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  onAccent: string;
}

export interface Theme {
  name: string;
  id: string;
  colors: ThemeColors;
  isDark: boolean;
}

// 1. Açık Tema (Light)
export const lightTheme: Theme = {
  name: 'Açık',
  id: 'light',
  isDark: false,
  colors: {
    primary: '#0a7ea4',
    background: '#ffffff',
    surface: '#f5f5f5',
    surfaceAlt: '#e8e8e8',
    text: '#11181C',
    textDim: '#687076',
    accent: '#0a7ea4',
    accent2: '#FF6B6B',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    onAccent: '#ffffff',
  },
};

// 2. Koyu Tema (Dark)
export const darkTheme: Theme = {
  name: 'Koyu',
  id: 'dark',
  isDark: true,
  colors: {
    primary: '#0a7ea4',
    background: '#151718',
    surface: '#1e2022',
    surfaceAlt: '#2a2d30',
    text: '#ECEDEE',
    textDim: '#9BA1A6',
    accent: '#0a7ea4',
    accent2: '#FF6B6B',
    border: '#334155',
    error: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    onAccent: '#ffffff',
  },
};

// 3. AMOLED Tema (Gerçek Siyah)
export const amoledTheme: Theme = {
  name: 'AMOLED',
  id: 'amoled',
  isDark: true,
  colors: {
    primary: '#00d9ff',
    background: '#000000',
    surface: '#0a0a0a',
    surfaceAlt: '#1a1a1a',
    text: '#ffffff',
    textDim: '#808080',
    accent: '#00d9ff',
    accent2: '#FF4081',
    border: '#1a1a1a',
    error: '#FF5252',
    success: '#00E676',
    warning: '#FFD600',
    onAccent: '#000000',
  },
};

// 4. Emerald Tema (Yeşil Tonları)
export const emeraldTheme: Theme = {
  name: 'Emerald',
  id: 'emerald',
  isDark: true,
  colors: {
    primary: '#10b981',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#334155',
    text: '#f1f5f9',
    textDim: '#cbd5e1',
    accent: '#10b981',
    accent2: '#f97316',
    border: '#475569',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    onAccent: '#ffffff',
  },
};

// 5. Sunset Tema (Turuncu-Pembe Tonları)
export const sunsetTheme: Theme = {
  name: 'Sunset',
  id: 'sunset',
  isDark: true,
  colors: {
    primary: '#f97316',
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceAlt: '#0f3460',
    text: '#eaeaea',
    textDim: '#a0a0a0',
    accent: '#f97316',
    accent2: '#e91e63',
    border: '#2d3561',
    error: '#ff6b6b',
    success: '#51cf66',
    warning: '#ffd43b',
    onAccent: '#ffffff',
  },
};

export const themes: Theme[] = [
  lightTheme,
  darkTheme,
  amoledTheme,
  emeraldTheme,
  sunsetTheme,
];

export const getThemeById = (id: string): Theme => {
  return themes.find(t => t.id === id) || darkTheme;
};

export const getThemeByName = (name: string): Theme => {
  return themes.find(t => t.name === name) || darkTheme;
};

/**
 * Özel Tema Oluştur
 */
export function createCustomTheme(
  name: string,
  baseTheme: Theme,
  overrides: Partial<ThemeColors>
): Theme {
  return {
    name,
    id: `custom_${Date.now()}`,
    isDark: baseTheme.isDark,
    colors: {
      ...baseTheme.colors,
      ...overrides,
    },
  };
}

/**
 * Tema Uyumluluğu Kontrol Et
 */
export function validateTheme(theme: Theme): boolean {
  const requiredColors: (keyof ThemeColors)[] = [
    'primary',
    'background',
    'surface',
    'text',
    'accent',
    'border',
  ];

  return requiredColors.every(color => theme.colors[color]);
}
