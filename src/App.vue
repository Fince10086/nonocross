<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useTimer } from "./composables/useTimer.js";
import { useFavorites } from "./composables/useFavorites.js";
import { useGame } from "./composables/useGame.js";
import { useLevels } from "./composables/useLevels.js";
import { t, nextLang } from "./i18n.js";

import GameBoard from "./components/GameBoard.vue";
import GameControls from "./components/GameControls.vue";
import PuzzleSelector from "./components/PuzzleSelector.vue";
import FavoritesPanel from "./components/FavoritesPanel.vue";
import ImportModal from "./components/ImportModal.vue";
import HelpModal from "./components/HelpModal.vue";
import AssistModal from "./components/AssistModal.vue";
import LevelSelect from "./components/LevelSelect.vue";

const timer = useTimer();
const favorites = useFavorites();
const game = useGame(timer, favorites);
const levels = useLevels();

const isLevelMode = ref(false);
const currentLevel = ref(0);
const showLevelSelect = ref(false);

const showImportDialog = ref(false);
const showHelpDialog = ref(false);
const showAssistDialog = ref(false);
const showExportToast = ref(false);
const importModalRef = ref(null);

const isInFavoritesComputed = computed(() => {
    return favorites.isInFavorites(game.currentSolution.value);
});

// 监听关卡完成
watch(() => game.isComplete.value, (complete) => {
    if (complete && isLevelMode.value && currentLevel.value > 0) {
        const hasAssist = game.assistUsed.value?.conflictDetect || game.assistUsed.value?.derivableHint;
        levels.recordCompletion(currentLevel.value, timer.seconds.value, hasAssist);
    }
});

function handleTogglePause() {
    timer.togglePause();
}

function handleShowImport() {
    showImportDialog.value = true;
}

function handleShowHelp() {
    showHelpDialog.value = true;
}

function handleCloseHelp() {
    showHelpDialog.value = false;
}

function handleShowAssist() {
    showAssistDialog.value = true;
}

function handleCloseAssist() {
    showAssistDialog.value = false;
}

function handleToggleAssist(key, value) {
    game.toggleAssistSetting(key, value);
}

function handleSwitchLang() {
    nextLang();
}

function handleCloseImport() {
    showImportDialog.value = false;
}

function handleImportPuzzle(code) {
    const result = game.importPuzzle(code);
    if (result.success) {
        showImportDialog.value = false;
    } else {
        importModalRef.value?.setError(result.error);
    }
}

async function handleExportPuzzle() {
    const code = game.exportPuzzle();
    if (!code) return;
    try {
        await navigator.clipboard.writeText(code);
        showExportToast.value = true;
        setTimeout(() => {
            showExportToast.value = false;
        }, 2000);
    } catch (e) {
        console.error("Export failed:", e);
        alert(t('copyFailed') + "\n" + code);
    }
}

function handleSaveCurrentPuzzle() {
    favorites.saveCurrentPuzzle({
        solution: game.currentSolution.value,
        size: game.currentSize.value,
        starsText: game.currentStars.value,
        isComplete: game.isComplete.value,
        grid: game.grid.value,
        seconds: timer.seconds.value,
        sweeps: game.currentSweeps.value,
    });
}

function handleDeleteFromFavorites() {
    favorites.deleteFromFavorites(game.currentSolution.value);
}

function handleLoadFavorite(fav) {
    const data = favorites.loadFavoriteData(fav);
    if (!data) return;
    game.restoreFromData(data);
    isLevelMode.value = false;
    currentLevel.value = 0;
}

// 关卡模式
function handleShowLevelSelect() {
    showLevelSelect.value = true;
}

function handleCloseLevelSelect() {
    showLevelSelect.value = false;
}

