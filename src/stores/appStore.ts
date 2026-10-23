import { create } from 'zustand';
import type { Photo, LayoutType, AppSettings } from '../types';
import { getAutoLayoutType } from '../config/layout.config';

interface AppState {
  photos: Photo[];
  layout: LayoutType;
  camera: {
    theta: number;
    phi: number;
    distance: number;
  };
  settings: AppSettings;
  selectedPhotoId: string | null;
  isTransitioning: boolean;

  addPhotos: (photos: Photo[]) => void;
  replacePhotos: (photos: Photo[]) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
  setCamera: (camera: Partial<AppState['camera']>) => void;
  resetCamera: () => void;
  toggleAutoRotate: () => void;
  selectPhoto: (id: string | null) => void;
  updatePhotoPosition: (id: string, position: any, scale?: number) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setTransitioning: (flag: boolean) => void;
}

const DEFAULT_CAMERA = { theta: 0, phi: Math.PI / 6, distance: 20 };

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'eternity',
  layout: 'spiral',
  autoRotate: true,
  musicEnabled: false,
  volume: 0.5,
  reduceMotion: false,
  immersiveMode: false,
};

export const useAppStore = create<AppState>((set) => ({
  photos: [],
  layout: getAutoLayoutType(0),
  camera: DEFAULT_CAMERA,
  settings: DEFAULT_SETTINGS,
  selectedPhotoId: null,
  isTransitioning: false,

  addPhotos: (newPhotos) => {
    set((state) => {
      const knownIds = new Set(state.photos.map((photo) => photo.id));
      const photos = [...state.photos, ...newPhotos.filter((photo) => !knownIds.has(photo.id))];
      return {
        photos,
        layout: getAutoLayoutType(photos.length),
      };
    });
  },

  replacePhotos: (photos) => {
    set((state) => ({
      photos,
      selectedPhotoId: photos.some((photo) => photo.id === state.selectedPhotoId)
        ? state.selectedPhotoId
        : null,
      layout: getAutoLayoutType(photos.length),
    }));
  },

  removePhoto: (id) => {
    set((state) => {
      const photos = state.photos.filter((p) => p.id !== id);
      return {
        photos,
        selectedPhotoId: state.selectedPhotoId === id ? null : state.selectedPhotoId,
        layout: getAutoLayoutType(photos.length),
      };
    });
  },

  clearPhotos: () => {
    set((state) => ({
      photos: [],
      selectedPhotoId: null,
      layout: getAutoLayoutType(0),
    }));
  },

  setCamera: (camera) => {
    set((state) => ({ camera: { ...state.camera, ...camera } }));
  },

  resetCamera: () => {
    set({ camera: DEFAULT_CAMERA });
  },

  toggleAutoRotate: () => {
    set((state) => ({ settings: { ...state.settings, autoRotate: !state.settings.autoRotate } }));
  },

  selectPhoto: (id) => {
    set({ selectedPhotoId: id, isTransitioning: id !== null });
  },

  updatePhotoPosition: (id, position, scale) => {
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === id ? { ...p, position, targetPosition: position, scale: scale ?? 1 } : p
      ),
    }));
  },

  updateSettings: (settings) => {
    set((state) => ({ settings: { ...state.settings, ...settings } }));
  },

  setTransitioning: (flag) => {
    set({ isTransitioning: flag });
  },
}));
