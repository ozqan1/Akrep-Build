import { create } from 'zustand';
import {
  downloadLanguageModel,
  deleteLanguageModel,
  translateText,
  textToSpeech,
  stopSpeech,
  getAvailableLanguages,
  isLanguageDownloaded,
  SupportedLanguage,
  LanguageModel,
  TranslationResult,
  saveTranslationHistory,
} from '@/lib/offline-translation';

interface TranslationState {
  availableLanguages: LanguageModel[];
  selectedSourceLanguage: SupportedLanguage;
  selectedTargetLanguage: SupportedLanguage;
  translationHistory: TranslationResult[];
  isTranslating: boolean;
  isSpeaking: boolean;
  downloadingLanguage: SupportedLanguage | null;
  downloadProgress: number;
  error: string | null;

  // Actions
  initializeLanguages: () => void;
  downloadLanguage: (language: SupportedLanguage) => Promise<void>;
  deleteLanguage: (language: SupportedLanguage) => Promise<void>;
  setSourceLanguage: (language: SupportedLanguage) => void;
  setTargetLanguage: (language: SupportedLanguage) => void;
  translate: (text: string) => Promise<TranslationResult | null>;
  speak: (text: string, language?: SupportedLanguage) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  clearHistory: () => void;
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  availableLanguages: [],
  selectedSourceLanguage: 'tr',
  selectedTargetLanguage: 'en',
  translationHistory: [],
  isTranslating: false,
  isSpeaking: false,
  downloadingLanguage: null,
  downloadProgress: 0,
  error: null,

  initializeLanguages: () => {
    const languages = getAvailableLanguages();
    set({ availableLanguages: languages });
  },

  downloadLanguage: async (language: SupportedLanguage) => {
    try {
      set({ downloadingLanguage: language, downloadProgress: 0, error: null });

      const success = await downloadLanguageModel(language, (progress) => {
        set({ downloadProgress: progress });
      });

      if (success) {
        set(state => ({
          availableLanguages: state.availableLanguages.map(l =>
            l.code === language ? { ...l, isDownloaded: true } : l
          ),
          downloadingLanguage: null,
          downloadProgress: 0,
        }));
      } else {
        set({
          error: `${language} dil modeli indirilemedi`,
          downloadingLanguage: null,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'İndirme hatası';
      set({ error: errorMsg, downloadingLanguage: null });
    }
  },

  deleteLanguage: async (language: SupportedLanguage) => {
    try {
      set({ error: null });

      const success = await deleteLanguageModel(language);

      if (success) {
        set(state => ({
          availableLanguages: state.availableLanguages.map(l =>
            l.code === language ? { ...l, isDownloaded: false } : l
          ),
        }));
      } else {
        set({ error: `${language} dil modeli silinemedi` });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Silme hatası';
      set({ error: errorMsg });
    }
  },

  setSourceLanguage: (language: SupportedLanguage) => {
    set({ selectedSourceLanguage: language });
  },

  setTargetLanguage: (language: SupportedLanguage) => {
    set({ selectedTargetLanguage: language });
  },

  translate: async (text: string) => {
    try {
      set({ isTranslating: true, error: null });

      const { selectedSourceLanguage, selectedTargetLanguage } = get();

      const result = await translateText(text, selectedSourceLanguage, selectedTargetLanguage);

      // Geçmişe ekle
      set(state => ({
        translationHistory: [result, ...state.translationHistory].slice(0, 50),
      }));

      // Geçmişi kaydet
      await saveTranslationHistory(result);

      set({ isTranslating: false });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Çeviri hatası';
      set({ error: errorMsg, isTranslating: false });
      return null;
    }
  },

  speak: async (text: string, language?: SupportedLanguage) => {
    try {
      set({ isSpeaking: true, error: null });

      const targetLanguage = language || get().selectedTargetLanguage;

      await textToSpeech(text, {
        language: targetLanguage,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      });

      set({ isSpeaking: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Konuşma hatası';
      set({ error: errorMsg, isSpeaking: false });
    }
  },

  stopSpeaking: async () => {
    try {
      await stopSpeech();
      set({ isSpeaking: false });
    } catch (error) {
      console.error('Konuşma durdurma hatası:', error);
    }
  },

  clearHistory: () => {
    set({ translationHistory: [] });
  },
}));
