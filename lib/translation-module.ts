/**
 * Akrep Galeri - Gelişmiş Çevrimdışı Video ve Müzik Çeviri Modülü
 * Türkçe, Kürtçe, İngilizce ve Arapça dillerini destekler
 */

import * as Speech from 'expo-speech';

export type SupportedLanguage = 'tr' | 'ku' | 'en' | 'ar';

export interface TranslationConfig {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  includeSubtitles: boolean;
  autoPlayTTS: boolean;
}

export interface TranslatedContent {
  original: string;
  translated: string;
  language: SupportedLanguage;
  timestamp?: number;
}

/**
 * Desteklenen dillerin listesi
 */
export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  tr: 'Türkçe',
  ku: 'Kürtçe',
  en: 'İngilizce',
  ar: 'Arapça',
};

/**
 * Basit çeviri simülasyonu (gerçek uygulamada ML Kit kullanılacak)
 */
export async function translateText(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<string> {
  try {
    // Gerçek uygulamada burada ML Kit veya yerel model kullanılacak
    // Şimdilik placeholder dönüş
    console.log(`Çeviri: ${text} (${sourceLanguage} -> ${targetLanguage})`);

    // Simülasyon: Basit yer tutucu
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    // Gerçek çeviriler için backend entegrasyonu gerekli
    return `[${targetLanguage.toUpperCase()}] ${text}`;
  } catch (error) {
    console.error('Çeviri hatası:', error);
    throw error;
  }
}

/**
 * Metni seslendirme (TTS)
 */
export async function speakText(
  text: string,
  language: SupportedLanguage = 'tr'
): Promise<void> {
  try {
    // Dil kodlarını Expo Speech formatına çevir
    const languageMap: Record<SupportedLanguage, string> = {
      tr: 'tr',
      ku: 'ku', // Kürtçe (Sorani)
      en: 'en',
      ar: 'ar',
    };

    await Speech.speak(text, {
      language: languageMap[language],
      pitch: 1.0,
      rate: 1.0,
    });
  } catch (error) {
    console.error('Seslendirme hatası:', error);
    throw error;
  }
}

/**
 * Seslendirmeyi durdur
 */
export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Seslendirme durdurma hatası:', error);
  }
}

/**
 * Video çevirisi işlemi
 */
export async function translateVideoContent(
  videoText: string,
  config: TranslationConfig
): Promise<TranslatedContent> {
  try {
    const translated = await translateText(
      videoText,
      config.sourceLanguage,
      config.targetLanguage
    );

    const result: TranslatedContent = {
      original: videoText,
      translated,
      language: config.targetLanguage,
      timestamp: Date.now(),
    };

    // Otomatik TTS oynatma
    if (config.autoPlayTTS) {
      await speakText(translated, config.targetLanguage);
    }

    return result;
  } catch (error) {
    console.error('Video çevirisi hatası:', error);
    throw error;
  }
}

/**
 * Müzik/Şarkı sözü çevirisi
 */
export async function translateLyrics(
  lyrics: string[],
  config: TranslationConfig
): Promise<TranslatedContent[]> {
  try {
    const translatedLyrics = await Promise.all(
      lyrics.map((line) =>
        translateText(line, config.sourceLanguage, config.targetLanguage)
      )
    );

    return translatedLyrics.map((translated, index) => ({
      original: lyrics[index],
      translated,
      language: config.targetLanguage,
      timestamp: Date.now() + index * 1000,
    }));
  } catch (error) {
    console.error('Şarkı sözü çevirisi hatası:', error);
    throw error;
  }
}

/**
 * Audio Ducking - Arka plan sesini kısmak
 */
export async function setAudioDucking(
  enabled: boolean,
  volume: number = 0.3
): Promise<void> {
  try {
    // Expo SDK'da doğrudan audio ducking desteği sınırlı
    // Gerçek uygulamada native module gerekli
    console.log(`Audio Ducking: ${enabled ? 'Açık' : 'Kapalı'} (Ses: ${volume})`);
  } catch (error) {
    console.error('Audio Ducking hatası:', error);
  }
}

/**
 * Çeviri modeli indirme yöneticisi
 */
export interface TranslationModel {
  language: SupportedLanguage;
  size: number; // MB cinsinden
  downloaded: boolean;
  lastUpdated?: number;
}

export async function getAvailableModels(): Promise<TranslationModel[]> {
  try {
    // Simülasyon: Mevcut modeller
    return [
      {
        language: 'tr',
        size: 45,
        downloaded: true,
        lastUpdated: Date.now(),
      },
      {
        language: 'en',
        size: 50,
        downloaded: true,
        lastUpdated: Date.now(),
      },
      {
        language: 'ku',
        size: 60,
        downloaded: false,
      },
      {
        language: 'ar',
        size: 55,
        downloaded: false,
      },
    ];
  } catch (error) {
    console.error('Modeller alınamadı:', error);
    return [];
  }
}

/**
 * Çeviri modeli indir
 */
export async function downloadTranslationModel(
  language: SupportedLanguage
): Promise<boolean> {
  try {
    console.log(`${language} çeviri modeli indiriliyor...`);
    // Gerçek uygulamada Firebase Storage veya CDN'den indirilecek
    return true;
  } catch (error) {
    console.error('Model indirme hatası:', error);
    return false;
  }
}

/**
 * Çeviri modeli sil
 */
export async function deleteTranslationModel(
  language: SupportedLanguage
): Promise<boolean> {
  try {
    console.log(`${language} çeviri modeli siliniyor...`);
    return true;
  } catch (error) {
    console.error('Model silme hatası:', error);
    return false;
  }
}
