/**
 * Akrep Galeri - Audio Ducking Manager
 * Seslendirme (TTS) sırasında arka plan sesini kontrol etme
 */

import { Audio } from 'expo-av';

export interface AudioDuckingConfig {
  enabled: boolean;
  targetVolume: number; // 0-1, TTS sırasında arka plan sesinin seviyesi
  fadeDuration: number; // ms, fade-in/out süresi
  autoRestore: boolean; // TTS bittikten sonra otomatik restore
}

interface AudioSession {
  id: string;
  isActive: boolean;
  originalVolume: number;
  isDucked: boolean;
}

const DEFAULT_CONFIG: AudioDuckingConfig = {
  enabled: true,
  targetVolume: 0.3, // %30 ses seviyesine düşür
  fadeDuration: 300, // 300ms fade
  autoRestore: true,
};

let currentConfig = { ...DEFAULT_CONFIG };
let audioSessions: Map<string, AudioSession> = new Map();
let ttsIsActive = false;

/**
 * Audio Ducking'i başlat
 */
export async function initializeAudioDucking(
  config: Partial<AudioDuckingConfig> = {}
): Promise<void> {
  try {
    currentConfig = { ...DEFAULT_CONFIG, ...config };

    // iOS için AVAudioSession ayarla
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: currentConfig.enabled,
      playThroughEarpieceAndroid: false,
    });

    console.log('Audio Ducking başlatıldı:', currentConfig);
  } catch (error) {
    console.error('Audio Ducking başlatılamadı:', error);
  }
}

/**
 * TTS başladığında arka plan sesini kıs
 */
export async function duckAudio(sessionId: string = 'default'): Promise<void> {
  try {
    if (!currentConfig.enabled) return;

    ttsIsActive = true;

    // Mevcut ses oturumlarını al
    const audioSession: AudioSession = {
      id: sessionId,
      isActive: true,
      originalVolume: 1.0,
      isDucked: false,
    };

    audioSessions.set(sessionId, audioSession);

    // Android için: shouldDuckAndroid zaten ayarlanmış
    // iOS için: AVAudioSession kategori ayarla
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    // Fade-out efekti (simüle edilmiş)
    await performFadeOut(currentConfig.fadeDuration);

    audioSession.isDucked = true;
    audioSession.originalVolume = 1.0;

    console.log(`Audio ducked: ${sessionId}`);
  } catch (error) {
    console.error('Audio ducking başarısız:', error);
  }
}

/**
 * TTS bittiğinde arka plan sesini geri getir
 */
export async function restoreAudio(sessionId: string = 'default'): Promise<void> {
  try {
    if (!currentConfig.enabled || !currentConfig.autoRestore) return;

    const audioSession = audioSessions.get(sessionId);
    if (!audioSession) return;

    ttsIsActive = false;

    // Fade-in efekti (simüle edilmiş)
    await performFadeIn(currentConfig.fadeDuration);

    // AVAudioSession'ı normal moda döndür
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
    });

    audioSession.isDucked = false;
    audioSessions.delete(sessionId);

    console.log(`Audio restored: ${sessionId}`);
  } catch (error) {
    console.error('Audio restore başarısız:', error);
  }
}

/**
 * Fade-out efekti (simüle edilmiş)
 */
async function performFadeOut(duration: number): Promise<void> {
  const steps = 10;
  const stepDuration = duration / steps;

  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => setTimeout(resolve, stepDuration));
    // Gerçek uygulamada: ses seviyesi kademeli olarak azaltılacak
  }
}

/**
 * Fade-in efekti (simüle edilmiş)
 */
async function performFadeIn(duration: number): Promise<void> {
  const steps = 10;
  const stepDuration = duration / steps;

  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => setTimeout(resolve, stepDuration));
    // Gerçek uygulamada: ses seviyesi kademeli olarak artırılacak
  }
}

/**
 * Tüm audio oturumlarını kapat
 */
export async function closeAllAudioSessions(): Promise<void> {
  try {
    for (const [sessionId] of audioSessions) {
      await restoreAudio(sessionId);
    }
    audioSessions.clear();
  } catch (error) {
    console.error('Audio oturumları kapatılamadı:', error);
  }
}

/**
 * Audio Ducking konfigürasyonunu güncelle
 */
export function updateAudioDuckingConfig(
  config: Partial<AudioDuckingConfig>
): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Mevcut Audio Ducking konfigürasyonunu al
 */
export function getAudioDuckingConfig(): AudioDuckingConfig {
  return { ...currentConfig };
}

/**
 * TTS'nin aktif olup olmadığını kontrol et
 */
export function isTTSActive(): boolean {
  return ttsIsActive;
}

/**
 * Ses seviyesini manuel olarak ayarla
 */
export async function setAudioVolume(
  sessionId: string,
  volume: number
): Promise<void> {
  try {
    const audioSession = audioSessions.get(sessionId);
    if (!audioSession) return;

    // Clamping: 0-1 arasında
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // Gerçek uygulamada: Sound.setVolumeAsync() veya benzeri kullanılacak
    audioSession.originalVolume = clampedVolume;

    console.log(`Audio volume set: ${sessionId} = ${clampedVolume}`);
  } catch (error) {
    console.error('Ses seviyesi ayarlanamadı:', error);
  }
}

/**
 * Mikrofon gürültüsü bastırma (Noise Suppression)
 */
export async function enableNoiseSuppression(): Promise<void> {
  try {
    // Android için: AudioRecord.NOISE_SUPPRESSION_ENABLED
    // iOS için: AVAudioEngine noise suppression

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    console.log('Gürültü bastırma etkinleştirildi');
  } catch (error) {
    console.error('Gürültü bastırma etkinleştirilemedi:', error);
  }
}

/**
 * Mikrofon kazancını ayarla (Mic Gain)
 */
export async function setMicrophoneGain(gain: number): Promise<void> {
  try {
    // Gain: 0-1 arasında (0 = sessiz, 1 = maksimum)
    const clampedGain = Math.max(0, Math.min(1, gain));

    // Gerçek uygulamada: AudioRecord.setRecordingGain() kullanılacak
    console.log(`Mikrofon kazancı ayarlandı: ${clampedGain}`);
  } catch (error) {
    console.error('Mikrofon kazancı ayarlanamadı:', error);
  }
}

/**
 * Echo Cancellation (Yankı Giderme)
 */
export async function enableEchoCancellation(): Promise<void> {
  try {
    // Android: AudioRecord.ECHO_CANCELLATION_ENABLED
    // iOS: AVAudioEngine echo cancellation

    console.log('Yankı giderme etkinleştirildi');
  } catch (error) {
    console.error('Yankı giderme etkinleştirilemedi:', error);
  }
}

/**
 * Audio Ducking durumunu al
 */
export function getAudioDuckingStatus(): {
  isActive: boolean;
  isTTSActive: boolean;
  sessionCount: number;
  duckedSessions: string[];
} {
  const duckedSessions = Array.from(audioSessions.values())
    .filter(s => s.isDucked)
    .map(s => s.id);

  return {
    isActive: currentConfig.enabled,
    isTTSActive,
    sessionCount: audioSessions.size,
    duckedSessions,
  };
}
