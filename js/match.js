// Match Game: Fast-paced word-meaning matching game (Zero persistent data)
class MatchGame {
  constructor() {
    this.wordsPool = [];
    this.remainingPool = [];
    this.currentTiles = []; // { id, wordId, type: 'en'|'vi', text, matched: false }
    this.selectedTile = null;
    this.matchedPairs = 0;
    this.totalPairs = 0;
    this.timer = 0;
    this.timerInterval = null;
    this.container = null;
    this.title = "Nối từ nhanh";
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init(words, containerElement, title = "Game Nối từ") {
    this.wordsPool = [...words].sort(() => Math.random() - 0.5);
    this.remainingPool = [...this.wordsPool];
    this.totalPairs = this.wordsPool.length;
    this.matchedPairs = 0;
    this.container = containerElement;
    this.title = title;
    this.timer = 0;
    this.selectedTile = null;

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer++;
      const timerEl = document.getElementById('match-timer');
      if (timerEl) {
        const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
        const secs = String(this.timer % 60).padStart(2, '0');
        timerEl.innerText = `${mins}:${secs}`;
      }
    }, 1000);

    this.startRound();
  }

  destroy() {
    clearInterval(this.timerInterval);
  }

  startRound() {
    if (this.remainingPool.length === 0) {
      this.renderComplete();
      return;
    }

    const roundWords = this.remainingPool.splice(0, 6);
    this.currentTiles = [];

    roundWords.forEach(w => {
      this.currentTiles.push({
        tileId: `en_${w.id}`,
        wordId: w.id,
        type: 'en',
        text: w.word,
        rawWord: w,
        matched: false
      });
      this.currentTiles.push({
        tileId: `vi_${w.id}`,
        wordId: w.id,
        type: 'vi',
        text: w.meaning,
        rawWord: w,
        matched: false
      });
    });

    this.currentTiles.sort(() => Math.random() - 0.5);
    this.selectedTile = null;
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-2">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">${this.title}</span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-base font-bold text-slate-800 dark:text-white">
                Đã ghép: ${this.matchedPairs} / ${this.totalPairs}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <span>⏱️</span> <span id="match-timer">00:00</span>
            </span>
          </div>
        </div>

        <p class="text-xs text-slate-400 dark:text-slate-500 mb-4 text-center">
          Nhấn vào một từ tiếng Anh và nghĩa tiếng Việt tương ứng để nối chúng!
        </p>

        <!-- Grid of Tiles -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6" id="match-tiles-grid">
          ${this.currentTiles.map((t, idx) => `
            <button onclick="window.matchGame.selectTile(${idx})" id="tile-${t.tileId}"
              class="match-tile ${t.matched ? 'invisible pointer-events-none' : ''} p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base text-center hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 flex items-center justify-center min-h-[90px] select-none active:scale-95">
              ${this.escape(t.text)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  selectTile(tileIndex) {
    const tile = this.currentTiles[tileIndex];
    if (!tile || tile.matched) return;

    const tileEl = document.getElementById(`tile-${tile.tileId}`);
    if (!tileEl) return;

    if (tile.type === 'en') {
      window.app.speakWord(tile.rawWord.id);
    }

    if (!this.selectedTile) {
      this.selectedTile = { tile, index: tileIndex };
      tileEl.classList.add('border-indigo-600', 'bg-indigo-50', 'dark:bg-indigo-950/60', 'scale-105');
      return;
    }

    if (this.selectedTile.index === tileIndex) {
      tileEl.classList.remove('border-indigo-600', 'bg-indigo-50', 'dark:bg-indigo-950/60', 'scale-105');
      this.selectedTile = null;
      return;
    }

    const prevTile = this.selectedTile.tile;
    const prevEl = document.getElementById(`tile-${prevTile.tileId}`);

    if (prevTile.wordId === tile.wordId && prevTile.type !== tile.type) {
      window.audioManager.playCorrect();
      this.matchedPairs++;

      prevTile.matched = true;
      tile.matched = true;

      if (prevEl) {
        prevEl.className = 'match-tile p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold scale-95 transition-all duration-300 flex items-center justify-center min-h-[90px]';
      }
      tileEl.className = 'match-tile p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold scale-95 transition-all duration-300 flex items-center justify-center min-h-[90px]';

      setTimeout(() => {
        if (prevEl) prevEl.classList.add('invisible', 'pointer-events-none');
        if (tileEl) tileEl.classList.add('invisible', 'pointer-events-none');

        const remainingInRound = this.currentTiles.filter(t => !t.matched);
        if (remainingInRound.length === 0) {
          this.startRound();
        }
      }, 350);

      this.selectedTile = null;
    } else {
      window.audioManager.playWrong();

      tileEl.classList.add('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/60', 'shake-anim');
      if (prevEl) {
        prevEl.classList.add('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/60', 'shake-anim');
      }

      setTimeout(() => {
        if (prevEl) {
          prevEl.classList.remove('border-indigo-600', 'border-rose-500', 'bg-indigo-50', 'bg-rose-50', 'dark:bg-indigo-950/60', 'dark:bg-rose-950/60', 'scale-105', 'shake-anim');
        }
        tileEl.classList.remove('border-indigo-600', 'border-rose-500', 'bg-indigo-50', 'bg-rose-50', 'dark:bg-indigo-950/60', 'dark:bg-rose-950/60', 'scale-105', 'shake-anim');
      }, 500);

      this.selectedTile = null;
    }
  }

  renderComplete() {
    clearInterval(this.timerInterval);
    window.audioManager.playFanfare();

    const mins = Math.floor(this.timer / 60);
    const secs = this.timer % 60;
    const timeFormatted = `${mins > 0 ? `${mins} phút ` : ''}${secs} giây`;

    this.container.innerHTML = `
      <div class="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
        <div class="text-5xl mb-3">⚡</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Xuất sắc! Đã nối hết các từ!</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Thời gian hoàn thành: <strong class="text-indigo-600 dark:text-indigo-400 text-base">${timeFormatted}</strong>
        </p>

        <div class="mt-6 flex flex-col gap-2.5">
          <button onclick="window.matchGame.init(window.matchGame.wordsPool, window.matchGame.container, window.matchGame.title)"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
            🔄 Chơi lại
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

window.matchGame = new MatchGame();
