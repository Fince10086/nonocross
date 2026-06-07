/**
 * 国际化翻译模块
 * 支持英语、中文、日语
 */
import { ref } from 'vue'

export const LANGUAGES = ['en', 'zh', 'ja']

export const LANGUAGE_LABELS = {
  en: 'En',
  zh: '中',
  ja: '日',
}

const TRANSLATIONS = {
  en: {
    pause: 'Pause',
    resume: 'Resume',
    undo: 'Undo',
    restart: 'Restart',
    newRandom: 'New Random',
    generating: 'Generating...',
    import: 'Import',
    export: 'Export',
    save: 'Save',
    update: 'Update',
    delete: 'Delete',
    fill: 'Fill',
    markX: 'X',
    paused: 'PAUSED',
    completed: 'Completed in {time}',
    importPuzzle: 'Import Puzzle',
    pasteCode: 'Paste the puzzle code below:',
    cancel: 'Cancel',
    favorites: 'Favorites',
    completedShort: 'Completed',
    inProgress: 'In Progress',
    help: 'Help',
    assistSettings: 'Assist Settings',
    autoMark: 'Auto Mark X',
    autoMarkDesc: 'Automatically mark empty cells as X when a row/column is completed',
    conflictDetection: 'Conflict Detection',
    conflictDetectionDesc: 'Highlight hints in red when a row/column contains conflicting cells',
    derivableHint: 'Derivable Hint',
    derivableHintDesc: 'Highlight hints in blue when more cells can be logically deduced',
    howToPlay: 'How to Play',
    moveAndFill: 'Move \u0026 Fill',
    gameControls: 'Game Controls',
    mouseTouch: 'Mouse / Touch',
    keyboardShortcuts: 'Keyboard Shortcuts',
    moveSelection: 'Move selection (wrap around)',
    fillClearByMode: 'Fill / Clear by current mode',
    fillDirect: 'Fill (clear if already filled)',
    markXDirect: 'Mark X (clear if already marked)',
    pauseResume: 'Pause / Resume',
    undoShort: 'Undo',
    restartShort: 'Restart',
    holdToggleMode: 'Hold to toggle mode (Fill \u2194 X)',
    leftClickFill: 'Left click to fill, Right click to mark X',
    dragFillMultiple: 'Drag to fill multiple cells at once',
    longPressToggle: 'Long press on mobile to toggle mode',
    touchFillMode: 'Touch fill mode',
    touchXMode: 'Touch X mode',
    close: 'Close',
    custom: 'Custom',
    nonogramDesc: 'is a logic puzzle where you fill grid cells according to the numbers on the sides. Each number indicates how many consecutive filled cells are in that row/column.',
    exportSuccess: 'Code copied to clipboard',
    copyFailed: 'Copy failed, please manually copy the code below:',
    levelMode: 'Levels',
    freeMode: 'Free',
    level: 'Level',
    levels: 'Level Select',
    selectLevel: 'Select Level',
    completed: 'Completed',
  },
  zh: {
    pause: '\u6682\u505c',
    resume: '\u7ee7\u7eed',
    undo: '\u64a4\u9500',
    restart: '\u91cd\u6765',
    newRandom: '\u65b0\u968f\u673a',
    generating: '\u751f\u6210\u4e2d...',
    import: '\u5bfc\u5165',
    export: '\u5bfc\u51fa',
    save: '\u4fdd\u5b58',
    update: '\u66f4\u65b0',
    delete: '\u5220\u9664',
    fill: '\u586b\u5145',
    markX: 'X',
    paused: '\u5df2\u6682\u505c',
    completed: '\u7528\u65f6 {time} \u5b8c\u6210',
    importPuzzle: '\u5bfc\u5165\u8c1c\u9898',
    pasteCode: '\u5728\u4e0b\u65b9\u7c98\u8d34\u8c1c\u9898\u7f16\u7801\uff1a',
    cancel: '\u53d6\u6d88',
    favorites: '\u6536\u85cf',
    completedShort: '\u5df2\u5b8c\u6210',
    inProgress: '\u8fdb\u884c\u4e2d',
    help: '\u5e2e\u52a9',
    assistSettings: '\u8f85\u52a9\u529f\u80fd',
    autoMark: '\u81ea\u52a8\u6807\u8bb0 X',
    autoMarkDesc: '\u5f53\u884c/\u5217\u5b8c\u6210\u65f6\uff0c\u81ea\u52a8\u5c06\u5269\u4f59\u7a7a\u683c\u6807\u8bb0\u4e3a X',
    conflictDetection: '\u51b2\u7a81\u68c0\u6d4b',
    conflictDetectionDesc: '\u5f53\u884c/\u5217\u5b58\u5728\u51b2\u7a81\u65f6\uff0c\u5c06\u63d0\u793a\u6570\u5b57\u6807\u7ea2',
    derivableHint: '\u53ef\u63a8\u5bfc\u63d0\u793a',
    derivableHintDesc: '\u5f53\u8fd8\u80fd\u903b\u8f91\u63a8\u5bfc\u51fa\u65b0\u6807\u8bb0\u65f6\uff0c\u5c06\u63d0\u793a\u6570\u5b57\u6807\u84dd',
    howToPlay: '\u6e38\u620f\u8bf4\u660e',
    moveAndFill: '\u79fb\u52a8\u4e0e\u586b\u5145',
    gameControls: '\u6e38\u620f\u63a7\u5236',
    mouseTouch: '\u9f20\u6807 / \u89e6\u6478',
    keyboardShortcuts: '\u952e\u76d8\u5feb\u6377\u952e',
    moveSelection: '\u79fb\u52a8\u9009\u4e2d\u683c\u5b50\uff08\u5faa\u73af\u73af\u7ed5\uff09',
    fillClearByMode: '\u6309\u5f53\u524d\u6a21\u5f0f\u586b\u5145/\u6e05\u7a7a',
    fillDirect: '\u76f4\u63a5\u586b\u5145\uff08\u5df2\u586b\u5145\u5219\u6e05\u7a7a\uff09',
    markXDirect: '\u76f4\u63a5\u6807\u8bb0 X\uff08\u5df2\u6807\u8bb0\u5219\u6e05\u7a7a\uff09',
    pauseResume: '\u6682\u505c/\u6062\u590d',
    undoShort: '\u64a4\u9500',
    restartShort: '\u91cd\u65b0\u5f00\u59cb',
    holdToggleMode: '\u6309\u4f4f\u5207\u6362\u6a21\u5f0f\uff08\u586b\u5145 \u2194 X\uff09',
    leftClickFill: '\u5de6\u952e\u586b\u5145\uff0c\u53f3\u952e\u6807\u8bb0 X',
    dragFillMultiple: '\u62d6\u52a8\u53ef\u8fde\u7eed\u586b\u5145\u591a\u4e2a\u683c\u5b50',
    longPressToggle: '\u79fb\u52a8\u7aef\u957f\u6309\u53ef\u5207\u6362\u6a21\u5f0f',
    touchFillMode: '\u586b\u5145\u6a21\u5f0f',
    touchXMode: 'X \u6a21\u5f0f',
    close: '\u5173\u95ed',
    custom: '\u81ea\u5b9a\u4e49',
    nonogramDesc: '\u662f\u4e00\u79cd\u903b\u8f91\u8c1c\u9898\uff0c\u4f60\u9700\u8981\u6839\u636e\u8fb9\u4e0a\u7684\u6570\u5b57\u586b\u5145\u7f51\u683c\u3002\u6bcf\u4e2a\u6570\u5b57\u8868\u793a\u8be5\u884c/\u5217\u4e2d\u6709\u591a\u5c11\u4e2a\u8fde\u7eed\u7684\u586b\u5145\u683c\u5b50\u3002',
    exportSuccess: '\u7f16\u7801\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f',
    copyFailed: '\u590d\u5236\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u590d\u5236\u4ee5\u4e0b\u7f16\u7801\uff1a',
    levelMode: '\u5173\u5361',
    freeMode: '\u81ea\u7531',
    level: '\u5173\u5361',
    levels: '\u5173\u5361\u9009\u62e9',
    selectLevel: '\u9009\u62e9\u5173\u5361',
    completed: '\u5df2\u5b8c\u6210',
  },
  ja: {
    pause: '\u4e00\u6642\u505c\u6b62',
    resume: '\u518d\u958b',
    undo: '\u5143\u306b\u623b\u3059',
    restart: '\u30ea\u30b9\u30bf\u30fc\u30c8',
    newRandom: '\u65b0\u898f\u30e9\u30f3\u30c0\u30e0',
    generating: '\u751f\u6210\u4e2d...',
    import: '\u30a4\u30f3\u30dd\u30fc\u30c8',
    export: '\u30a8\u30af\u30b9\u30dd\u30fc\u30c8',
    save: '\u4fdd\u5b58',
    update: '\u66f4\u65b0',
    delete: '\u524a\u9664',
    fill: '\u5857\u308b',
    markX: 'X',
    paused: '\u4e00\u6642\u505c\u6b62\u4e2d',
    completed: '{time} \u3067\u5b8c\u6210\uff01',
    importPuzzle: '\u30d1\u30ba\u30eb\u3092\u30a4\u30f3\u30dd\u30fc\u30c8',
    pasteCode: '\u30d1\u30ba\u30eb\u30b3\u30fc\u30c9\u3092\u8cbc\u308a\u4ed8\u3051\u3066\u304f\u3060\u3055\u3044\uff1a',
    cancel: '\u30ad\u30e3\u30f3\u30bb\u30eb',
    favorites: '\u304a\u6c17\u306b\u5165\u308a',
    completedShort: '\u5b8c\u4e86',
    inProgress: '\u9032\u884c\u4e2d',
    help: '\u30d8\u30eb\u30d7',
    assistSettings: '\u30a2\u30b7\u30b9\u30c8\u8a2d\u5b9a',
    autoMark: '\u81ea\u52d5 X \u30de\u30fc\u30af',
    autoMarkDesc: '\u884c/\u5217\u304c\u5b8c\u6210\u3057\u305f\u6642\u3001\u6b8b\u308a\u306e\u7a7a\u6b04\u3092\u81ea\u52d5\u7684\u306b X \u3067\u30de\u30fc\u30af\u3059\u308b',
    conflictDetection: '\u77db\u76fe\u691c\u51fa',
    conflictDetectionDesc: '\u884c/\u5217\u306b\u77db\u76fe\u304c\u3042\u308b\u6642\u3001\u30d2\u30f3\u30c8\u3092\u8d64\u8272\u3067\u8868\u793a\u3059\u308b',
    derivableHint: '\u5c0e\u51fa\u30d2\u30f3\u30c8',
    derivableHintDesc: '\u8ad6\u7406\u7684\u306b\u65b0\u3057\u3044\u30de\u30fc\u30af\u304c\u5c0e\u51fa\u3067\u304d\u308b\u6642\u3001\u30d2\u30f3\u30c8\u3092\u9752\u8272\u3067\u8868\u793a\u3059\u308b',
    howToPlay: '\u904a\u3073\u65b9',
    moveAndFill: '\u79fb\u52d5\u3068\u5857\u308a\u3064\u3076\u3057',
    gameControls: '\u30b2\u30fc\u30e0\u64cd\u4f5c',
    mouseTouch: '\u30de\u30a6\u30b9 / \u30bf\u30c3\u30c1',
    keyboardShortcuts: '\u30ad\u30fc\u30dc\u30fc\u30c9\u30b7\u30e7\u30fc\u30c8\u30ab\u30c3\u30c8',
    moveSelection: '\u9078\u629e\u3092\u79fb\u52d5\uff08\u30eb\u30fc\u30d7\uff09',
    fillClearByMode: '\u73fe\u5728\u306e\u30e2\u30fc\u30c9\u3067\u5857\u308a\u3064\u3076\u3057/\u30af\u30ea\u30a2',
    fillDirect: '\u76f4\u63a5\u5857\u308a\u3064\u3076\u3057\uff08\u65e2\u306b\u5857\u3089\u308c\u3066\u3044\u308b\u5834\u5408\u306f\u30af\u30ea\u30a2\uff09',
    markXDirect: '\u76f4\u63a5 X \u3092\u30de\u30fc\u30af\uff08\u65e2\u306b\u30de\u30fc\u30af\u3055\u308c\u3066\u3044\u308b\u5834\u5408\u306f\u30af\u30ea\u30a2\uff09',
    pauseResume: '\u4e00\u6642\u505c\u6b62/\u518d\u958b',
    undoShort: '\u5143\u306b\u623b\u3059',
    restartShort: '\u30ea\u30b9\u30bf\u30fc\u30c8',
    holdToggleMode: '\u9577\u62bc\u3057\u3067\u30e2\u30fc\u30c9\u5207\u66ff\uff08\u5857\u308a\u3064\u3076\u3057 \u2194 X\uff09',
    leftClickFill: '\u5de6\u30af\u30ea\u30c3\u30af\u3067\u5857\u308a\u3064\u3076\u3057\u3001\u53f3\u30af\u30ea\u30c3\u30af\u3067 X \u3092\u30de\u30fc\u30af',
    dragFillMultiple: '\u30c9\u30e9\u30c3\u30b0\u3067\u8907\u6570\u306e\u30bb\u30eb\u3092\u4e00\u5ea6\u306b\u5857\u308a\u3064\u3076\u3057',
    longPressToggle: '\u30e2\u30d0\u30a4\u30eb\u3067\u9577\u62bc\u3057\u3059\u308b\u3068\u30e2\u30fc\u30c9\u3092\u5207\u308a\u66ff\u3048',
    touchFillMode: '\u5857\u308a\u3064\u3076\u3057\u30e2\u30fc\u30c9',
    touchXMode: 'X \u30e2\u30fc\u30c9',
    close: '\u9589\u3058\u308b',
    custom: '\u30ab\u30b9\u30bf\u30e0',
    nonogramDesc: '\u306f\u3001\u5074\u9762\u306e\u6570\u5b57\u306b\u5f93\u3063\u3066\u30de\u30b9\u3092\u5857\u308a\u3064\u3076\u3059\u8ad6\u7406\u30d1\u30ba\u30eb\u3067\u3059\u3002\u5404\u6570\u5b57\u306f\u3001\u305d\u306e\u884c/\u5217\u306b\u3042\u308b\u9023\u7d9a\u3057\u305f\u5857\u308a\u3064\u3076\u3057\u30de\u30b9\u306e\u6570\u3092\u793a\u3057\u307e\u3059\u3002',
    exportSuccess: '\u30b3\u30fc\u30c9\u3092\u30af\u30ea\u30c3\u30d7\u30dc\u30fc\u30c9\u306b\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f',
    copyFailed: '\u30b3\u30d4\u30fc\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u4ee5\u4e0b\u306e\u30b3\u30fc\u30c9\u3092\u624b\u52d5\u3067\u30b3\u30d4\u30fc\u3057\u3066\u304f\u3060\u3055\u3044\uff1a',
    levelMode: '\u30b9\u30c6\u30fc\u30b8',
    freeMode: '\u30d5\u30ea\u30fc',
    level: '\u30b9\u30c6\u30fc\u30b8',
    levels: '\u30b9\u30c6\u30fc\u30b8\u9078\u629e',
    selectLevel: '\u30b9\u30c6\u30fc\u30b8\u3092\u9078\u629e',
    completed: '\u5b8c\u4e86',
  },
}

