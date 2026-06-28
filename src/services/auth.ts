import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'akrep_fallback_pin';

export interface BiometricCapability {
  hasHardware: boolean;
  isEnrolled: boolean;
  /** True when device can actually authenticate with biometrics. */
  available: boolean;
  types: LocalAuthentication.AuthenticationType[];
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  return { hasHardware, isEnrolled, available: hasHardware && isEnrolled, types };
}

export async function authenticate(reason: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'İptal',
    fallbackLabel: 'Şifre kullan',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function setFallbackPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function hasFallbackPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_KEY)) !== null;
}

export async function verifyFallbackPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored !== null && stored === pin;
}

export async function clearFallbackPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
