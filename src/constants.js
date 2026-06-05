/**
 * 游戏常量配置
 */

// 网格尺寸
export const GRID_SIZE = {
  SMALL: 5,
  MEDIUM: 10,
  LARGE: 15,
}

export const DEFAULT_GRID_SIZE = GRID_SIZE.MEDIUM

// 单元格尺寸（像素）
export const CELL_SIZE = {
  [GRID_SIZE.SMALL]: '40px',
  [GRID_SIZE.MEDIUM]: '32px',
  [GRID_SIZE.LARGE]: '24px',
}

// 提示区尺寸（像素）
export const HINT_AREA_SIZE = {
  [GRID_SIZE.SMALL]: '60px',
  [GRID_SIZE.MEDIUM]: '80px',
  [GRID_SIZE.LARGE]: '100px',
}

// 网格状态
export const CELL_STATE = {
  EMPTY: 0,    // 空
  FILLED: 1,   // 已填充
  MARKED: 2,   // X标记
}

// 操作模式
export const MODE = {
  FILL: 'fill',
  X: 'x',
}

// 历史记录最大步数
export const MAX_HISTORY = 100

// 收藏最大数量
export const MAX_FAVORITES = 100

// 生成谜题最大尝试次数
export const MAX_GENERATE_ATTEMPTS = 50

// 随机网格填充密度
export const GRID_DENSITY = {
  MIN: 0.30,
  MAX: 0.50,
}

// 难度星级阈值
export const STAR_THRESHOLDS = {
  [GRID_SIZE.SMALL]:  [3, 4, 5, 6, 7, 8, 9, 10],
  [GRID_SIZE.MEDIUM]: [7, 9, 11, 13, 15, 17, 20, 24],
  [GRID_SIZE.LARGE]:  [11, 14, 17, 19, 22, 25, 28, 32],
}

// 导出提示显示时长（毫秒）
export const EXPORT_TOAST_DURATION = 2000

// localStorage 键名
export const STORAGE_KEY = {
  FAVORITES: 'nonocross-favorites',
}

// 难度星级列表
export const STAR_RATINGS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

// 鼠标按键
export const MOUSE_BUTTON = {
  LEFT: 0,
  RIGHT: 2,
}
