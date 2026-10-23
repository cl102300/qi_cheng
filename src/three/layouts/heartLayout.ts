/**
 * 爱心曲面布局算法
 */

import type { LayoutResult } from './types';
import type { Photo } from '../../types';
import { layoutConfig } from '../../config/layout.config';

function heartParametric(t: number, u: number) {
  const { width, height, depth, thickness } = layoutConfig.heart;
  const x = 16 * Math.pow(Math.sin(t), 3);
  const z = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  const scale = (width / 20) * (1 - u * 0.3);
  const y = (height / 20) * (x * Math.sin(t) * 0.5 + z * Math.cos(t) * 0.3) * (1 - u * 0.5);
  const xFinal = (width / 20) * x * (1 - u * 0.2);
  const zFinal = (depth / 20) * z + (thickness / 2) * Math.sin(u * Math.PI);
  return { x: xFinal, y, z: zFinal };
}

export const heartLayout = {
  compute(photos: Photo[]): LayoutResult {
    const count = photos.length;
    if (count === 0) return { positions: new Map() };

    const { samplesU, samplesV } = layoutConfig.heart;
    const positions = new Map<string, { x: number; y: number; z: number; rx: number; ry: number; rz: number }>();

    photos.forEach((photo, index) => {
      const vRatio = index / Math.max(count - 1, 1);
      const uIndex = Math.floor(vRatio * samplesU);
      const vIndex = Math.floor((vRatio * samplesV) % samplesV);
      const u = uIndex / samplesU;
      const v = vIndex / samplesV;

      const t = v * 2 * Math.PI;
      const pos = heartParametric(t, u);
      const dt = 0.01;
      const posNext = heartParametric(t + dt, u);
      const tangent = {
        x: posNext.x - pos.x,
        y: posNext.y - pos.y,
        z: posNext.z - pos.z,
      };
      const ry = Math.atan2(tangent.x, tangent.z);

      positions.set(photo.id, { x: pos.x, y: pos.y, z: pos.z, rx: 0, ry, rz: 0 });
    });

    return { positions };
  },
};