async function handleSelectLevel(level) {
    showLevelSelect.value = false;
    await levels.loadLevelData();
    const levelInfo = levels.getLevelInfo(level);
    if (!levelInfo) return;

    const size = levelInfo.size;
    const targetPuzzles = game.puzzleBank.value.filter(p => p.size === size);
    const puzzle = targetPuzzles.find(p => {
        const puzzleId = `${p.size}-${p.id}`;
        return puzzleId === levelInfo.puzzleId;
    });

    if (puzzle) {
        isLevelMode.value = true;
        currentLevel.value = level;
        game.currentSize.value = size;
        game.loadPuzzle(puzzle);
    } else {
        game.generateNewPuzzle();
    }
}

function handleNextLevel() {
    if (currentLevel.value >= 2700) return;
    handleSelectLevel(currentLevel.value + 1);
}

function handlePrevLevel() {
    if (currentLevel.value <= 1) return;
    handleSelectLevel(currentLevel.value - 1);
}

function handleSwitchToLevelMode() {
    isLevelMode.value = true;
    const startLevel = levels.completedLevel.value + 1;
    if (startLevel <= 2700) {
        handleSelectLevel(startLevel);
    }
}

function handleSwitchToFreeMode() {
    isLevelMode.value = false;
    currentLevel.value = 0;
    // 恢复自由模式保存的尺寸
    try {
        const savedSize = localStorage.getItem('nonocross-free-size');
        if (savedSize) {
            const size = parseInt(savedSize, 10);
            if ([5, 10, 15].includes(size)) {
                game.currentSize.value = size;
            }
        }
    } catch (e) {
        console.error('Failed to restore free mode size:', e);
    }
    game.generateNewPuzzle();
}

function handleKeyDown(e) {
    game.handleKeyDown(e, timer.togglePause);
}

function handleKeyUp(e) {
    game.onKeyUp(e);
}

onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    favorites.loadFavorites();
    levels.loadProgress();

    game.loadPuzzleBank().then(() => {
        levels.loadLevelData().then(() => {
            const startLevel = levels.completedLevel.value + 1;
            if (startLevel <= 2700 && levels.levelsData.value) {
                handleSelectLevel(startLevel);
            } else {
                game.generateNewPuzzle();
            }
        });
    });
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
});
</script>

