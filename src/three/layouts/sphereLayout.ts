/**
 * 球体布局算法
 */

import type { LayoutResult } from './types';
import type { Photo } from '../../types';
import { layoutConfig } from '../../config/layout.config';

export const sphereLayout = {
  compute(photos: Photo[]): LayoutResult {
    const count = photos.length;
    if (count === 0) return { positions: new Map() };

    const { radius } = layoutConfig.sphere;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const positions = new Map<string, { x: number; y: number; z: number; rx: number; ry: number; rz: number }>();

    photos.forEach((photo, index) => {
      const y = 1 - (index / (count - 1 || 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * index;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const posX = x * radius;
      const posY = y * radius;
      const posZ = z * radius;

      const ry = Math.atan2(posX, posZ);

      positions.set(photo.id, { x: posX, y: posY, z: posZ, rx: 0, ry, rz: 0 });
    });

    return { positions };
  },
};