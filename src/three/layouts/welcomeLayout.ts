/**
 * 欢迎场景布局
 */

import type { LayoutResult } from './types';
import type { Photo } from '../../types';

export const welcomeLayout = {
  compute(_photos: Photo[]): LayoutResult {
    return { positions: new Map() };
  },
};