<template>
    <div class="app">
        <h1 class="title">NONOCROSS</h1>

        <!-- 模式切换 -->
        <div class="btn-group">
            <button
                class="btn"
                :class="{ active: isLevelMode }"
                @click="handleSwitchToLevelMode"
            >
                {{ t('levelMode') }}
            </button>
            <button
                class="btn"
                :class="{ active: !isLevelMode }"
                @click="handleSwitchToFreeMode"
            >
                {{ t('freeMode') }}
            </button>
        </div>

        <!-- 关卡信息 -->
        <div v-if="isLevelMode && currentLevel > 0" class="level-info">
            <div class="level-display">
                <button class="btn btn-icon" @click="handlePrevLevel" :disabled="currentLevel <= 1">&lt;</button>
                <span class="level-number" @click="handleShowLevelSelect">{{ t('level') }} {{ currentLevel }}</span>
                <button class="btn btn-icon" @click="handleNextLevel" :disabled="currentLevel >= 2700 || currentLevel >= levels.unlockedMax.value">>></button>
            </div>
        </div>

        <!-- 自由模式：尺寸选择 -->
        <div v-if="!isLevelMode" class="size-selector-bar">
            <PuzzleSelector
                :current-size="game.currentSize.value"
                @change-size="game.changeSize"
            />
        </div>

        <div class="top-bar">
            <div class="timer">{{ timer.formattedTime.value }}</div>
            <div v-if="game.currentStars.value" class="difficulty-stars">
                {{ game.currentStars.value }}
            </div>
        </div>

        <GameBoard
            :grid="game.grid.value"
            :current-size="game.currentSize.value"
            :current-col-hints="game.currentColHints.value"
            :current-row-hints="game.currentRowHints.value"
            :col-hint-determined="game.colHintDetermined.value"
            :row-hint-determined="game.rowHintDetermined.value"
            :row-hint-conflict="game.rowHintConflict.value"
            :col-hint-conflict="game.colHintConflict.value"
            :row-hint-derivable="game.rowHintDerivable.value"
            :col-hint-derivable="game.colHintDerivable.value"
            :is-complete="game.isComplete.value"
            :is-paused="timer.isPaused.value"
            :mode="game.mode.value"
            :selected-cell="game.selectedCell.value"
            @cell-mouse-down="game.cellMouseDown"
            @cell-mouse-enter="game.cellMouseEnter"
            @cell-touch-start="game.cellTouchStart"
            @cell-touch-move="game.cellTouchMove"
            @stop-dragging="game.stopDragging"
            @toggle-mode="game.toggleMode"
            @resume="timer.resume"
        />

        <!-- 完成提示 -->
        <div v-if="game.isComplete.value" class="message">
            {{ t('completed', { time: timer.formattedTime.value }) }}
        </div>

        <GameControls
            :is-paused="timer.isPaused.value"
            :is-complete="game.isComplete.value"
            :history-length="game.history.value.length"
            :is-generating="game.isGenerating.value"
            :current-solution="game.currentSolution.value"
            :is-in-favorites="isInFavoritesComputed"
            :puzzle-bank-loaded="game.puzzleBankLoaded.value"
            :selected-star="game.selectedStar.value"
            :available-stars="game.availableStars.value"
            :puzzles-for-star="game.puzzlesForStar.value"
            :current-puzzle-id="game.currentPuzzleId.value"
            :is-level-mode="isLevelMode"
            @toggle-pause="handleTogglePause"
            @undo="game.undo"
            @restart="game.restart"
            @generate-new-puzzle="game.generateNewPuzzle"
            @next-level="handleNextLevel"
            @show-import="handleShowImport"
            @export-puzzle="handleExportPuzzle"
            @save-current-puzzle="handleSaveCurrentPuzzle"
            @delete-from-favorites="handleDeleteFromFavorites"
            @select-star="game.selectStar"
            @select-bank-puzzle="game.selectBankPuzzle"
            @show-help="handleShowHelp"
            @show-assist="handleShowAssist"
            @switch-lang="handleSwitchLang"
        />

        <FavoritesPanel
            :favorites="favorites.favorites.value"
            @load-favorite="handleLoadFavorite"
        />

        <!-- 导出成功提示 -->
        <div v-if="showExportToast" class="toast">{{ t('exportSuccess') }}</div>

        <ImportModal
            ref="importModalRef"
            :show="showImportDialog"
            @close="handleCloseImport"
            @import="handleImportPuzzle"
        />

        <HelpModal
            :show="showHelpDialog"
            @close="handleCloseHelp"
        />

        <AssistModal
            :show="showAssistDialog"
            :settings="game.assistSettings.value"
            @close="handleCloseAssist"
            @toggle="handleToggleAssist"
        />

        <LevelSelect
            :show="showLevelSelect"
            :levels-data="levels.levelsData.value"
            :completed-level="levels.completedLevel.value"
            :completed-count="levels.completedCount.value"
            :unlocked-max="levels.unlockedMax.value"
            :records="levels.records.value"
            @close="handleCloseLevelSelect"
            @select-level="handleSelectLevel"
        />
    </div>
</template>

<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: "Outfit";
}

body {
    background: #fff;
    color: #000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.app {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.title {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.15em;
}

.level-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.level-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.level-number {
    font-size: 1rem;
    font-weight: 700;
    min-width: 80px;
    text-align: center;
    cursor: pointer;
    user-select: none;
}

.level-number:hover {
    opacity: 0.7;
}

.size-selector-bar {
    display: flex;
    justify-content: center;
}

.top-bar {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
    justify-content: center;
}

.difficulty-stars {
    font-size: 1rem;
    font-weight: 600;
}

.timer {
    font-size: 1.25rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    min-width: 60px;
    text-align: center;
}

.toast {
    padding: 8px 16px;
    background: #000;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    animation: fadeIn 0.3s ease;
}

.message {
    font-size: 1.25rem;
    font-weight: 700;
    animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
