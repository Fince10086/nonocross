<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { generatePuzzleAsync } from "./generator.js";
import {
    encodePuzzle,
    decodePuzzle,
    getHints,
    fullSettle,
    sweepsToStars,
    formatStars,
    getDeterminedHints,
} from "./solver.js";

const currentSize = ref(10);
const grid = ref([]);
const mode = ref("fill"); // 'fill' or 'x'
const history = ref([]);
const seconds = ref(0);
const isComplete = ref(false);
const timerInterval = ref(null);
const isRunning = ref(false);

const isDragging = ref(false);
const dragValue = ref(null);
const ctrlDown = ref(false);

const currentSolution = ref(null);
const currentRowHints = ref(null);
const currentColHints = ref(null);
const currentStars = ref(null);
const isGenerating = ref(false);
const showImportDialog = ref(false);
const importCode = ref("");
const importError = ref("");
const showExportToast = ref(false);

const puzzleBank = ref([]);
const currentPuzzleId = ref(null);
const puzzleBankLoaded = ref(false);
const selectedStar = ref(1);

function enrichPuzzle(line) {
    // Format: id:size:solution:sweeps (e.g. 5x5-001:5:0101000000010100110010111:9)
    const parts = line.split(":");
    if (parts.length !== 4) return null;

    const id = parts[0];
    const size = parseInt(parts[1], 10);
    const solutionStr = parts[2];
    const sweeps = parseInt(parts[3], 10);

    // Convert string to 2D array
    const solution = [];
    for (let r = 0; r < size; r++) {
        const row = [];
        for (let c = 0; c < size; c++) {
            row.push(parseInt(solutionStr[r * size + c], 10));
        }
        solution.push(row);
    }

    const rowHints = solution.map((row) => getHints(row));
    const colHints = solution[0].map((_, colIndex) =>
        getHints(solution.map((row) => row[colIndex])),
    );

    const stars = sweepsToStars(sweeps, size);
    const starsText = formatStars(stars);

    return {
        id,
        size,
        solution,
        rowHints,
        colHints,
        sweeps,
        stars,
        starsText,
    };
}

async function loadPuzzleBank() {
    try {
        const res = await fetch("/puzzles.json");
        const text = await res.text();
        const lines = text
            .trim()
            .split("\n")
            .filter((line) => line.trim());
        puzzleBank.value = lines.map(enrichPuzzle).filter(Boolean);
        puzzleBankLoaded.value = true;
    } catch (e) {
        console.error("Failed to load puzzle bank:", e);
    }
}

const puzzlesForSize = computed(() => {
    return puzzleBank.value.filter((p) => p.size === currentSize.value);
});

const puzzlesForStar = computed(() => {
    return puzzlesForSize.value.filter((p) => p.stars === selectedStar.value);
});

const availableStars = computed(() => {
    const stars = new Set(puzzlesForSize.value.map((p) => p.stars));
    return [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].filter((s) => stars.has(s));
});

function createEmptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
}

function gridToSolverState(val) {
    if (val === 1) return 1;
    if (val === 2) return 0;
    return null;
}

const rowHintDetermined = computed(() => {
    if (!currentRowHints.value) return [];
    return currentRowHints.value.map((hints, r) => {
        const state = grid.value[r].map(gridToSolverState);
        return getDeterminedHints(state, hints);
    });
});

const colHintDetermined = computed(() => {
    if (!currentColHints.value) return [];
    return currentColHints.value.map((hints, c) => {
        const state = grid.value.map((row) => gridToSolverState(row[c]));
        return getDeterminedHints(state, hints);
    });
});

function loadPuzzle(puzzle) {
    currentSolution.value = puzzle.solution;
    currentRowHints.value = puzzle.rowHints;
    currentColHints.value = puzzle.colHints;
    currentStars.value = puzzle.starsText || null;
    currentPuzzleId.value = puzzle.id || null;
    restart();
}

