/**
 * 布局类型定义
 */

export interface LayoutResult {
  positions: Map<string, { x: number; y: number; z: number; rx: number; ry: number; rz: number }>;
  scales?: Map<string, number>;
}

export interface LayoutAlgorithm {
  compute(photos: any[]): LayoutResult;
}
