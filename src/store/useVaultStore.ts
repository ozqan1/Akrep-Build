import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import {
  encryptAndMoveToVault,
  decryptFromVault,
  deleteFromVault,
  listVaultItems,
  getMasterKey,
  initializeVault,
} from '@/lib/vault-encryption';

export interface VaultAsset {
  id: string;
  filename: string;
  mediaType: 'photo' | 'video' | 'audio';
  createdAt: number;
  fileSize: number;
  isDecrypted: boolean;
  decryptedUri?: string;
}

interface VaultState {
  vaultAssets: VaultAsset[];
  isLocked: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  initVault: () => Promise<void>;
  lockVault: () => void;
  unlockVault: (pin: string) => Promise<boolean>;
  addToVault: (sourceUri: string, filename: string, mediaType: 'photo' | 'video' | 'audio') => Promise<void>;
  removeFromVault: (assetId: string) => Promise<void>;
  getDecryptedUri: (assetId: string) => Promise<string | null>;
  loadVaultAssets: () => Promise<void>;
}

const VAULT_PIN_KEY = 'akrep_vault_pin';

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultAssets: [],
  isLocked: true,
  loading: false,
  error: null,

  initVault: async () => {
    try {
      set({ loading: true, error: null });
      await initializeVault();
      await get().loadVaultAssets();
      set({ isLocked: true, loading: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Vault başlatılamadı';
      set({ error: errorMsg, loading: false });
    }
  },

  lockVault: () => {
    set({ isLocked: true, vaultAssets: [] });
  },

  unlockVault: async (pin: string) => {
    try {
      const storedPin = await SecureStore.getItemAsync(VAULT_PIN_KEY);
      
      if (!storedPin) {
        // İlk kez PIN ayarlanıyor
        await SecureStore.setItemAsync(VAULT_PIN_KEY, pin);
        set({ isLocked: false });
        await get().loadVaultAssets();
        return true;
      }
      
      if (storedPin === pin) {
        set({ isLocked: false });
        await get().loadVaultAssets();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Vault kilit açma hatası:', error);
      return false;
    }
  },

  addToVault: async (sourceUri: string, filename: string, mediaType: 'photo' | 'video' | 'audio') => {
    try {
      set({ loading: true, error: null });
      
      const vaultItem = await encryptAndMoveToVault(sourceUri, filename, mediaType);
      
      const newAsset: VaultAsset = {
        id: vaultItem.id,
        filename: vaultItem.filename,
        mediaType: vaultItem.mediaType,
        createdAt: vaultItem.createdAt,
        fileSize: vaultItem.fileSize,
        isDecrypted: false,
      };
      
      set(state => ({
        vaultAssets: [...state.vaultAssets, newAsset],
        loading: false,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Vault\'a eklenemedi';
      set({ error: errorMsg, loading: false });
    }
  },

  removeFromVault: async (assetId: string) => {
    try {
      set({ loading: true, error: null });
      
      const asset = get().vaultAssets.find(a => a.id === assetId);
      if (!asset) throw new Error('Varlık bulunamadı');
      
      const vaultItem = {
        id: assetId,
        originalUri: '',
        encryptedUri: '',
        filename: asset.filename,
        mediaType: asset.mediaType,
        createdAt: asset.createdAt,
        fileSize: asset.fileSize,
      };
      
      await deleteFromVault(vaultItem);
      
      set(state => ({
        vaultAssets: state.vaultAssets.filter(a => a.id !== assetId),
        loading: false,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Vault\'tan silinemedi';
      set({ error: errorMsg, loading: false });
    }
  },

  getDecryptedUri: async (assetId: string) => {
    try {
      const asset = get().vaultAssets.find(a => a.id === assetId);
      if (!asset) return null;
      
      const vaultItem = {
        id: assetId,
        originalUri: '',
        encryptedUri: '',
        filename: asset.filename,
        mediaType: asset.mediaType,
        createdAt: asset.createdAt,
        fileSize: asset.fileSize,
      };
      
      const decryptedUri = await decryptFromVault(vaultItem);
      
      // State'i güncelle
      set(state => ({
        vaultAssets: state.vaultAssets.map(a =>
          a.id === assetId
            ? { ...a, isDecrypted: true, decryptedUri }
            : a
        ),
      }));
      
      return decryptedUri;
    } catch (error) {
      console.error('Dosya şifresi çözülemedi:', error);
      return null;
    }
  },

  loadVaultAssets: async () => {
    try {
      set({ loading: true, error: null });
      
      const items = await listVaultItems();
      const assets: VaultAsset[] = items.map(item => ({
        id: item.id,
        filename: item.filename,
        mediaType: item.mediaType,
        createdAt: item.createdAt,
        fileSize: item.fileSize,
        isDecrypted: false,
      }));
      
      set({ vaultAssets: assets, loading: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Vault varlıkları yüklenemedi';
      set({ error: errorMsg, loading: false });
    }
  },
}));
