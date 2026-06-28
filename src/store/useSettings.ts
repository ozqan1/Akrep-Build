import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Appearance, ThemeId } from '@/theme/themes';

/**
 * Open-source "cobalt" extraction instances used to resolve direct media URLs.
 * The downloader tries them in order until one succeeds. Users can override the
 * primary instance from the Settings screen (Ayarlar > Gelişmiş).
 */
export const DEFAULT_INSTANCES = [
  'https://cobalt-api.kwiatekmiki.com',
  'https://co.itsmagic.dev',
  'https://cobalt-backend.canine.tools',
];

export interface SettingsState {
  themeId: ThemeId;
  appearance: Appearance;
  biometricEnabled: boolean;
  privacyGuardEnabled: boolean;
  hapticsEnabled: boolean;
  stripMetadata: boolean;
  cobaltInstance: string;
  cobaltApiKey: string;
  hydrated: boolean;
  setThemeId: (id: ThemeId) => void;
  setAppearance: (a: Appearance) => void;
  toggleAppearance: () => void;
  setBiometricEnabled: (v: boolean) => void;
  setPrivacyGuardEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setStripMetadata: (v: boolean) => void;
  setCobaltInstance: (v: string) => void;
  setCobaltApiKey: (v: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      themeId: 'siyah_inci',
      appearance: 'amoled',
      biometricEnabled: false,
      privacyGuardEnabled: true,
      hapticsEnabled: true,
      stripMetadata: true,
      cobaltInstance: DEFAULT_INSTANCES[0],
      cobaltApiKey: '',
      hydrated: false,
      setThemeId: (id) => set({ themeId: id }),
      setAppearance: (a) => set({ appearance: a }),
      toggleAppearance: () =>
        set({ appearance: get().appearance === 'amoled' ? 'light' : 'amoled' }),
      setBiometricEnabled: (v) => set({ biometricEnabled: v }),
      setPrivacyGuardEnabled: (v) => set({ privacyGuardEnabled: v }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setStripMetadata: (v) => set({ stripMetadata: v }),
      setCobaltInstance: (v) => set({ cobaltInstance: v.trim() }),
      setCobaltApiKey: (v) => set({ cobaltApiKey: v.trim() }),
    }),
    {
      name: 'akrep-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    }
  )
);
