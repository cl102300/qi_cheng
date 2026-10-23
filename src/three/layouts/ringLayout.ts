/**
 * 三维圆环布局算法
 */

import type { LayoutResult } from './types';
import type { Photo } from '../../types';
import { layoutConfig } from '../../config/layout.config';

export const ringLayout = {
  compute(photos: Photo[]): LayoutResult {
    const count = photos.length;
    if (count === 0) return { positions: new Map() };

    const { radius, tilt } = layoutConfig.ring;
    const angleStep = (2 * Math.PI) / count;
    const positions = new Map<string, { x: number; y: number; z: number; rx: number; ry: number; rz: number }>();

    photos.forEach((photo, index) => {
      const angle = index * angleStep;
      // 单张照片置于中心，避免环形布局下落在视野侧面。
      const x = count === 1 ? 0 : Math.cos(angle) * radius;
      const z = count === 1 ? 0 : Math.sin(angle) * radius;
      const y = count === 1 ? 0 : Math.sin(angle * 2) * 0.5;
      const ry = count === 1 ? 0 : -angle + Math.PI / 2;
      positions.set(photo.id, { x, y, z, rx: tilt, ry, rz: 0 });
    });

    return { positions };
  },
};