function onKeyDown(e) {
    if (e.key === "Control" || e.key === "Meta") {
        if (!ctrlDown.value) {
            ctrlDown.value = true;
        }
    }
}

function onKeyUp(e) {
    if (e.key === "Control" || e.key === "Meta") {
        if (ctrlDown.value) {
            ctrlDown.value = false;
            mode.value = mode.value === "fill" ? "x" : "fill";
        }
    }
}

function startTimer() {
    if (!isRunning.value && !isComplete.value) {
        isRunning.value = true;
        timerInterval.value = setInterval(() => {
            seconds.value++;
        }, 1000);
    }
}

function stopTimer() {
    clearInterval(timerInterval.value);
    isRunning.value = false;
}

function pushHistory() {
    history.value.push(grid.value.map((row) => [...row]));
    if (history.value.length > 100) {
        history.value.shift();
    }
}

function toggleMode(newMode) {
    mode.value = newMode;
}

function getTargetValue(button) {
    const effectiveMode =
        button === 0 ? mode.value : mode.value === "fill" ? "x" : "fill";
    return effectiveMode === "fill" ? 1 : 2;
}

function cellMouseDown(e, r, c) {
    if (isComplete.value) return;
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    startTimer();
    pushHistory();

    const targetVal = getTargetValue(e.button);
    const currentVal = grid.value[r][c];

    dragValue.value = currentVal === targetVal ? 0 : targetVal;
    grid.value[r][c] = dragValue.value;
    isDragging.value = true;
    checkComplete();
}

function cellMouseEnter(r, c) {
    if (!isDragging.value || isComplete.value) return;
    if (dragValue.value === 0) {
        grid.value[r][c] = 0;
    } else if (grid.value[r][c] === 0) {
        grid.value[r][c] = dragValue.value;
    }
}

function stopDragging() {
    isDragging.value = false;
    dragValue.value = null;
}

function undo() {
    if (history.value.length === 0) return;
    grid.value = history.value.pop();
}

function restart() {
    stopTimer();
    seconds.value = 0;
    grid.value = createEmptyGrid(currentSize.value);
    history.value = [];
    isComplete.value = false;
    isDragging.value = false;
    dragValue.value = null;
}

async function generateNewPuzzle() {
    if (isGenerating.value) return;
    isGenerating.value = true;
    currentPuzzleId.value = null;
    const puzzle = await generatePuzzleAsync(currentSize.value);
    loadPuzzle(puzzle);
    isGenerating.value = false;
}

function selectBankPuzzle(puzzle) {
    loadPuzzle(puzzle);
}

function exportPuzzle() {
    if (!currentSolution.value) return;
    const code = encodePuzzle(currentSolution.value);
    navigator.clipboard.writeText(code).catch(() => {});
    showExportToast.value = true;
    setTimeout(() => {
        showExportToast.value = false;
    }, 2000);
}

function importPuzzle() {
    importError.value = "";
    const result = decodePuzzle(importCode.value.trim());
    if (!result) {
        importError.value = "Invalid code format";
        return;
    }

    const { size, solution } = result;
    const rowHints = solution.map((row) => getHints(row));
    const colHints = solution[0].map((_, colIndex) =>
        getHints(solution.map((row) => row[colIndex])),
    );

    // Verify solvability and calculate difficulty
    const { solved, sweeps } = fullSettle(rowHints, colHints);
    if (!solved) {
        importError.value = "This puzzle is not logically solvable";
        return;
    }

    const stars = sweepsToStars(sweeps, size);
    const starsText = formatStars(stars);

    currentSize.value = size;
    loadPuzzle({
        solution,
        rowHints,
        colHints,
        sweeps,
        stars,
        starsText,
        id: null,
    });
    showImportDialog.value = false;
    importCode.value = "";
}

function checkComplete() {
    if (!currentSolution.value) return;
    for (let r = 0; r < currentSize.value; r++) {
        for (let c = 0; c < currentSize.value; c++) {
            const expected = currentSolution.value[r][c];
            const actual = grid.value[r][c];
            if (expected === 1 && actual !== 1) return;
            if (expected === 0 && actual === 1) return;
        }
    }
    isComplete.value = true;
    stopTimer();
}

