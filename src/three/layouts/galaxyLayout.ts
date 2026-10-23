/** 多层星系布局：每层由多条螺旋臂组成。 */

import type { Photo } from '../../types';
import { layoutConfig } from '../../config/layout.config';
import type { LayoutResult } from './types';

export const galaxyLayout = {
  compute(photos: Photo[]): LayoutResult {
    const count = photos.length;
    if (count === 0) return { positions: new Map() };

    const { radius, turns, arms, layerCount, layerSpacing } = layoutConfig.galaxy;
    const layers = Math.min(layerCount, count);
    const positions = new Map<string, { x: number; y: number; z: number; rx: number; ry: number; rz: number }>();
    const scales = new Map<string, number>();

    photos.forEach((photo, index) => {
      const layer = index % layers;
      const layerIndex = Math.floor(index / layers);
      const layerSize = Math.ceil((count - layer) / layers);
      const progress = layerIndex / Math.max(layerSize - 1, 1);
      const arm = layerIndex % arms;
      const armOffset = (arm / arms) * Math.PI * 2;
      const angle = progress * turns * Math.PI * 2 + armOffset + layer * 0.16;
      const distance = radius * Math.sqrt(progress);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = (layer - (layers - 1) / 2) * layerSpacing + Math.sin(angle * 1.5) * 0.22;

      positions.set(photo.id, {
        x,
        y,
        z,
        rx: 0,
        ry: Math.atan2(x, z),
        rz: 0,
      });
      scales.set(photo.id, 0.78 + 0.22 * (1 - progress));
    });

    return { positions, scales };
  },
};
