/**
 * 照片数据类型定义
 */

export interface PhotoMeta {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  thumbnail?: string;
  dataUrl?: string;
  image?: Blob;
  size: number;
  createdAt: number;
}

export interface PhotoPosition {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface Photo extends PhotoMeta {
  position: PhotoPosition;
  targetPosition: PhotoPosition;
  isSelected: boolean;
  isFocused: boolean;
  isLoading: boolean;
  opacity: number;
  scale: number;
}

export type LayoutType =
  | 'welcome'
  | 'single'
  | 'ring'
  | 'heart'
  | 'sphere'
  | 'spiral'
  | 'galaxy';

export interface CameraState {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  distance: number;
}

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  theme?: string;
}

export interface AppSettings {
  theme: string;
  layout: LayoutType;
  autoRotate: boolean;
  musicEnabled: boolean;
  volume: number;
  reduceMotion: boolean;
  immersiveMode: boolean;
}
