# Nonocross

一个基于浏览器的 [Nonogram](https://en.wikipedia.org/wiki/Nonogram)（数织）解谜游戏。

在线体验：[https://nono.feizao.org](https://nono.feizao.org)

## 功能

- **三种尺寸**：5×5、10×10、15×15
- **难度分级**：1-5 星，基于逻辑求解步数自动评定
- **谜题库**：预置 500+  handcrafted 谜题
- **随机生成**：实时生成逻辑可解、解唯一的随机谜题
- **进度保存**：localStorage 自动保存收藏和未完成进度
- **导入/导出**：通过短编码分享谜题
- **触摸支持**：移动端单指/双指操作
- **PWA**：可安装到桌面，支持离线游玩

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

# 生产构建
npm run build

## 项目结构

```
src/
  composables/
    useGame.js      # 游戏核心逻辑
    useTimer.js     # 计时器
    useFavorites.js # 收藏管理
  components/
    GameBoard.vue   # 棋盘与提示区
    GameControls.vue # 操作按钮
    PuzzleSelector.vue # 尺寸/难度选择
    FavoritesPanel.vue # 收藏列表
    ImportModal.vue  # 导入弹窗
  solver.js         # Nonogram 求解与生成引擎
  generator.js      # Web Worker 封装
  constants.js      # 游戏常量
public/
  puzzles.json      # 预置谜题库
```

## License

MIT