const formattedTime = computed(() => {
    const m = Math.floor(seconds.value / 60)
        .toString()
        .padStart(2, "0");
    const s = (seconds.value % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
});

const cellSize = computed(() => {
    if (currentSize.value <= 5) return "40px";
    if (currentSize.value <= 10) return "32px";
    return "24px";
});

const hintAreaSize = computed(() => {
    if (currentSize.value <= 5) return "60px";
    if (currentSize.value <= 10) return "80px";
    return "100px";
});

function changeSize(size) {
    currentSize.value = size;
    restart();
    // Auto-select first available star for this size
    const stars = [...new Set(puzzlesForSize.value.map((p) => p.stars))];
    if (stars.length > 0) {
        selectedStar.value = Math.min(...stars);
        const puzzles = puzzlesForStar.value;
        if (puzzles.length > 0) {
            selectBankPuzzle(puzzles[0]);
        } else {
            generateNewPuzzle();
        }
    } else {
        generateNewPuzzle();
    }
}

function selectStar(star) {
    selectedStar.value = star;
    const puzzles = puzzlesForStar.value;
    if (puzzles.length > 0) {
        selectBankPuzzle(puzzles[0]);
    }
}

watch(currentSize, () => {
    restart();
});

onMounted(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    loadPuzzleBank().then(() => {
        const stars = [...new Set(puzzlesForSize.value.map((p) => p.stars))];
        if (stars.length > 0) {
            selectedStar.value = Math.min(...stars);
            const puzzles = puzzlesForStar.value;
            if (puzzles.length > 0) {
                selectBankPuzzle(puzzles[0]);
            } else {
                generateNewPuzzle();
            }
        } else {
            generateNewPuzzle();
        }
    });
});

onUnmounted(() => {
    stopTimer();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
});
</script>

