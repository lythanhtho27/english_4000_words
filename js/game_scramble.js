// Game 1: Word Scramble (Xáo Chữ Ghép Từ)
class WordScrambleGame {
  constructor() {
    this.words = [];
    this.currentIndex = 0;
    this.score = 0;
    this.container = null;
    this.title = "Xáo Chữ Ghép Từ";
    this.scrambledTiles = []; // { id, char, used }
    this.placedSlots = [];    // { char, tileId }
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init(words, containerElement, title = "Xáo Chữ Ghép Từ") {
    this.words = [...words].sort(() => Math.random() - 0.5);
    this.container = containerElement;
    this.title = title;
    this.currentIndex = 0;
    this.score = 0;

    window.removeEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keydown', this.boundKeyDown);

    this.loadCurrentWord();
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
  }

  handleKeyDown(e) {
    if (!this.container || this.container.offsetParent === null) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.removeLastPlaced();
    } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
      // Find unused tile with this letter
      const char = e.key.toLowerCase();
      const tile = this.scrambledTiles.find(t => !t.used && t.char.toLowerCase() === char);
      if (tile) {
        this.selectTile(tile.id);
      }
    }
  }

  loadCurrentWord() {
    if (this.currentIndex >= this.words.length) {
      this.renderComplete();
      return;
    }

    const word = this.words[this.currentIndex];
    const letters = word.word.trim().split('');
    
    // Scramble letters until different from original
    let shuffled = [...letters];
    let attempts = 0;
    while (shuffled.join('').toLowerCase() === word.word.trim().toLowerCase() && letters.length > 2 && attempts < 10) {
      shuffled.sort(() => Math.random() - 0.5);
      attempts++;
    }

    this.scrambledTiles = shuffled.map((char, idx) => ({
      id: `tile_${idx}`,
      char: char,
      used: false
    }));

    this.placedSlots = [];
    this.render();
  }

  render() {
    if (!this.container) return;
    const word = this.words[this.currentIndex];
    const targetWord = word.word.trim();
    const progressPct = ((this.currentIndex + 1) / this.words.length) * 100;

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-2 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">
              🔤 ${this.title}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-base font-bold text-slate-800 dark:text-white">
                Từ ${this.currentIndex + 1} / ${this.words.length}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Điểm: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${this.score}</strong>
            </span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-6">
          <div class="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full" style="width: ${progressPct}%"></div>
        </div>

        <!-- Clue Card -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <button onclick="window.app.speakWord('${word.id}')" 
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold transition" title="Nghe phát âm">
              <span>🔊</span> Phát âm
            </button>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
              ${targetWord.length} chữ cái
            </span>
          </div>

          <h2 class="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight my-2">
            ${this.escape(word.meaning)}
          </h2>

          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic mt-1">
            "${this.escape(word.def_en)}"
          </p>
        </div>

        <!-- Target Placement Slots -->
        <div class="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-3xl mb-6 border border-slate-200 dark:border-slate-800">
          <div class="text-center text-xs text-slate-400 mb-2">Từ bạn ghép (Nhấp vào chữ để gỡ bỏ hoặc phím Backspace):</div>
          <div id="scramble-target-slots" class="flex flex-wrap justify-center items-center gap-2 min-h-[56px]">
            ${this.renderTargetSlots(targetWord.length)}
          </div>
        </div>

        <!-- Scrambled Letter Tiles Pool -->
        <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 text-center">
          <div class="text-xs text-slate-400 mb-3">Nhấp hoặc gõ phím để chọn chữ cái:</div>
          <div id="scramble-tiles-pool" class="flex flex-wrap justify-center items-center gap-2.5">
            ${this.renderTilesPool()}
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flex items-center justify-between gap-3">
          <button onclick="window.wordScrambleGame.resetWord()" 
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition">
            🔄 Xếp lại từ này
          </button>
          <button onclick="window.wordScrambleGame.giveHint()" 
            class="px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1.5">
            <span>💡</span> Gợi ý 1 chữ
          </button>
          <button onclick="window.wordScrambleGame.skipWord()" 
            class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-medium transition">
            Bỏ qua →
          </button>
        </div>

        <div id="scramble-feedback" class="mt-4 text-center font-bold text-sm min-h-[28px]"></div>
      </div>
    `;
  }

  renderTargetSlots(totalLength) {
    const slots = [];
    for (let i = 0; i < totalLength; i++) {
      const placed = this.placedSlots[i];
      if (placed) {
        slots.push(`
          <button onclick="window.wordScrambleGame.unplaceSlot(${i})" 
            class="w-11 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl shadow-md flex items-center justify-center transition transform active:scale-90 hover:bg-indigo-700 cursor-pointer">
            ${placed.char}
          </button>
        `);
      } else {
        slots.push(`
          <div class="w-11 h-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 select-none">
            _
          </div>
        `);
      }
    }
    return slots.join('');
  }

  renderTilesPool() {
    return this.scrambledTiles.map(t => `
      <button onclick="window.wordScrambleGame.selectTile('${t.id}')" ${t.used ? 'disabled' : ''}
        class="w-12 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 font-black text-xl flex items-center justify-center transition-all ${t.used ? 'opacity-20 border-slate-200 dark:border-slate-700 cursor-not-allowed scale-90' : 'bg-slate-50 dark:bg-slate-700 border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-white hover:border-indigo-500 hover:scale-105 active:scale-95 shadow-sm'}">
        ${t.char}
      </button>
    `).join('');
  }

  selectTile(tileId) {
    const tile = this.scrambledTiles.find(t => t.id === tileId);
    if (!tile || tile.used) return;

    tile.used = true;
    this.placedSlots.push({ char: tile.char, tileId: tile.id });
    this.updateSlotsAndCheck();
  }

  unplaceSlot(index) {
    const placed = this.placedSlots[index];
    if (!placed) return;

    const tile = this.scrambledTiles.find(t => t.id === placed.tileId);
    if (tile) tile.used = false;

    this.placedSlots.splice(index, 1);
    this.updateSlotsAndCheck();
  }

  removeLastPlaced() {
    if (this.placedSlots.length === 0) return;
    this.unplaceSlot(this.placedSlots.length - 1);
  }

  resetWord() {
    this.scrambledTiles.forEach(t => t.used = false);
    this.placedSlots = [];
    this.updateSlotsAndCheck();
  }

  giveHint() {
    const word = this.words[this.currentIndex];
    const target = word.word.trim();
    const nextIdx = this.placedSlots.length;
    if (nextIdx >= target.length) return;

    const correctChar = target[nextIdx];
    // Find unused tile with this char
    const tile = this.scrambledTiles.find(t => !t.used && t.char.toLowerCase() === correctChar.toLowerCase());
    if (tile) {
      this.selectTile(tile.id);
    }
  }

  skipWord() {
    this.currentIndex++;
    this.loadCurrentWord();
  }

  updateSlotsAndCheck() {
    const word = this.words[this.currentIndex];
    const target = word.word.trim();

    // Re-render target slots and pool
    const targetContainer = document.getElementById('scramble-target-slots');
    const poolContainer = document.getElementById('scramble-tiles-pool');
    if (targetContainer) targetContainer.innerHTML = this.renderTargetSlots(target.length);
    if (poolContainer) poolContainer.innerHTML = this.renderTilesPool();

    // Check completion
    if (this.placedSlots.length === target.length) {
      const userWord = this.placedSlots.map(s => s.char).join('');
      const feedback = document.getElementById('scramble-feedback');

      if (userWord.toLowerCase() === target.toLowerCase()) {
        window.audioManager.playCorrect();
        window.audioManager.speak(word.word);
        this.score++;

        if (feedback) {
          feedback.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400">✓ Tuyệt vời! Chính xác là: <strong>${this.escape(word.word)}</strong></span>`;
        }

        setTimeout(() => {
          this.currentIndex++;
          this.loadCurrentWord();
        }, 1100);
      } else {
        window.audioManager.playWrong();
        if (feedback) {
          feedback.innerHTML = `<span class="text-rose-500">Chưa đúng thứ tự, hãy thử lại!</span>`;
        }
      }
    }
  }

  renderComplete() {
    window.audioManager.playFanfare();
    this.container.innerHTML = `
      <div class="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
        <div class="text-5xl mb-3">🏆</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Hoàn thành Xáo Chữ!</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Bạn đã ghép đúng <strong>${this.score} / ${this.words.length}</strong> từ vựng.
        </p>

        <div class="mt-6 flex flex-col gap-2.5">
          <button onclick="window.wordScrambleGame.init(window.wordScrambleGame.words, window.wordScrambleGame.container, window.wordScrambleGame.title)"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
            🔄 Chơi lại lượt này
          </button>
          <button onclick="window.app.showUnitList()"
            class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm transition">
            Danh sách bài học
          </button>
        </div>
      </div>
    `;
  }
}

window.wordScrambleGame = new WordScrambleGame();
