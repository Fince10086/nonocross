# Nonocross

一个基于浏览器的 [Nonogram](https://en.wikipedia.org/wiki/Nonogram)（数织）解谜游戏。

在线体验：[https://nono.feizao.org](https://nono.feizao.org)

## 功能

### 双模式

- **关卡模式**：2700 道 handcrafted 谜题，完成一关解锁后续 10 关
- **自由模式**：实时生成逻辑可解、解唯一的随机谜题（5×5 / 10×10 / 15×15）

### 辅助功能

在设置（⚙）中可开启：

- **自动标记 X**：行/列完成时自动将剩余空格标记为 X
- **冲突检测**：存在矛盾的行/列提示变红
- **可推导提示**：还能逻辑推导出新标记的行/列提示变蓝

> 注：除自动标记 X 外，其他辅助功能会在完成记录后标注 *（关卡模式下）

### 其他特性

- **难度分级**：1-5 星，基于逻辑求解步数自动评定
- **谜题库**：每个尺寸每个难度各 100 道预置谜题（共 2700 道）
- **收藏系统**（仅自由模式）：保存喜欢的谜题和进度到 localStorage
- **导入/导出**（仅自由模式）：通过紧凑编码分享谜题
- **键盘支持**：完整的键盘操作（方向键、WASD、空格等）
- **触摸支持**：移动端单指/双指操作
- **多语言**：简体中文 / English / 日本语
- **PWA**：可安装到桌面，支持离线游玩

## 键盘快捷键

### 移动与操作

| 按键 | 功能 |
|------|------|
| `↑ ↓ ← →` / `W A S D` | 移动选中格子 |
| `空格` | 按当前模式填充/清空；暂停时恢复游戏 |
| `F` | 直接填充（已填充则清空）|
| `X` | 直接标记 X（已标记则清空）|

### 游戏控制

| 按键 | 功能 |
|------|------|
| `P` | 暂停/恢复 |
| `Ctrl+Z` / `Cmd+Z` | 撤销 |
| `R` | 重置 |
| `Ctrl` / `Cmd` | 按住临时切换模式（填充 ↔ X）|

## 技术栈

- Vue 3 (Composition API)
- Vite
- 纯 JavaScript 求解器（支持 Web Worker）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建（自动生成关卡配置）
npm run build
```

## 项目结构

```
src/
  composables/
    useGame.js         # 游戏核心逻辑
    useTimer.js        # 计时器
    useFavorites.js    # 收藏管理
    useLevels.js       # 关卡系统
  components/
    GameBoard.vue      # 棋盘与提示区
    GameControls.vue   # 操作按钮
    PuzzleSelector.vue # 尺寸选择
    LevelSelect.vue    # 关卡选择
    FavoritesPanel.vue # 收藏列表
    ImportModal.vue    # 导入弹窗
    AssistModal.vue    # 辅助设置
  solver.js            # Nonogram 求解与生成引擎
  generator.js         # Web Worker 封装
  features/assist.js   # 辅助功能
  storage.js           # localStorage 封装
  i18n.js              # 国际化
  constants.js         # 游戏常量
public/
  puzzles-5.json       # 5×5 预置谜题库
  puzzles-10.json      # 10×10 预置谜题库
  puzzles-15.json      # 15×15 预置谜题库
  levels.json          # 关卡配置（构建时生成）
```

## License

MIT
