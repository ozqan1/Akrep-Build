import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { setFallbackPin } from '@/services/auth';
import { useTheme } from '@/theme/useTheme';
import { haptic } from '@/lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** Lets the user set a 4-6 digit fallback PIN used when biometrics are unavailable. */
export function PinSetupModal({ visible, onClose, onSaved }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setPin('');
    setConfirm('');
    setError('');
  };

  const save = async () => {
    if (pin.length < 4) return setError('Şifre en az 4 hane olmalı.');
    if (pin !== confirm) return setError('Şifreler eşleşmiyor.');
    await setFallbackPin(pin);
    haptic('success');
    reset();
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Yedek Şifre Belirle</Text>
          <Text style={[styles.sub, { color: c.textDim }]}>
            Parmak izi çalışmadığında bu şifre ile giriş yaparsınız.
          </Text>
          <TextInput
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="Şifre (4-6 hane)"
            placeholderTextColor={c.textDim}
            keyboardType="number-pad"
            secureTextEntry
            style={[styles.input, { backgroundColor: c.input, color: c.text, borderColor: c.border }]}
          />
          <TextInput
            value={confirm}
            onChangeText={(t) => setConfirm(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="Şifreyi tekrar girin"
            placeholderTextColor={c.textDim}
            keyboardType="number-pad"
            secureTextEntry
            style={[styles.input, { backgroundColor: c.input, color: c.text, borderColor: c.border }]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <PressableScale
              onPress={() => {
                reset();
                onClose();
              }}
              style={[styles.btn, { backgroundColor: c.surfaceAlt }]}
            >
              <Text style={[styles.btnText, { color: c.text }]}>Vazgeç</Text>
            </PressableScale>
            <PressableScale onPress={save} style={[styles.btn, { backgroundColor: c.accent }]}>
              <Text style={[styles.btnText, { color: c.onAccent }]}>Kaydet</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 28 },
  card: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 22, gap: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 13, marginBottom: 6 },
  input: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 4,
  },
  error: { color: '#F87171', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '800' },
});
