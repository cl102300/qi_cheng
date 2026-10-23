/**
 * 自动布局选择器
 */

import type { LayoutType } from '../../config/layout.config';
import { ringLayout } from './ringLayout';
import { heartLayout } from './heartLayout';
import { sphereLayout } from './sphereLayout';
import { spiralLayout } from './spiralLayout';
import { welcomeLayout } from './welcomeLayout';
import { singleLayout } from './singleLayout';
import { galaxyLayout } from './galaxyLayout';

export { getAutoLayoutType } from '../../config/layout.config';

export function computeLayout(photos: any[], layoutType: LayoutType) {
  switch (layoutType) {
    case 'welcome':
      return welcomeLayout.compute(photos);
    case 'single':
      return singleLayout.compute(photos);
    case 'ring':
      return ringLayout.compute(photos);
    case 'heart':
      return heartLayout.compute(photos);
    case 'sphere':
      return sphereLayout.compute(photos);
    case 'spiral':
      return spiralLayout.compute(photos);
    case 'galaxy':
      return galaxyLayout.compute(photos);
    default:
      return ringLayout.compute(photos);
  }
}
