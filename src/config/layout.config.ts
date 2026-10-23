/**
 * 布局配置：数量阈值、各布局半径/尺寸/螺旋圈数。
 */

export const layoutConfig = {
  // 自动布局规则
  auto: {
    enabled: true,
    thresholds: {
      ringMax: 20,
      heartMax: 99,
      sphereMax: 499,
    },
  },

  // 三维圆环
  ring: {
    radius: 6,
    photoScale: 1,
    verticalOffset: 0,
    cardWidth: 1.8,
    cardHeight: 1.2,
    tilt: 0.1,
  },

  // 爱心曲面
  heart: {
    width: 8,
    height: 7,
    depth: 2.5,
    thickness: 1.2,
    cardWidth: 1.5,
    cardHeight: 1.0,
    samplesU: 20,
    samplesV: 12,
  },

  // 球体布局
  sphere: {
    radius: 8,
    distribution: 'fibonacci' as const,
    cardWidth: 1.4,
    cardHeight: 1.0,
    avoidPoles: true,
  },

  // 螺旋星系
  spiral: {
    radius: 10,
    turns: 4,
    verticalSpacing: 0.8,
    arms: 3,
    cardWidth: 1.5,
    cardHeight: 1.0,
  },

  // 自适应星系
  galaxy: {
    layerCount: 5,
    radius: 12,
    turns: 2.5,
    arms: 3,
    layerSpacing: 1.2,
    cardWidth: 1.2,
    cardHeight: 0.8,
  },

  // 欢迎场景
  welcome: {
    heartSize: 2.5,
    heartColor: 0xff3d6e,
  },

  // 单张照片
  single: {
    cardWidth: 2.8,
    cardHeight: 2.0,
    floatAmplitude: 0.4,
    floatSpeed: 0.5,
  },

  // 布局过渡
  transition: {
    duration: 1.0,
    ease: 'easeInOut' as const,
  },
} as const;

export type LayoutConfig = typeof layoutConfig;

export type LayoutType =
  | 'welcome'
  | 'single'
  | 'ring'
  | 'heart'
  | 'sphere'
  | 'spiral'
  | 'galaxy';

/** 根据照片数量选择默认布局。 */
export function getAutoLayoutType(photoCount: number): LayoutType {
  const { thresholds } = layoutConfig.auto;
  if (photoCount <= thresholds.ringMax) return 'ring';
  if (photoCount <= thresholds.heartMax) return 'heart';
  if (photoCount <= thresholds.sphereMax) return 'sphere';
  return 'galaxy';
}
