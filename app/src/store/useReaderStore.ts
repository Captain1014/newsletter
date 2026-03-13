import { create } from "zustand";
import { Newsletter } from "@/types";

interface ReaderState {
  // Newsletter list
  newsletters: Newsletter[];
  setNewsletters: (newsletters: Newsletter[]) => void;

  // Current reader
  currentNewsletter: Newsletter | null;
  currentIndex: number;
  setCurrentNewsletter: (newsletter: Newsletter) => void;
  setCurrentIndex: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;

  // TTS
  isPlaying: boolean;
  highlightRange: { start: number; end: number } | null;
  setIsPlaying: (playing: boolean) => void;
  setHighlightRange: (range: { start: number; end: number } | null) => void;

  // AI Explanation
  explanation: string | null;
  isLoadingExplanation: boolean;
  showExplanation: boolean;
  setExplanation: (text: string | null) => void;
  setIsLoadingExplanation: (loading: boolean) => void;
  setShowExplanation: (show: boolean) => void;

  // Podcast mode
  isPodcastMode: boolean;
  podcastSegments: string[];
  podcastCurrentSegment: number;
  podcastLoading: boolean;
  setIsPodcastMode: (mode: boolean) => void;
  setPodcastSegments: (segments: string[]) => void;
  setPodcastCurrentSegment: (index: number) => void;
  setPodcastLoading: (loading: boolean) => void;
  resetPodcast: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  newsletters: [],
  setNewsletters: (newsletters) => set({ newsletters }),

  currentNewsletter: null,
  currentIndex: 0,
  setCurrentNewsletter: (newsletter) =>
    set({ currentNewsletter: newsletter, currentIndex: 0, explanation: null, showExplanation: false }),
  setCurrentIndex: (index) =>
    set({ currentIndex: index, explanation: null, showExplanation: false }),
  goNext: () => {
    const { currentIndex, currentNewsletter } = get();
    if (currentNewsletter && currentIndex < currentNewsletter.paragraphs.length) {
      set({ currentIndex: currentIndex + 1, explanation: null, showExplanation: false });
    }
  },
  goPrev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, explanation: null, showExplanation: false });
    }
  },

  isPlaying: false,
  highlightRange: null,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setHighlightRange: (range) => set({ highlightRange: range }),

  explanation: null,
  isLoadingExplanation: false,
  showExplanation: false,
  setExplanation: (text) => set({ explanation: text }),
  setIsLoadingExplanation: (loading) => set({ isLoadingExplanation: loading }),
  setShowExplanation: (show) => set({ showExplanation: show }),

  isPodcastMode: false,
  podcastSegments: [],
  podcastCurrentSegment: -1,
  podcastLoading: false,
  setIsPodcastMode: (mode) => set({ isPodcastMode: mode }),
  setPodcastSegments: (segments) => set({ podcastSegments: segments }),
  setPodcastCurrentSegment: (index) => set({ podcastCurrentSegment: index }),
  setPodcastLoading: (loading) => set({ podcastLoading: loading }),
  resetPodcast: () =>
    set({
      isPodcastMode: false,
      podcastSegments: [],
      podcastCurrentSegment: -1,
      podcastLoading: false,
    }),
}));