function detectBrowserLang() {
  const saved = localStorage.getItem('nonocross-lang')
  if (saved) return saved
  
  const browserLang = navigator.language || navigator.userLanguage || 'en'
  if (browserLang.startsWith('zh')) return 'zh'
  if (browserLang.startsWith('ja')) return 'ja'
  return 'en'
}

export const currentLang = ref(detectBrowserLang())

/**
 * 切换语言
 * @param {string} lang - 语言代码
 */
export function setLang(lang) {
  if (LANGUAGES.includes(lang)) {
    currentLang.value = lang
    localStorage.setItem('nonocross-lang', lang)
  }
}

/**
 * 获取下一个语言（循环切换）
 */
export function nextLang() {
  const idx = LANGUAGES.indexOf(currentLang.value)
  const next = LANGUAGES[(idx + 1) % LANGUAGES.length]
  setLang(next)
  return next
}

/**
 * 翻译函数
 * @param {string} key - 翻译键
 * @param {Object} params - 插值参数
 * @returns {string} 翻译后的文本
 */
export function t(key, params = {}) {
  const text = TRANSLATIONS[currentLang.value]?.[key] || TRANSLATIONS.en[key] || key
  return Object.entries(params).reduce((result, [k, v]) => {
    return result.replace(`{${k}}`, v)
  }, text)
}
