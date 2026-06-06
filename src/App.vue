<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTimer } from "./composables/useTimer.js";
import { useFavorites } from "./composables/useFavorites.js";
import { useGame } from "./composables/useGame.js";
import { t, nextLang } from "./i18n.js";

import GameBoard from "./components/GameBoard.vue";
import GameControls from "./components/GameControls.vue";
import PuzzleSelector from "./components/PuzzleSelector.vue";
import FavoritesPanel from "./components/FavoritesPanel.vue";
import ImportModal from "./components/ImportModal.vue";
import HelpModal from "./components/HelpModal.vue";
import AssistModal from "./components/AssistModal.vue";

const timer = useTimer();
const favorites = useFavorites();
const game = useGame(timer, favorites);

const showImportDialog = ref(false);
const showHelpDialog = ref(false);
const showAssistDialog = ref(false);
const showExportToast = ref(false);
const importModalRef = ref(null);

const isInFavoritesComputed = computed(() => {
    return favorites.isInFavorites(game.currentSolution.value);
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

/**
 * 导出当前谜题到剪贴板
 */
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
        console.error("复制到剪贴板失败:", e);
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
    game.loadPuzzleBank().then(() => {
        const stars = [
            ...new Set(game.puzzlesForSize.value.map((p) => p.stars)),
        ];
        if (stars.length > 0) {
            game.selectedStar.value = Math.min(...stars);
            const puzzles = game.puzzlesForStar.value;
            const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
            if (randomPuzzle) {
                game.selectBankPuzzle(randomPuzzle);
            } else {
                game.generateNewPuzzle();
            }
        } else {
            game.generateNewPuzzle();
        }
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

        <div class="top-bar">
            <div class="timer">{{ timer.formattedTime }}</div>
            <div v-if="game.currentStars" class="difficulty-stars">
                {{ game.currentStars }}
            </div>
            <PuzzleSelector
                :current-size="game.currentSize.value"
                @change-size="game.changeSize"
            />
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
            @toggle-pause="handleTogglePause"
            @undo="game.undo"
            @restart="game.restart"
            @generate-new-puzzle="game.generateNewPuzzle"
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

        <!-- 完成提示 -->
        <div v-if="game.isComplete.value" class="message">
            {{ t('completed', { time: timer.formattedTime }) }}
        </div>
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
    gap: 16px;
}

.title {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.15em;
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

@media (max-width: 600px) {
    .top-bar {
        gap: 12px;
    }

    .timer {
        font-size: 1.1rem;
        min-width: 50px;
    }

    .difficulty-stars {
        font-size: 0.875rem;
    }

    .pause-text {
        font-size: 1.5rem;
    }
}
</style>
