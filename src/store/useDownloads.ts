import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PlatformId } from '@/constants/platforms';

export interface DownloadItem {
  id: string;
  platform: PlatformId;
  sourceUrl: string;
  fileUri: string;
  thumbUri?: string;
  filename: string;
  quality?: string;
  createdAt: number;
  sizeBytes?: number;
}

interface DownloadsState {
  items: DownloadItem[];
  add: (item: DownloadItem) => void;
  remove: (id: string) => Promise<void>;
  clearPlatform: (platform: PlatformId) => Promise<void>;
  byPlatform: (platform: PlatformId) => DownloadItem[];
}

export const useDownloads = create<DownloadsState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set({ items: [item, ...get().items] }),
      remove: async (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item) {
          await safeDelete(item.fileUri);
          if (item.thumbUri) await safeDelete(item.thumbUri);
        }
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      clearPlatform: async (platform) => {
        const toRemove = get().items.filter((i) => i.platform === platform);
        await Promise.all(
          toRemove.flatMap((i) => [safeDelete(i.fileUri), i.thumbUri ? safeDelete(i.thumbUri) : Promise.resolve()])
        );
        set({ items: get().items.filter((i) => i.platform !== platform) });
      },
      byPlatform: (platform) =>
        get()
          .items.filter((i) => i.platform === platform)
          .sort((a, b) => b.createdAt - a.createdAt),
    }),
    {
      name: 'akrep-downloads',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

async function safeDelete(uri: string) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore missing files
  }
}
