/**
 * Akrep Galeri - Çevrimdışı Çeviri ve Seslendirme Modülü
 * Vosk (STT) ve TTS entegrasyonu
 */

import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';

export type SupportedLanguage = 'tr' | 'ku' | 'en' | 'ar';

interface LanguageModel {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  isDownloaded: boolean;
  modelSize: number; // bytes
}

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  confidence: number;
}

interface VoiceSettings {
  language: SupportedLanguage;
  rate: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  volume: number; // 0 - 1
}

// Desteklenen diller
const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageModel> = {
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    isDownloaded: true,
    modelSize: 45 * 1024 * 1024, // 45MB
  },
  ku: {
    code: 'ku',
    name: 'Kurdish',
    nativeName: 'کوردی',
    isDownloaded: false,
    modelSize: 52 * 1024 * 1024, // 52MB
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isDownloaded: true,
    modelSize: 48 * 1024 * 1024, // 48MB
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isDownloaded: false,
    modelSize: 55 * 1024 * 1024, // 55MB
  },
};

const MODELS_DIR = FileSystem.documentDirectory + 'akrep/translation-models/';

/**
 * Dil modellerini başlat
 */
export async function initializeLanguageModels(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(MODELS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Dil modelleri başlatılamadı:', error);
  }
}

/**
 * Dil modelini indir
 */
export async function downloadLanguageModel(
  language: SupportedLanguage,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    const model = SUPPORTED_LANGUAGES[language];
    if (!model) return false;

    // Gerçek uygulamada: Firebase Storage, S3 veya kendi sunucusundan indir
    console.log(`${model.nativeName} dil modeli indiriliyor...`);
    
    // Simüle edilmiş indirme
    for (let i = 0; i <= 100; i += 10) {
      onProgress?.(i / 100);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    SUPPORTED_LANGUAGES[language].isDownloaded = true;
    return true;
  } catch (error) {
    console.error('Dil modeli indirilemedi:', error);
    return false;
  }
}

/**
 * Dil modelini sil
 */
export async function deleteLanguageModel(language: SupportedLanguage): Promise<boolean> {
  try {
    const modelPath = MODELS_DIR + `${language}.model`;
    await FileSystem.deleteAsync(modelPath, { idempotent: true });
    SUPPORTED_LANGUAGES[language].isDownloaded = false;
    return true;
  } catch (error) {
    console.error('Dil modeli silinemedi:', error);
    return false;
  }
}

/**
 * Metin çevirisi (Placeholder - gerçek uygulamada ML Kit kullanılacak)
 */
export async function translateText(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<TranslationResult> {
  try {
    if (!SUPPORTED_LANGUAGES[targetLanguage]?.isDownloaded) {
      throw new Error(`${targetLanguage} dil modeli indirilmemiş`);
    }

    // Gerçek uygulamada: ML Kit Translation API veya TensorFlow Lite modeli kullanılacak
    // Bu örnek basitleştirilmiştir
    const translatedText = await performTranslation(text, sourceLanguage, targetLanguage);

    return {
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.85,
    };
  } catch (error) {
    console.error('Çeviri hatası:', error);
    throw error;
  }
}

/**
 * Sesten metne (STT) - Vosk entegrasyonu
 */
export async function speechToText(
  audioUri: string,
  language: SupportedLanguage
): Promise<string> {
  try {
    if (!SUPPORTED_LANGUAGES[language]?.isDownloaded) {
      throw new Error(`${language} dil modeli indirilmemiş`);
    }

    // Gerçek uygulamada: Vosk kütüphanesi veya Web Speech API kullanılacak
    console.log(`${audioUri} ses dosyası ${language} dilinde metne dönüştürülüyor...`);
    
    // Placeholder
    return 'Ses dosyası metne dönüştürüldü.';
  } catch (error) {
    console.error('STT hatası:', error);
    throw error;
  }
}

/**
 * Metinden sese (TTS) - Seslendirme
 */
export async function textToSpeech(
  text: string,
  settings: Partial<VoiceSettings> = {}
): Promise<void> {
  try {
    const defaultSettings: VoiceSettings = {
      language: 'tr',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      ...settings,
    };

    const languageCode = getExpoLanguageCode(defaultSettings.language);

    await Speech.speak(text, {
      language: languageCode,
      rate: defaultSettings.rate,
      pitch: defaultSettings.pitch,
      volume: defaultSettings.volume,
    });
  } catch (error) {
    console.error('TTS hatası:', error);
    throw error;
  }
}

/**
 * TTS'yi durdur
 */
export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Konuşma durdurma hatası:', error);
  }
}

/**
 * Müzik/Şarkı sözü çevirisi
 */
export async function translateLyrics(
  lyrics: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<string[]> {
  try {
    const lines = lyrics.split('\n');
    const translatedLines: string[] = [];

    for (const line of lines) {
      if (line.trim()) {
        const result = await translateText(line, sourceLanguage, targetLanguage);
        translatedLines.push(result.translatedText);
      } else {
        translatedLines.push('');
      }
    }

    return translatedLines;
  } catch (error) {
    console.error('Şarkı sözü çevirisi hatası:', error);
    throw error;
  }
}

/**
 * Tüm dil modellerini listele
 */
export function getAvailableLanguages(): LanguageModel[] {
  return Object.values(SUPPORTED_LANGUAGES);
}

/**
 * Dil modeli durumunu kontrol et
 */
export function isLanguageDownloaded(language: SupportedLanguage): boolean {
  return SUPPORTED_LANGUAGES[language]?.isDownloaded || false;
}

/**
 * Expo için dil kodunu dönüştür
 */
function getExpoLanguageCode(language: SupportedLanguage): string {
  const languageCodes: Record<SupportedLanguage, string> = {
    tr: 'tr-TR',
    ku: 'ku-IQ',
    en: 'en-US',
    ar: 'ar-SA',
  };
  return languageCodes[language] || 'en-US';
}

/**
 * Basit çeviri fonksiyonu (Placeholder)
 */
async function performTranslation(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<string> {
  // Gerçek uygulamada: ML Kit, Google Translate API veya özel TFLite modeli kullanılacak
  // Bu örnek basitleştirilmiştir
  return `[${targetLanguage}] ${text}`;
}

/**
 * Audio Ducking (Ses Kısma) - Seslendirme sırasında arka plan sesini kıs
 */
export async function setAudioDucking(enabled: boolean): Promise<void> {
  try {
    // Gerçek uygulamada: Android AudioManager API veya iOS AVAudioSession kullanılacak
    console.log(`Audio Ducking ${enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
  } catch (error) {
    console.error('Audio Ducking hatası:', error);
  }
}

/**
 * Çeviri geçmişini kaydet
 */
export async function saveTranslationHistory(
  result: TranslationResult
): Promise<void> {
  try {
    const historyFile = MODELS_DIR + 'translation-history.json';
    let history: TranslationResult[] = [];

    try {
      const existing = await FileSystem.readAsStringAsync(historyFile);
      history = JSON.parse(existing);
    } catch {
      history = [];
    }

    history.push(result);
    
    // Son 100 çeviriyi tut
    if (history.length > 100) {
      history = history.slice(-100);
    }

    await FileSystem.writeAsStringAsync(historyFile, JSON.stringify(history));
  } catch (error) {
    console.error('Çeviri geçmişi kaydedilemedi:', error);
  }
}
