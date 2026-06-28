import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemedBackground } from '@/components/ThemedBackground';
import { PressableScale } from '@/components/PressableScale';
import { Toggle } from '@/components/Toggle';
import { PinSetupModal } from '@/components/PinSetupModal';
import { THEME_LIST } from '@/theme/themes';
import { useTheme } from '@/theme/useTheme';
import { useSettings } from '@/store/useSettings';
import { getBiometricCapability, hasFallbackPin } from '@/services/auth';
import { haptic } from '@/lib/haptics';

const VERSION = '10.9.0';

export default function SettingsTab() {
  const theme = useTheme();
  const c = theme.colors;
  const s = useSettings();
  const [pinModal, setPinModal] = useState(false);
  const [pinSet, setPinSet] = useState(false);

  useEffect(() => {
    hasFallbackPin().then(setPinSet);
  }, [pinModal]);

  const onToggleBiometric = async (next: boolean) => {
    if (!next) {
      s.setBiometricEnabled(false);
      return;
    }
    const cap = await getBiometricCapability();
    if (cap.available) {
      s.setBiometricEnabled(true);
      haptic('success');
      return;
    }
    Alert.alert(
      'Parmak izi bulunamadı',
      'Cihazınızda kayıtlı parmak izi/yüz yok. Yedek bir şifre belirleyelim mi? Bu şifre ile uygulamayı kilitleyebilirsiniz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Şifre Belirle', onPress: () => setPinModal(true) },
      ]
    );
  };

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.screenTitle, { color: c.text }]}>PREMIUM AYARLAR</Text>

          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Text style={[styles.kicker, { color: c.accent }]}>KURUCU</Text>
            <Text style={[styles.founder, { color: c.text }]}>Nebi Özkan</Text>
            <Text style={[styles.kicker, { color: c.accent, marginTop: 14 }]}>UYGULAMA AMACI</Text>
            <Text style={[styles.purpose, { color: c.textDim }]}>
              Ücretsiz, reklamsız ve güvenli premium galeri uygulaması. Fotoğraf ve videolarınızı yönetin.
            </Text>
          </Animated.View>

          <Text style={[styles.group, { color: c.textDim }]}>GÜVENLİK VE ERİŞİM</Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Row
              icon="finger-print"
              label="Parmak İzi Kilidi"
              hint="Uygulamayı ve medyalarınızı koru"
              color={c}
              right={<Toggle value={s.biometricEnabled} onChange={onToggleBiometric} />}
            />
            <Divider color={c.border} />
            <Row
              icon="eye-off"
              label="Gizlilik Koruması"
              hint="Ekran görüntüsü engeli + arka planda bulanıklaştırma"
              color={c}
              right={<Toggle value={s.privacyGuardEnabled} onChange={s.setPrivacyGuardEnabled} />}
            />
            <Divider color={c.border} />
            <PressableScale onPress={() => setPinModal(true)} style={styles.rowPress}>
              <Row
                icon="keypad"
                label="Yedek Şifre"
                hint={pinSet ? 'Şifre belirlendi • değiştirmek için dokunun' : 'Henüz belirlenmedi'}
                color={c}
                right={<Ionicons name="chevron-forward" size={18} color={c.textDim} />}
              />
            </PressableScale>
          </View>

          <Text style={[styles.group, { color: c.textDim }]}>KİŞİSELLEŞTİRME</Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Row
              icon="moon"
              label="Karanlık Mod (AMOLED)"
              hint="Siyah / Beyaz tema arası geçiş"
              color={c}
              right={
                <Toggle
                  value={s.appearance === 'amoled'}
                  onChange={(v) => s.setAppearance(v ? 'amoled' : 'light')}
                />
              }
            />
            <Divider color={c.border} />
            <Row
              icon="pulse"
              label="Dokunsal Geri Bildirim"
              hint="Buton ve geçişlerde titreşim"
              color={c}
              right={<Toggle value={s.hapticsEnabled} onChange={s.setHapticsEnabled} />}
            />
          </View>

          <Text style={[styles.group, { color: c.textDim }]}>TEMALAR</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themeRow}
          >
            {THEME_LIST.map((t) => {
              const selected = t.id === s.themeId;
              return (
                <PressableScale
                  key={t.id}
                  scaleTo={0.95}
                  onPress={() => {
                    haptic('select');
                    s.setThemeId(t.id);
                  }}
                  style={[
                    styles.themeCard,
                    { borderColor: selected ? t.colors.accent : c.border, borderWidth: selected ? 2.5 : 1 },
                  ]}
                >
                  <LinearGradient colors={t.gradient} style={styles.themeSwatch}>
                    <View style={[styles.themeDot, { backgroundColor: t.colors.accent }]} />
                    {selected ? (
                      <View style={[styles.themeCheck, { backgroundColor: t.colors.accent }]}>
                        <Ionicons name="checkmark" size={14} color={t.colors.onAccent} />
                      </View>
                    ) : null}
                  </LinearGradient>
                  <Text style={[styles.themeName, { color: c.text }]} numberOfLines={1}>
                    {t.name}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          <Text style={[styles.group, { color: c.textDim }]}>GELİŞMİŞ</Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Row
              icon="grid-outline"
              label="Izgara Boyutu"
              hint="Galeri görünümünde kaç sütun gösterilsin"
              color={c}
              right={
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[2, 3, 4].map((n) => (
                    <PressableScale
                      key={n}
                      onPress={() => {}}
                      style={[
                        styles.gridSizeBtn,
                        { backgroundColor: n === 3 ? c.accent : c.surfaceAlt, borderColor: c.border },
                      ]}
                    >
                      <Text style={{ color: n === 3 ? c.onAccent : c.textDim, fontSize: 12, fontWeight: '700' }}>{n}</Text>
                    </PressableScale>
                  ))}
                </View>
              }
            />
            <Divider color={c.border} />
            <Row
              icon="information-circle-outline"
              label="EXIF Bilgisi"
              hint="Fotoğraf detaylarını göster (konum, kamera vb.)"
              color={c}
              right={<Toggle value={true} onChange={() => {}} />}
            />
          </View>

          <Text style={[styles.footer, { color: c.textDim }]}>
            Sürüm v{VERSION} Özkan{'\n'}© 2026 Nebi Özkan
          </Text>
        </ScrollView>
      </SafeAreaView>

      <PinSetupModal
        visible={pinModal}
        onClose={() => setPinModal(false)}
        onSaved={() => {
          setPinSet(true);
          if (!s.biometricEnabled) s.setBiometricEnabled(true);
        }}
      />
    </ThemedBackground>
  );
}

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  color: ReturnType<typeof useTheme>['colors'];
  right: React.ReactNode;
}

function Row({ icon, label, hint, color, right }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: color.surfaceAlt }]}>
        <Ionicons name={icon} size={18} color={color.accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: color.text }]}>{label}</Text>
        <Text style={[styles.rowHint, { color: color.textDim }]}>{hint}</Text>
      </View>
      {right}
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 12 },
  screenTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  founder: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  purpose: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  group: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rowPress: {},
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowHint: { fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  themeRow: { gap: 12, paddingVertical: 4, paddingHorizontal: 2 },
  themeCard: { width: 96, borderRadius: 16, padding: 6, alignItems: 'center', gap: 6 },
  themeSwatch: {
    width: '100%',
    height: 96,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
  },
  themeDot: { width: 22, height: 22, borderRadius: 11 },
  themeCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  themeName: { fontSize: 12, fontWeight: '700' },
  advLabel: { fontSize: 15, fontWeight: '700' },
  advHint: { fontSize: 12, marginTop: 4, marginBottom: 10, lineHeight: 18 },
  advInput: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 8,
  },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 22, lineHeight: 18 },
  gridSizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
