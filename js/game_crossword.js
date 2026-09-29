// Game 6: Mini Crossword (Ô Chữ Mini Theo Từng Unit)
class MiniCrosswordGame {
  constructor() {
    this.wordsPool = [];
    this.container = null;
    this.title = "Ô Chữ Mini";
    this.gridSize = 10;
    this.grid = [];      // 2D array of { char, cellNum, acrossWord, downWord, userChar }
    this.placedWords = []; // { id, word, meaning, def_en, direction, row, col, number, solved }
    this.activeWordId = null;
    this.activeCell = null;
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init(words, containerElement, title = "Ô Chữ Mini") {
    // Filter words suitable for crossword (3 to 8 letters)
    this.wordsPool = words.filter(w => w.word.length >= 3 && w.word.length <= 8 && /^[a-zA-Z]+$/.test(w.word));
    this.container = containerElement;
    this.title = title;

    this.buildPuzzle();
    this.render();
  }

  buildPuzzle() {
    this.gridSize = 10;
    this.grid = Array.from({ length: this.gridSize }, () =>
      Array.from({ length: this.gridSize }, () => null)
    );
    this.placedWords = [];

    const candidates = [...this.wordsPool].sort(() => Math.random() - 0.5);
    if (candidates.length === 0) return;

    // Place Word 1 horizontally near row 3, col 1
    const w1 = candidates[0];
    const r1 = 3;
    const c1 = Math.max(1, Math.floor((this.gridSize - w1.word.length) / 2));
    
    this.placeWord(w1, r1, c1, 'across', 1);

    let wordNumber = 2;

    // Try to place up to 4 more words intersecting
    for (let i = 1; i < candidates.length && this.placedWords.length < 5; i++) {
      const cand = candidates[i];
      const placement = this.findIntersection(cand);
      if (placement) {
        this.placeWord(cand, placement.row, placement.col, placement.direction, wordNumber++);
      }
    }

    // Number starting cells
    this.placedWords.forEach(pw => {
      if (this.grid[pw.row][pw.col]) {
        this.grid[pw.row][pw.col].number = pw.number;
      }
    });

    if (this.placedWords.length > 0) {
      this.activeWordId = this.placedWords[0].id;
    }
  }

  findIntersection(cand) {
    const candLetters = cand.word.toUpperCase();

    for (const placed of this.placedWords) {
      const placedLetters = placed.word.toUpperCase();
      const newDir = placed.direction === 'across' ? 'down' : 'across';

      for (let pIdx = 0; pIdx < placedLetters.length; pIdx++) {
        for (let cIdx = 0; cIdx < candLetters.length; cIdx++) {
          if (placedLetters[pIdx] === candLetters[cIdx]) {
            let row = placed.row;
            let col = placed.col;

            if (placed.direction === 'across') {
              col += pIdx;
              row -= cIdx; // candidate will go down
            } else {
              row += pIdx;
              col -= cIdx; // candidate will go across
            }

            if (this.canPlace(candLetters, row, col, newDir, placed.id)) {
              return { row, col, direction: newDir };
            }
          }
        }
      }
    }
    return null;
  }

  canPlace(wordStr, startRow, startCol, direction, excludePlacedId) {
    const len = wordStr.length;
    if (startRow < 0 || startCol < 0) return false;
    if (direction === 'across' && startCol + len > this.gridSize) return false;
    if (direction === 'down' && startRow + len > this.gridSize) return false;

    for (let i = 0; i < len; i++) {
      const r = direction === 'across' ? startRow : startRow + i;
      const c = direction === 'across' ? startCol + i : startCol;

      const cell = this.grid[r][c];
      if (cell !== null) {
        if (cell.char !== wordStr[i]) return false;
      } else {
        // Check adjacent cells so words don't merge illegally
        if (direction === 'across') {
          if (r > 0 && this.grid[r - 1][c] !== null && this.grid[r - 1][c].wordId !== excludePlacedId) return false;
          if (r < this.gridSize - 1 && this.grid[r + 1][c] !== null && this.grid[r + 1][c].wordId !== excludePlacedId) return false;
        } else {
          if (c > 0 && this.grid[r][c - 1] !== null && this.grid[r][c - 1].wordId !== excludePlacedId) return false;
          if (c < this.gridSize - 1 && this.grid[r][c + 1] !== null && this.grid[r][c + 1].wordId !== excludePlacedId) return false;
        }
      }
    }
    return true;
  }

  placeWord(wordObj, row, col, direction, number) {
    const letters = wordObj.word.toUpperCase();
    const pw = {
      id: wordObj.id,
      word: wordObj.word,
      meaning: wordObj.meaning,
      def_en: wordObj.def_en,
      direction: direction,
      row: row,
      col: col,
      number: number,
      solved: false
    };

    for (let i = 0; i < letters.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;

      if (!this.grid[r][c]) {
        this.grid[r][c] = {
          char: letters[i],
          userChar: '',
          number: null,
          row: r,
          col: c,
          words: [pw]
        };
      } else {
        this.grid[r][c].words.push(pw);
      }
    }

    this.placedWords.push(pw);
  }

  render() {
    if (!this.container) return;
    if (this.placedWords.length === 0) {
      this.container.innerHTML = `
        <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
          <p class="text-slate-400">Không tạo được ô chữ từ bài học này. Hãy chọn bài khác!</p>
        </div>
      `;
      return;
    }

    const acrossWords = this.placedWords.filter(w => w.direction === 'across');
    const downWords = this.placedWords.filter(w => w.direction === 'down');

    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-2 animate-fade-in select-none">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-purple-600 dark:text-purple-400">
              📰 ${this.title}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-base font-bold text-slate-800 dark:text-white">
                Ô Chữ Gồm ${this.placedWords.length} Từ Vựng
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.miniCrosswordGame.giveHint()" 
              class="px-3.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition flex items-center gap-1.5">
              <span>💡</span> Gợi ý chữ
            </button>
            <button onclick="window.miniCrosswordGame.checkPuzzle()" 
              class="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition">
              ✓ Kiểm tra
            </button>
          </div>
        </div>

        <!-- Crossword Body: Grid on Left, Clues on Right -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Crossword Matrix Grid (7 cols on lg) -->
          <div class="lg:col-span-7 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
            <div class="grid grid-cols-10 gap-1 sm:gap-1.5 max-w-full overflow-x-auto p-2" id="crossword-matrix">
              ${this.renderGridHTML()}
            </div>
            <p class="text-[11px] text-slate-400 mt-3 text-center">
              Nhấp vào ô hoặc gợi ý bên cạnh để điền chữ cái. Dùng phím mũi tên và Backspace để di chuyển.
            </p>
          </div>

          <!-- Clues List (5 cols on lg) -->
          <div class="lg:col-span-5 space-y-4">
            <!-- Across Clues -->
            <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                <span>➡️</span> Hàng Ngang (Across)
              </h3>
              <div class="space-y-2">
                ${acrossWords.map(w => this.renderClueItem(w)).join('')}
              </div>
            </div>

            <!-- Down Clues -->
            <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 class="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                <span>⬇️</span> Hàng Dọc (Down)
              </h3>
              <div class="space-y-2">
                ${downWords.map(w => this.renderClueItem(w)).join('')}
              </div>
            </div>
          </div>

        </div>

        <div id="crossword-feedback" class="mt-4 text-center font-bold text-sm min-h-[30px]"></div>
      </div>
    `;
  }

  renderGridHTML() {
    let html = '';
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.grid[r][c];
        if (cell === null) {
          html += `<div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-900/60 select-none"></div>`;
        } else {
          const isCorrect = cell.userChar.toUpperCase() === cell.char.toUpperCase();
          html += `
            <div class="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-sm sm:text-base ${isCorrect && cell.userChar ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}">
              ${cell.number ? `<span class="absolute top-0.5 left-1 text-[9px] font-bold text-slate-400 leading-none">${cell.number}</span>` : ''}
              <input type="text" maxlength="1" id="cell-${r}-${c}" value="${cell.userChar}"
                oninput="window.miniCrosswordGame.handleCellInput(${r}, ${c}, this.value)"
                onkeydown="window.miniCrosswordGame.handleCellKey(${r}, ${c}, event)"
                class="w-full h-full text-center uppercase font-black bg-transparent focus:outline-none focus:bg-indigo-50 dark:focus:bg-indigo-950/60 rounded-lg">
            </div>
          `;
        }
      }
    }
    return html;
  }

  renderClueItem(w) {
    const isSolved = w.solved;
    return `
      <div onclick="window.miniCrosswordGame.focusWord('${w.id}')"
        class="p-2.5 rounded-2xl border transition cursor-pointer flex items-start gap-2.5 ${isSolved ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-purple-300'}">
        <span class="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
          ${w.number}
        </span>
        <div class="flex-1">
          <p class="text-xs font-bold text-slate-800 dark:text-white leading-tight">
            ${this.escape(w.meaning)}
            ${isSolved ? `<span class="text-emerald-600 text-xs font-semibold ml-1">(✓ ${this.escape(w.word)})</span>` : ''}
          </p>
          <p class="text-[11px] text-slate-400 italic mt-0.5 leading-snug line-clamp-2">
            "${this.escape(w.def_en)}"
          </p>
        </div>
        <button onclick="event.stopPropagation(); window.app.speakWord('${w.id}')" class="p-1 text-slate-400 hover:text-indigo-600 text-xs shrink-0" title="Phát âm">
          🔊
        </button>
      </div>
    `;
  }

  handleCellInput(r, c, val) {
    if (!this.grid[r][c]) return;
    const clean = val.slice(-1).toUpperCase();
    this.grid[r][c].userChar = clean;

    const input = document.getElementById(`cell-${r}-${c}`);
    if (input) input.value = clean;

    // Check words that contain this cell
    this.checkSolvedState();

    // Auto move to next cell in active direction
    if (clean) {
      this.moveFocusNext(r, c);
    }
  }

  handleCellKey(r, c, e) {
    if (e.key === 'Backspace' && !this.grid[r][c].userChar) {
      e.preventDefault();
      this.moveFocusPrev(r, c);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.focusCell(r, c + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.focusCell(r, c - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusCell(r + 1, c);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusCell(r - 1, c);
    }
  }

  focusCell(r, c) {
    if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize && this.grid[r][c]) {
      const el = document.getElementById(`cell-${r}-${c}`);
      if (el) el.focus();
    }
  }

  moveFocusNext(r, c) {
    // Try right, then down
    if (c + 1 < this.gridSize && this.grid[r][c + 1]) {
      this.focusCell(r, c + 1);
    } else if (r + 1 < this.gridSize && this.grid[r + 1][c]) {
      this.focusCell(r + 1, c);
    }
  }

  moveFocusPrev(r, c) {
    if (c - 1 >= 0 && this.grid[r][c - 1]) {
      this.focusCell(r, c - 1);
    } else if (r - 1 >= 0 && this.grid[r - 1][c]) {
      this.focusCell(r - 1, c);
    }
  }

  focusWord(wordId) {
    const pw = this.placedWords.find(w => w.id === wordId);
    if (pw) {
      this.focusCell(pw.row, pw.col);
    }
  }

  giveHint() {
    // Find first unsolved cell
    for (const pw of this.placedWords) {
      if (!pw.solved) {
        for (let i = 0; i < pw.word.length; i++) {
          const r = pw.direction === 'across' ? pw.row : pw.row + i;
          const c = pw.direction === 'across' ? pw.col + i : pw.col;
          const cell = this.grid[r][c];
          if (cell.userChar.toUpperCase() !== cell.char.toUpperCase()) {
            cell.userChar = cell.char.toUpperCase();
            const el = document.getElementById(`cell-${r}-${c}`);
            if (el) el.value = cell.char.toUpperCase();
            this.checkSolvedState();
            return;
          }
        }
      }
    }
  }

  checkSolvedState() {
    let allSolved = true;

    for (const pw of this.placedWords) {
      let wordMatches = true;
      for (let i = 0; i < pw.word.length; i++) {
        const r = pw.direction === 'across' ? pw.row : pw.row + i;
        const c = pw.direction === 'across' ? pw.col + i : pw.col;
        const cell = this.grid[r][c];
        if (cell.userChar.toUpperCase() !== cell.char.toUpperCase()) {
          wordMatches = false;
          break;
        }
      }
      pw.solved = wordMatches;
      if (!wordMatches) allSolved = false;
    }

    if (allSolved) {
      window.audioManager.playFanfare();
      const feedback = document.getElementById('crossword-feedback');
      if (feedback) {
        feedback.innerHTML = `
          <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200">
            🎉 Xuất sắc! Bạn đã giải chính xác toàn bộ ô chữ!
          </div>
        `;
      }
    }
  }

  checkPuzzle() {
    this.checkSolvedState();
    const unsolvedCount = this.placedWords.filter(w => !w.solved).length;
    const feedback = document.getElementById('crossword-feedback');
    if (unsolvedCount === 0) {
      window.audioManager.playCorrect();
    } else {
      window.audioManager.playWrong();
      if (feedback) {
        feedback.innerHTML = `<span class="text-amber-500 font-bold">Còn ${unsolvedCount} từ chưa giải đúng. Hãy tiếp tục cố gắng!</span>`;
      }
    }
  }
}

window.miniCrosswordGame = new MiniCrosswordGame();