<template>
    <div class="app">
        <h1 class="title">NONOCROSS</h1>

        <div class="toolbar">
            <div class="timer">{{ formattedTime }}</div>
            <div class="btn-group">
                <button
                    class="mode-btn"
                    :class="{ active: mode === 'fill' }"
                    @click="toggleMode('fill')"
                >
                    Fill
                </button>
                <button
                    class="mode-btn"
                    :class="{ active: mode === 'x' }"
                    @click="toggleMode('x')"
                >
                    Mark X
                </button>
            </div>
            <div class="btn-group">
                <button
                    class="action-btn"
                    @click="undo"
                    :disabled="history.length === 0 || isComplete"
                >
                    Undo
                </button>
                <button class="action-btn" @click="restart">Restart</button>
            </div>
        </div>

        <div class="size-selector">
            <span class="label">Size:</span>
            <div class="btn-group">
                <button
                    class="mode-btn"
                    :class="{ active: currentSize === 5 }"
                    @click="changeSize(5)"
                >
                    5×5
                </button>
                <button
                    class="mode-btn"
                    :class="{ active: currentSize === 10 }"
                    @click="changeSize(10)"
                >
                    10×10
                </button>
                <button
                    class="mode-btn"
                    :class="{ active: currentSize === 15 }"
                    @click="changeSize(15)"
                >
                    15×15
                </button>
            </div>
        </div>

        <div v-if="currentStars" class="difficulty-row">
            <span class="label">Difficulty:</span>
            <span class="difficulty-stars">{{ currentStars }}</span>
        </div>

        <div class="board-wrapper" :class="{ complete: isComplete }">
            <!-- Top-left spacer -->
            <div class="spacer"></div>

            <!-- Column hints -->
            <div class="col-hints">
                <div
                    v-for="(hints, c) in currentColHints"
                    :key="c"
                    class="col-hint"
                >
                    <div
                        v-for="(n, i) in hints"
                        :key="i"
                        class="hint-num"
                        :class="{
                            'hint-determined': colHintDetermined[c]?.has(i),
                        }"
                    >
                        {{ n }}
                    </div>
                </div>
            </div>

            <!-- Row hints -->
            <div class="row-hints">
                <div
                    v-for="(hints, r) in currentRowHints"
                    :key="r"
                    class="row-hint"
                >
                    <span
                        v-for="(n, i) in hints"
                        :key="i"
                        class="hint-num"
                        :class="{
                            'hint-determined': rowHintDetermined[r]?.has(i),
                        }"
                        >{{ n }}</span
                    >
                </div>
            </div>

            <!-- Grid -->
            <div
                class="grid"
                @mouseup="stopDragging"
                @mouseleave="stopDragging"
            >
                <div v-for="(row, r) in grid" :key="r" class="row">
                    <div
                        v-for="(cell, c) in row"
                        :key="c"
                        class="cell"
                        :class="{ filled: cell === 1, x: cell === 2 }"
                        :style="{
                            width: cellSize,
                            height: cellSize,
                            borderBottom:
                                (r + 1) % 5 === 0 && r + 1 < currentSize
                                    ? '2px solid #ccc'
                                    : undefined,
                            borderRight:
                                (c + 1) % 5 === 0 && c + 1 < currentSize
                                    ? '2px solid #ccc'
                                    : undefined,
                        }"
                        @mousedown.prevent="cellMouseDown($event, r, c)"
                        @mouseenter="cellMouseEnter(r, c)"
                        @contextmenu.prevent
                    >
                        <span v-if="cell === 2" class="x-mark">X</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="controls">
            <div v-if="puzzleBankLoaded" class="puzzle-picker">
                <div class="picker-row">
                    <span class="label">Star:</span>
                    <select
                        class="puzzle-select"
                        :value="selectedStar"
                        @change="(e) => selectStar(parseFloat(e.target.value))"
                    >
                        <option
                            v-for="star in availableStars"
                            :key="star"
                            :value="star"
                        >
                            {{ formatStars(star) }}
                        </option>
                    </select>
                </div>
                <div class="picker-row">
                    <span class="label">Puzzle:</span>
                    <select
                        class="puzzle-select"
                        :value="currentPuzzleId || ''"
                        @change="
                            (e) =>
                                selectBankPuzzle(
                                    puzzlesForStar.find(
                                        (p) => p.id === e.target.value,
                                    ),
                                )
                        "
                    >
                        <option
                            v-for="p in puzzlesForStar"
                            :key="p.id"
                            :value="p.id"
                        >
                            {{ p.id }}
                        </option>
                    </select>
                </div>
            </div>

            <button
                class="action-btn new-btn"
                @click="generateNewPuzzle"
                :disabled="isGenerating"
            >
                {{ isGenerating ? "Generating..." : "New Random" }}
            </button>

            <div class="btn-group">
                <button class="action-btn" @click="exportPuzzle">Export</button>
                <button class="action-btn" @click="showImportDialog = true">
                    Import
                </button>
            </div>
        </div>

        <div v-if="showExportToast" class="toast">Code copied to clipboard</div>

        <div
            v-if="showImportDialog"
            class="modal-overlay"
            @click.self="showImportDialog = false"
        >
            <div class="modal">
                <h3 class="modal-title">Import Puzzle</h3>
                <p class="modal-desc">Paste the puzzle code below:</p>
                <input
                    v-model="importCode"
                    type="text"
                    class="modal-input"
                    placeholder="10:AAECAwQFBgcICQ=="
                    @keyup.enter="importPuzzle"
                />
                <p v-if="importError" class="modal-error">{{ importError }}</p>
                <div class="modal-actions">
                    <button class="action-btn" @click="importPuzzle">
                        Import
                    </button>
                    <button
                        class="action-btn"
                        @click="
                            showImportDialog = false;
                            importError = '';
                        "
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <div v-if="isComplete" class="message">
            Completed in {{ formattedTime }}!
        </div>
    </div>
