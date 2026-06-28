import { ReactNode, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as ScreenCapture from 'expo-screen-capture';
import { LockScreen } from './LockScreen';
import { useSettings } from '@/store/useSettings';

interface Props {
  children: ReactNode;
}

/**
 * Gates the whole app behind biometric/PIN auth (when enabled) and applies the
 * privacy guard: blocks screenshots and blurs the UI when the app is backgrounded
 * so downloaded videos never leak in the app switcher.
 */
export function AuthGate({ children }: Props) {
  const biometricEnabled = useSettings((s) => s.biometricEnabled);
  const privacyGuard = useSettings((s) => s.privacyGuardEnabled);
  const hydrated = useSettings((s) => s.hydrated);

  const [locked, setLocked] = useState(false);
  const [foreground, setForeground] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (hydrated && !initialized.current) {
      initialized.current = true;
      setLocked(biometricEnabled);
    }
  }, [hydrated, biometricEnabled]);

  useEffect(() => {
    if (!biometricEnabled) setLocked(false);
  }, [biometricEnabled]);

  useEffect(() => {
    if (privacyGuard) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }
  }, [privacyGuard]);

  useEffect(() => {
    const handler = (next: AppStateStatus) => {
      const active = next === 'active';
      setForeground(active);
      if (!active && biometricEnabled) setLocked(true);
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [biometricEnabled]);

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

  return (
    <View style={styles.fill}>
      {children}
      {privacyGuard && !foreground ? (
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
