/**
 * 单张照片布局
 */

import type { LayoutResult } from './types';
import type { Photo } from '../../types';

export const singleLayout = {
  compute(photos: Photo[]): LayoutResult {
    const positions = new Map<string, { x: number; y: number; z: number; rx: number; ry: number; rz: number }>();
    photos.forEach((photo) => {
      positions.set(photo.id, { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 });
    });
    return { positions };
  },
};