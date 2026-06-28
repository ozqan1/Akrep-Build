import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import {
  authenticate,
  getBiometricCapability,
  hasFallbackPin,
  verifyFallbackPin,
} from '@/services/auth';
import { useTheme } from '@/theme/useTheme';
import { haptic } from '@/lib/haptics';

const LOGO = require('../../assets/splash-icon.png');

interface Props {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const [mode, setMode] = useState<'bio' | 'pin'>('bio');
  const [pin, setPin] = useState('');
  const [pinSet, setPinSet] = useState(false);
  const [error, setError] = useState('');

  const tryBiometric = useCallback(async () => {
    const cap = await getBiometricCapability();
    setPinSet(await hasFallbackPin());
    if (!cap.available) {
      setMode('pin');
      setError(cap.hasHardware ? 'Cihazda kayıtlı parmak izi/yüz yok.' : '');
      return;
    }
    const ok = await authenticate('Uygulamanın kilidini açın');
    if (ok) {
      haptic('success');
      onUnlock();
    } else {
      haptic('error');
      setError('Doğrulama başarısız. Tekrar deneyin.');
    }
  }, [onUnlock]);

  useEffect(() => {
    tryBiometric();
  }, [tryBiometric]);

  const onDigit = async (d: string) => {
    haptic('select');
    const next = (pin + d).slice(0, 6);
    setPin(next);
    setError('');
    if (next.length >= 4) {
      const ok = await verifyFallbackPin(next);
      if (ok) {
        haptic('success');
        onUnlock();
      } else if (next.length === 6) {
        haptic('error');
        setError('Hatalı şifre.');
        setPin('');
      }
    }
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.fill}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
        <Image source={LOGO} style={styles.logo} />
        <Text style={[styles.brand, { color: c.text }]}>Akrep Galeri 🦂</Text>
        <Text style={[styles.sub, { color: c.textDim }]}>Galeri güvenli kasası</Text>

        {mode === 'bio' ? (
          <PressableScale
            onPress={tryBiometric}
            style={[styles.bioBtn, { backgroundColor: c.accent }]}
          >
            <Ionicons name="finger-print" size={28} color={c.onAccent} />
            <Text style={[styles.bioText, { color: c.onAccent }]}>Kilidi Aç</Text>
          </PressableScale>
        ) : (
          <View style={styles.pinWrap}>
            <View style={styles.dots}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { borderColor: c.textDim, backgroundColor: i < pin.length ? c.accent : 'transparent' },
                  ]}
                />
              ))}
            </View>
            <View style={styles.pad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, idx) => (
                <PressableScale
                  key={idx}
                  hapticOnPress={false}
                  disabled={k === ''}
                  onPress={() => (k === 'del' ? setPin((p) => p.slice(0, -1)) : k && onDigit(k))}
                  style={[
                    styles.key,
                    { backgroundColor: k === '' ? 'transparent' : c.surface, borderColor: c.border },
                  ]}
                >
                  {k === 'del' ? (
                    <Ionicons name="backspace-outline" size={22} color={c.text} />
                  ) : (
                    <Text style={[styles.keyText, { color: c.text }]}>{k}</Text>
                  )}
                </PressableScale>
              ))}
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'bio' && pinSet ? (
          <PressableScale onPress={() => setMode('pin')} style={styles.switchBtn}>
            <Text style={[styles.switchText, { color: c.textDim }]}>Şifre ile aç</Text>
          </PressableScale>
        ) : null}
        {mode === 'pin' ? (
          <PressableScale onPress={() => setMode('bio')} style={styles.switchBtn}>
            <Text style={[styles.switchText, { color: c.textDim }]}>Parmak izi ile aç</Text>
          </PressableScale>
        ) : null}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 8 },
  logo: { width: 110, height: 110, borderRadius: 28, marginBottom: 8 },
  brand: { fontSize: 30, fontWeight: '800' },
  sub: { fontSize: 13, marginBottom: 26 },
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 10,
  },
  bioText: { fontSize: 16, fontWeight: '800' },
  pinWrap: { alignItems: 'center', gap: 26, marginTop: 8 },
  dots: { flexDirection: 'row', gap: 14 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  pad: { width: 260, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  keyText: { fontSize: 26, fontWeight: '600' },
  error: { color: '#F87171', fontSize: 13, marginTop: 16, fontWeight: '600' },
  switchBtn: { marginTop: 22, padding: 8 },
  switchText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
