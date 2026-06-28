/**
 * Akrep Kalkanı - Güvenlik Katmanı
 * Biyometrik (Yüz tanıma, Parmak izi) ve şifre kilitleri
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export type LockType = 'biometric' | 'password' | 'none';

export interface SecuritySettings {
  appLocked: boolean;
  lockType: LockType;
  password?: string;
  biometricEnabled: boolean;
}

const SECURITY_KEY = 'akrep_security_settings';
const PASSWORD_KEY = 'akrep_password';

/**
 * Güvenlik ayarlarını al
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  try {
    const settings = await SecureStore.getItemAsync(SECURITY_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.error('Güvenlik ayarları alınamadı:', error);
  }

  return {
    appLocked: false,
    lockType: 'none',
    biometricEnabled: false,
  };
}

/**
 * Güvenlik ayarlarını kaydet
 */
export async function saveSecuritySettings(
  settings: SecuritySettings
): Promise<void> {
  try {
    await SecureStore.setItemAsync(SECURITY_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Güvenlik ayarları kaydedilemedi:', error);
    throw error;
  }
}

/**
 * Şifre belirle
 */
export async function setPassword(password: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PASSWORD_KEY, password);
    const settings = await getSecuritySettings();
    settings.lockType = 'password';
    settings.appLocked = true;
    await saveSecuritySettings(settings);
  } catch (error) {
    console.error('Şifre belirlenemedi:', error);
    throw error;
  }
}

/**
 * Şifre doğrula
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const storedPassword = await SecureStore.getItemAsync(PASSWORD_KEY);
    return storedPassword === password;
  } catch (error) {
    console.error('Şifre doğrulanamadı:', error);
    return false;
  }
}

/**
 * Biyometrik kimlik doğrulama kullanılabilir mi kontrol et
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch (error) {
    console.error('Biyometrik kontrol hatası:', error);
    return false;
  }
}

/**
 * Biyometrik kimlik doğrulama yap
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error('Biyometrik kimlik doğrulama hatası:', error);
    return false;
  }
}

/**
 * Biyometrik kilidi etkinleştir
 */
export async function enableBiometricLock(): Promise<void> {
  try {
    const available = await isBiometricAvailable();
    if (!available) {
      throw new Error('Biyometrik kimlik doğrulama kullanılamıyor');
    }

    const settings = await getSecuritySettings();
    settings.lockType = 'biometric';
    settings.appLocked = true;
    settings.biometricEnabled = true;
    await saveSecuritySettings(settings);
  } catch (error) {
    console.error('Biyometrik kilit etkinleştirilemedi:', error);
    throw error;
  }
}

/**
 * Kilidi devre dışı bırak
 */
export async function disableLock(): Promise<void> {
  try {
    const settings = await getSecuritySettings();
    settings.lockType = 'none';
    settings.appLocked = false;
    await saveSecuritySettings(settings);
  } catch (error) {
    console.error('Kilit devre dışı bırakılamadı:', error);
    throw error;
  }
}

/**
 * Uygulama kilidi kontrol et
 */
export async function checkAppLock(): Promise<boolean> {
  try {
    const settings = await getSecuritySettings();

    if (!settings.appLocked) {
      return true; // Kilit yok, erişim izni ver
    }

    if (settings.lockType === 'biometric') {
      return await authenticateWithBiometric();
    }

    // Şifre kilidi için UI tarafından işlenecek
    return false;
  } catch (error) {
    console.error('Kilit kontrolü hatası:', error);
    return false;
  }
}
