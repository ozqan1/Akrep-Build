import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppHeader } from './AppHeader';
import { PressableScale } from './PressableScale';
import { ThemedBackground } from './ThemedBackground';
import { VideoGrid } from './VideoGrid';
import { PlatformConfig, QUALITY_OPTIONS, detectPlatform } from '@/constants/platforms';
import { DEFAULT_INSTANCES, useSettings } from '@/store/useSettings';
import { useDownloads, DownloadItem } from '@/store/useDownloads';
import { downloadVideo } from '@/services/downloader';
import { CobaltError } from '@/services/cobalt';
import { useTheme } from '@/theme/useTheme';
import { haptic } from '@/lib/haptics';

interface Props {
  platform: PlatformConfig;
}

type Status = { kind: 'idle' | 'ok' | 'err'; text: string };

export function DownloaderScreen({ platform }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const settings = useSettings();
  const add = useDownloads((s) => s.add);
  const remove = useDownloads((s) => s.remove);
  const items = useDownloads((s) => s.items).filter((i) => i.platform === platform.id);

  const [link, setLink] = useState('');
  const [quality, setQuality] = useState('1080');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' });
  const progress = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  // Auto-paste a matching link from the clipboard when the tab gains focus.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (link.trim()) return;
        const text = (await Clipboard.getStringAsync()).trim();
        if (active && detectPlatform(text) === platform.id) {
          setLink(text);
          setStatus({ kind: 'idle', text: 'Pano linki otomatik yapıştırıldı.' });
        }
      })();
      return () => {
        active = false;
      };
    }, [link, platform.id])
  );

  const pasteFromClipboard = async () => {
    const text = (await Clipboard.getStringAsync()).trim();
    if (!text) {
      setStatus({ kind: 'err', text: 'Pano boş.' });
      haptic('error');
      return;
    }
    setLink(text);
    haptic('select');
  };

  const openVerify = async () => {
    haptic('light');
    const fallback = `https://${platform.hosts[0]}`;
    const target = detectPlatform(link) === platform.id ? link : fallback;
    try {
      await WebBrowser.openBrowserAsync(target);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = async () => {
    Keyboard.dismiss();
    const url = link.trim();
    if (!url) {
      setStatus({ kind: 'err', text: 'Lütfen bir video linki yapıştırın.' });
      haptic('error');
      return;
    }
    const detected = detectPlatform(url);
    if (detected && detected !== platform.id) {
      setStatus({
        kind: 'err',
        text: 'Bu link bu sekmeye ait değil. Doğru platform sekmesini kullanın.',
      });
      haptic('error');
      return;
    }

    setBusy(true);
    progress.value = 0;
    setStatus({ kind: 'idle', text: 'Bağlantı analiz ediliyor...' });
    try {
      const item = await downloadVideo({
        url,
        platform,
        quality,
        cobaltInstance: settings.cobaltInstance,
        cobaltApiKey: settings.cobaltApiKey,
        fallbacks: DEFAULT_INSTANCES,
        onProgress: (r) => {
          progress.value = withTiming(r, { duration: 120 });
          if (r > 0.02) setStatus({ kind: 'idle', text: `İndiriliyor... %${Math.round(r * 100)}` });
        },
      });
      add(item);
      progress.value = withTiming(1, { duration: 150 });
      setStatus({ kind: 'ok', text: 'Video başarıyla indirildi ve uygulamaya kaydedildi.' });
      setLink('');
      haptic('success');
    } catch (err) {
      const msg =
        err instanceof CobaltError
          ? err.message
          : 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
      setStatus({ kind: 'err', text: msg });
      haptic('error');
    } finally {
      setBusy(false);
      setTimeout(() => (progress.value = 0), 600);
    }
  };

  const confirmDelete = (item: DownloadItem) => {
    haptic('medium');
    Alert.alert('Videoyu sil', 'Bu indirilen video kalıcı olarak silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => remove(item.id) },
    ]);
  };

  const statusColor =
    status.kind === 'ok' ? '#34D399' : status.kind === 'err' ? '#F87171' : c.textDim;

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppHeader platform={platform} onVerify={openVerify} />

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.section, { color: c.accent }]}>BAĞLANTIYI YAPIŞTIR</Text>
            <View style={[styles.inputRow, { backgroundColor: c.input, borderColor: c.border }]}>
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder={platform.inputPlaceholder}
                placeholderTextColor={c.textDim}
                style={[styles.input, { color: c.text }]}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
              />
              <PressableScale
                onPress={pasteFromClipboard}
                style={[styles.pasteBtn, { backgroundColor: c.accent }]}
              >
                <Text style={[styles.pasteText, { color: c.onAccent }]}>YAPIŞTIR</Text>
              </PressableScale>
            </View>

            {platform.askQuality ? (
              <View style={styles.qualityWrap}>
                <Text style={[styles.section, { color: c.accent, marginTop: 4 }]}>
                  İNDİRME KALİTESİ
                </Text>
                {QUALITY_OPTIONS.map((q) => {
                  const selected = q.value === quality;
                  return (
                    <PressableScale
                      key={q.value}
                      onPress={() => {
                        haptic('select');
                        setQuality(q.value);
                      }}
                      scaleTo={0.98}
                      style={[
                        styles.qualityRow,
                        {
                          backgroundColor: c.surfaceAlt,
                          borderColor: selected ? c.accent : 'transparent',
                        },
                      ]}
                    >
                      <View style={[styles.qTag, { backgroundColor: selected ? c.accent : c.input }]}>
                        <Text style={[styles.qTagText, { color: selected ? c.onAccent : c.textDim }]}>
                          {q.tag}
                        </Text>
                      </View>
                      <Text style={[styles.qLabel, { color: c.text }]}>{q.label}</Text>
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={selected ? c.accent : c.textDim}
                      />
                    </PressableScale>
                  );
                })}
              </View>
            ) : (
              <View style={styles.autoRow}>
                <Ionicons name="sparkles" size={15} color={c.accent2} />
                <Text style={[styles.autoText, { color: c.textDim }]}>
                  En yüksek kalite otomatik seçilir{platform.cleanWatermark ? ' • filigran/kullanıcı adı temizlenir' : ''}.
                </Text>
              </View>
            )}

            <PressableScale
              onPress={handleDownload}
              disabled={busy}
              style={[styles.downloadBtn, { backgroundColor: c.accent, opacity: busy ? 0.85 : 1 }]}
            >
              <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: c.accent2 }]} />
              <View style={styles.downloadContent}>
                {busy ? (
                  <ActivityIndicator color={c.onAccent} />
                ) : (
                  <Ionicons name="download" size={18} color={c.onAccent} />
                )}
                <Text style={[styles.downloadText, { color: c.onAccent }]}>
                  {busy ? 'İNDİRİLİYOR...' : platform.askQuality ? 'ANALİZ ET VE İNDİR' : 'ŞİMDİ İNDİR'}
                </Text>
              </View>
            </PressableScale>

            {status.text ? (
              <Text style={[styles.status, { color: statusColor }]}>{status.text}</Text>
            ) : null}
          </View>

          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: c.text }]}>İNDİRME GEÇMİŞİ</Text>
            <Text style={[styles.historyCount, { color: c.textDim }]}>{items.length} Video</Text>
          </View>

          <VideoGrid
            items={items}
            onOpen={(item) =>
              router.push({
                pathname: '/player',
                params: { uri: item.fileUri, title: item.filename },
              })
            }
            onLongPress={confirmDelete}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 18 },
  card: { padding: 16, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, gap: 12 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 8 },
  pasteBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  pasteText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  qualityWrap: { gap: 8 },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  qTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  qTagText: { fontSize: 10, fontWeight: '800' },
  qLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  autoText: { fontSize: 12, flex: 1 },
  downloadBtn: {
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    marginTop: 4,
  },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.55 },
  downloadContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  downloadText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },
  status: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  historyCount: { fontSize: 12, fontWeight: '600' },
});
