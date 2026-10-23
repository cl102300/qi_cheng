/**
 * 螺旋星系布局算法
 */

import type { LayoutResult } from './types';
import type { Photo } from '../../types';
import { layoutConfig } from '../../config/layout.config';

export const spiralLayout = {
  compute(photos: Photo[]): LayoutResult {
    const count = photos.length;
    if (count === 0) return { positions: new Map() };

    const { radius, turns, verticalSpacing, arms } = layoutConfig.spiral;
    const positions = new Map<string, { x: number; y: number; z: number; rx: number; ry: number; rz: number }>();

    photos.forEach((photo, index) => {
      const armIndex = index % arms;
      const armOffset = (armIndex / arms) * 2 * Math.PI;
      const progress = index / Math.max(count - 1, 1);

      const angle = progress * turns * 2 * Math.PI + armOffset;
      const r = radius * Math.pow(progress, 0.5);

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (progress - 0.5) * verticalSpacing * turns * 1.5;

      const ry = -angle + Math.PI / 2;

      positions.set(photo.id, { x, y, z, rx: 0, ry, rz: 0 });
    });

    return { positions };
  },
};