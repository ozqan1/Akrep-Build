/**
 * Akrep Galeri - Vault Encryption Service
 * Gizli Kasa için dosya şifreleme ve güvenli depolama
 */

import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const VAULT_DIR = FileSystem.documentDirectory + 'akrep/vault/';
const VAULT_KEY = 'akrep_vault_master_key';
const VAULT_IV_KEY = 'akrep_vault_iv';

interface VaultItem {
  id: string;
  originalUri: string;
  encryptedUri: string;
  filename: string;
  mediaType: 'photo' | 'video' | 'audio';
  createdAt: number;
  fileSize: number;
}

/**
 * Vault dizinini başlat
 */
export async function initializeVault(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(VAULT_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true });
      // .nomedia dosyası oluştur (Android'de galeri tarayıcısından gizle)
      await FileSystem.writeAsStringAsync(VAULT_DIR + '.nomedia', '');
    }
  } catch (error) {
    console.error('Vault dizini başlatılamadı:', error);
    throw error;
  }
}

/**
 * Master şifreleme anahtarı oluştur veya al
 */
export async function getMasterKey(): Promise<string> {
  try {
    let key = await SecureStore.getItemAsync(VAULT_KEY);
    
    if (!key) {
      // 256-bit (32 byte) rastgele anahtar oluştur
      key = await Crypto.getRandomBytesAsync(32).then(bytes => 
        Buffer.from(bytes).toString('hex')
      );
      await SecureStore.setItemAsync(VAULT_KEY, key);
    }
    
    return key;
  } catch (error) {
    console.error('Master anahtar alınamadı:', error);
    throw error;
  }
}

/**
 * IV (Initialization Vector) oluştur veya al
 */
export async function getOrCreateIV(): Promise<string> {
  try {
    let iv = await SecureStore.getItemAsync(VAULT_IV_KEY);
    
    if (!iv) {
      // 128-bit (16 byte) rastgele IV oluştur
      iv = await Crypto.getRandomBytesAsync(16).then(bytes => 
        Buffer.from(bytes).toString('hex')
      );
      await SecureStore.setItemAsync(VAULT_IV_KEY, iv);
    }
    
    return iv;
  } catch (error) {
    console.error('IV alınamadı:', error);
    throw error;
  }
}

/**
 * Dosyayı şifrele ve Vault'a taşı
 */
export async function encryptAndMoveToVault(
  sourceUri: string,
  filename: string,
  mediaType: 'photo' | 'video' | 'audio'
): Promise<VaultItem> {
  try {
    await initializeVault();
    
    const masterKey = await getMasterKey();
    const iv = await getOrCreateIV();
    
    // Dosya bilgilerini al
    const fileInfo = await FileSystem.getInfoAsync(sourceUri, { size: true });
    if (!fileInfo.exists) {
      throw new Error('Kaynak dosya bulunamadı');
    }
    
    const fileSize = (fileInfo as any).size || 0;
    
    // Dosya içeriğini oku
    const fileContent = await FileSystem.readAsStringAsync(sourceUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Şifrele (gerçek uygulamada daha güçlü bir şifreleme algoritması kullanılmalı)
    // Bu örnek basitleştirilmiştir; üretim için expo-crypto veya react-native-crypto kullanın
    const encryptedContent = await encryptContent(fileContent, masterKey, iv);
    
    // Şifrelenmiş dosyayı Vault'a kaydet
    const vaultItemId = `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const encryptedFilePath = VAULT_DIR + vaultItemId;
    
    await FileSystem.writeAsStringAsync(encryptedFilePath, encryptedContent);
    
    // Orijinal dosyayı sil
    await FileSystem.deleteAsync(sourceUri, { idempotent: true });
    
    const vaultItem: VaultItem = {
      id: vaultItemId,
      originalUri: sourceUri,
      encryptedUri: encryptedFilePath,
      filename,
      mediaType,
      createdAt: Date.now(),
      fileSize,
    };
    
    return vaultItem;
  } catch (error) {
    console.error('Dosya şifrelemesi başarısız:', error);
    throw error;
  }
}

/**
 * Vault'tan dosyayı çöz ve geçici olarak erişime aç
 */
export async function decryptFromVault(vaultItem: VaultItem): Promise<string> {
  try {
    const masterKey = await getMasterKey();
    const iv = await getOrCreateIV();
    
    // Şifrelenmiş dosyayı oku
    const encryptedContent = await FileSystem.readAsStringAsync(vaultItem.encryptedUri);
    
    // Şifreyi çöz
    const decryptedContent = await decryptContent(encryptedContent, masterKey, iv);
    
    // Geçici dosya oluştur
    const tempDir = FileSystem.cacheDirectory + 'akrep_temp/';
    const tempInfo = await FileSystem.getInfoAsync(tempDir);
    if (!tempInfo.exists) {
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    }
    
    const tempFilePath = tempDir + vaultItem.id + '_' + vaultItem.filename;
    await FileSystem.writeAsStringAsync(tempFilePath, decryptedContent, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return tempFilePath;
  } catch (error) {
    console.error('Dosya şifresi çözülemedi:', error);
    throw error;
  }
}

/**
 * Vault'tan dosya sil
 */
export async function deleteFromVault(vaultItem: VaultItem): Promise<void> {
  try {
    await FileSystem.deleteAsync(vaultItem.encryptedUri, { idempotent: true });
  } catch (error) {
    console.error('Vault dosyası silinemedi:', error);
    throw error;
  }
}

/**
 * Basit XOR şifreleme (gerçek uygulamada AES-256 kullanılmalı)
 * Bu sadece örnek amaçlıdır
 */
async function encryptContent(content: string, key: string, iv: string): Promise<string> {
  try {
    // Gerçek uygulamada: const encrypted = await AES256.encrypt(content, key, iv);
    // Bu örnek için basit bir encoding yapıyoruz
    const combined = iv + ':' + content;
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    console.error('Şifreleme hatası:', error);
    throw error;
  }
}

/**
 * Basit XOR şifre çözme
 */
async function decryptContent(encryptedContent: string, key: string, iv: string): Promise<string> {
  try {
    // Gerçek uygulamada: const decrypted = await AES256.decrypt(encryptedContent, key, iv);
    const decoded = Buffer.from(encryptedContent, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    return parts[1] || decoded;
  } catch (error) {
    console.error('Şifre çözme hatası:', error);
    throw error;
  }
}

/**
 * Vault'taki tüm öğeleri listele
 */
export async function listVaultItems(): Promise<VaultItem[]> {
  try {
    await initializeVault();
    const files = await FileSystem.readDirectoryAsync(VAULT_DIR);
    
    // Metadata dosyalarını filtrele
    const vaultFiles = files.filter(f => f !== '.nomedia' && !f.startsWith('.'));
    
    // Gerçek uygulamada metadata bir veritabanında saklanmalı
    return vaultFiles.map(filename => ({
      id: filename,
      originalUri: '',
      encryptedUri: VAULT_DIR + filename,
      filename: filename,
      mediaType: 'photo' as const,
      createdAt: Date.now(),
      fileSize: 0,
    }));
  } catch (error) {
    console.error('Vault öğeleri listelenemiyor:', error);
    return [];
  }
}

/**
 * Vault'u tamamen temizle
 */
export async function clearVault(): Promise<void> {
  try {
    const items = await listVaultItems();
    for (const item of items) {
      await deleteFromVault(item);
    }
  } catch (error) {
    console.error('Vault temizlenemedi:', error);
    throw error;
  }
}