</template>

<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
        sans-serif;
    background: #fff;
    color: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
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

.difficulty-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.difficulty-stars {
    font-size: 1rem;
    font-weight: 600;
}

.toolbar {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
    justify-content: center;
}

.timer {
    font-size: 1.25rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    min-width: 60px;
    text-align: center;
}

.btn-group {
    display: flex;
    gap: 0;
    border: 2px solid #000;
}

.mode-btn,
.action-btn {
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    background: #fff;
    color: #000;
    cursor: pointer;
    transition: background 0.15s;
}

.mode-btn + .mode-btn,
.action-btn + .action-btn {
    border-left: 2px solid #000;
}

.mode-btn.active {
    background: #000;
    color: #fff;
}

.mode-btn:hover:not(.active),
.action-btn:hover:not(:disabled) {
    background: #f0f0f0;
}

.action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.size-selector {
    display: flex;
    align-items: center;
    gap: 12px;
}

.label {
    font-size: 0.875rem;
    font-weight: 600;
}

.board-wrapper {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr;
    border: 2px solid #000;
    user-select: none;
}

.spacer {
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
}

.col-hints {
    display: flex;
    border-bottom: 2px solid #000;
}

.col-hint {
    width: v-bind("cellSize");
    height: v-bind("hintAreaSize");
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding-bottom: 4px;
    gap: 2px;
    border-right: 1px solid #ccc;
}

.col-hint:last-child {
    border-right: none;
}

.row-hints {
    display: flex;
    flex-direction: column;
    border-right: 2px solid #000;
}

.row-hint {
    width: v-bind("hintAreaSize");
    height: v-bind("cellSize");
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-right: 8px;
    gap: 6px;
    border-bottom: 1px solid #ccc;
}

.row-hint:last-child {
    border-bottom: none;
}

.hint-num {
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
}

.hint-determined {
    color: #bbb;
}

.grid {
    display: flex;
    flex-direction: column;
}

.row {
    display: flex;
}

.cell {
    border-right: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background 0.1s;
}

.cell:last-child {
    border-right: none;
}

.row:last-child .cell {
    border-bottom: none;
}

.cell:hover:not(.filled):not(.x) {
    background: #f5f5f5;
}

.cell.filled {
    background: #000;
}

.cell.x {
    background: #fff;
}

.x-mark {
    font-size: 1rem;
    font-weight: 700;
    color: #000;
}

.board-wrapper.complete .cell {
    cursor: default;
}

.controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
}

.puzzle-picker {
    display: flex;
    align-items: center;
    gap: 16px;
}

.picker-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.puzzle-select {
    padding: 8px 12px;
    font-size: 0.875rem;
    font-weight: 600;
    border: 2px solid #000;
    background: #fff;
    cursor: pointer;
}

.new-btn {
    padding: 10px 24px;
    font-size: 1rem;
    border: 2px solid #000;
}

.toast {
    padding: 8px 16px;
    background: #000;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    animation: fadeIn 0.3s ease;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
    z-index: 100;
}

.modal {
    background: #fff;
    border: 2px solid #000;
    padding: 24px;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
}

.modal-desc {
    font-size: 0.875rem;
    margin: 0;
}

.modal-input {
    padding: 8px 12px;
    font-size: 0.875rem;
    font-weight: 600;
    border: 2px solid #000;
    width: 100%;
}

.modal-error {
    font-size: 0.875rem;
    font-weight: 600;
    color: #c00;
    margin: 0;
}

.modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
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

@media (max-width: 480px) {
    .title {
        font-size: 1.5rem;
    }

    .cell {
        width: 28px !important;
        height: 28px !important;
    }

    .col-hint {
        width: 28px !important;
        height: 60px !important;
    }

    .row-hint {
        width: 60px !important;
        height: 28px !important;
    }

    .spacer {
        width: 60px !important;
        height: 60px !important;
    }
}
</style>
