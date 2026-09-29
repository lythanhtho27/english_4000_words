// Game 2: Falling Words (Mưa Từ Vựng - Thử Thách Phản Xạ)
class FallingWordsGame {
  constructor() {
    this.wordsPool = [];
    this.allWords = [];
    this.container = null;
    this.title = "Mưa Từ Vựng";
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.currentWord = null;
    this.options = [];
    this.fallingY = 0;
    this.fallingSpeed = 1.0;
    this.animId = null;
    this.isPaused = false;
    this.isGameOver = false;
    this.isRoundTransition = false;
    this.wordsQueue = [];
    this.spawnTimer = null;
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init(words, allWordsPool, containerElement, title = "Mưa Từ Vựng") {
    this.destroy(); // Clear any existing animation or timer

    this.wordsPool = [...words].sort(() => Math.random() - 0.5);
    this.allWords = allWordsPool || words;
    this.wordsQueue = [...this.wordsPool];
    this.container = containerElement;
    this.title = title;
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.fallingSpeed = 1.0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isRoundTransition = false;

    this.renderLayout();
    
    // Give browser time to lay out and measure DOM before starting first word
    this.spawnTimer = setTimeout(() => {
      this.spawnNextWord();
    }, 250);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.spawnTimer) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    }
  }

  renderLayout() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-2 animate-fade-in select-none">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-3">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-sky-600 dark:text-sky-400">
              🌧️ ${this.title}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span id="falling-lives" class="text-base font-bold text-rose-500">
                ❤️❤️❤️
              </span>
              <span id="falling-combo" class="text-xs font-bold text-amber-500 hidden">
                🔥 Combo x1
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Điểm: <strong id="falling-score" class="text-emerald-600 dark:text-emerald-400 font-bold">${this.score}</strong>
            </span>
            <button onclick="window.fallingWordsGame.togglePause()" id="falling-pause-btn"
              class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-slate-50">
              ⏸️ Tạm dừng
            </button>
          </div>
        </div>

        <!-- Falling Words Arena (Guaranteed explicit height 320px) -->
        <div id="falling-arena" style="height: 320px;" class="relative w-full rounded-3xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between">
          <!-- Background Grid Deco -->
          <div class="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <!-- Falling Item -->
          <div id="falling-item" style="top: 0px; transform: translate(-50%, 0px);" class="absolute left-1/2 flex flex-col items-center">
            <div id="falling-word-badge" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-lg sm:text-xl shadow-lg shadow-indigo-500/30 tracking-tight flex items-center gap-2">
              <span id="falling-word-text">Sẵn sàng...</span>
              <button onclick="event.stopPropagation(); window.fallingWordsGame.speakCurrentWord()" class="text-xs p-1 rounded hover:bg-white/20" title="Phát âm">
                🔊
              </button>
            </div>
            <div class="w-1.5 h-6 bg-indigo-400/40 mt-0.5 rounded-full animate-pulse"></div>
          </div>

          <!-- Danger Line at bottom -->
          <div id="falling-danger-line" class="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 opacity-70"></div>
        </div>

        <!-- Options Buttons (Vietnamese meanings) -->
        <div class="mt-4">
          <p class="text-xs text-center text-slate-400 mb-2">Chọn nghĩa tiếng Việt trước khi từ chạm đáy:</p>
          <div id="falling-options-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div class="p-4 text-center text-xs text-slate-400 col-span-2">Đang nạp từ vựng...</div>
          </div>
        </div>
      </div>
    `;
  }

  speakCurrentWord() {
    if (this.currentWord) {
      window.audioManager.speak(this.currentWord.word);
    }
  }

  spawnNextWord() {
    if (this.isGameOver) return;
    this.isRoundTransition = false;

    if (this.wordsQueue.length === 0) {
      this.wordsQueue = [...this.wordsPool].sort(() => Math.random() - 0.5);
    }

    this.currentWord = this.wordsQueue.pop();
    this.fallingY = 0;

    // Pick 3 distractors
    const distractors = [];
    const usedIds = new Set([this.currentWord.id]);
    const shuffledPool = [...this.allWords].sort(() => Math.random() - 0.5);
    for (const w of shuffledPool) {
      if (!usedIds.has(w.id) && w.meaning !== this.currentWord.meaning) {
        distractors.push(w);
        usedIds.add(w.id);
        if (distractors.length >= 3) break;
      }
    }

    this.options = [this.currentWord, ...distractors].sort(() => Math.random() - 0.5);

    // Update UI
    const wordTextEl = document.getElementById('falling-word-text');
    const wordBadge = document.getElementById('falling-word-badge');
    const item = document.getElementById('falling-item');

    if (wordTextEl) {
      wordTextEl.innerText = this.currentWord.word;
    }
    if (wordBadge) {
      wordBadge.className = 'px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-lg sm:text-xl shadow-lg shadow-indigo-500/30 tracking-tight flex items-center gap-2';
    }
    if (item) {
      item.style.transform = `translate(-50%, 0px)`;
    }

    // Render 4 options
    const optionsGrid = document.getElementById('falling-options-grid');
    if (optionsGrid) {
      optionsGrid.innerHTML = this.options.map((opt, idx) => `
        <button onclick="window.fallingWordsGame.chooseOption('${opt.id}')" id="fall-opt-${opt.id}"
          class="falling-opt-btn p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 transition active:scale-95 text-left">
          ${this.escape(opt.meaning)}
        </button>
      `).join('');
    }

    // Pronounce the word
    this.speakCurrentWord();

    // Start physics animation tick safely
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = requestAnimationFrame(() => this.tick());
  }

  tick() {
    if (this.isPaused || this.isGameOver || this.isRoundTransition) return;

    const arena = document.getElementById('falling-arena');
    const item = document.getElementById('falling-item');
    if (!arena || !item) return;

    // Robust measurement with fallbacks
    const arenaHeight = (arena.clientHeight > 100) ? arena.clientHeight : 320;
    const itemHeight = (item.clientHeight > 20) ? item.clientHeight : 48;
    const maxH = Math.max(160, arenaHeight - itemHeight - 8);

    this.fallingY += this.fallingSpeed;
    item.style.transform = `translate(-50%, ${this.fallingY}px)`;

    if (this.fallingY >= maxH) {
      // Touched bottom danger line!
      this.handleMiss();
    } else {
      this.animId = requestAnimationFrame(() => this.tick());
    }
  }

  chooseOption(selectedId) {
    if (this.isPaused || this.isGameOver || this.isRoundTransition) return;
    this.isRoundTransition = true;

    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    const clickedBtn = document.getElementById(`fall-opt-${selectedId}`);
    const correctBtn = document.getElementById(`fall-opt-${this.currentWord.id}`);
    const wordBadge = document.getElementById('falling-word-badge');

    if (selectedId === this.currentWord.id) {
      // CORRECT!
      window.audioManager.playCorrect();
      this.combo++;
      const multiplier = Math.min(3, Math.floor(this.combo / 3) + 1);
      this.score += 100 * multiplier;
      this.fallingSpeed = Math.min(3.2, this.fallingSpeed + 0.08);

      if (clickedBtn) {
        clickedBtn.classList.remove('border-slate-200', 'dark:border-slate-700');
        clickedBtn.classList.add('border-emerald-500', 'bg-emerald-500', 'text-white');
      }
      if (wordBadge) {
        wordBadge.classList.remove('from-sky-500', 'to-indigo-600');
        wordBadge.classList.add('from-emerald-500', 'to-teal-600', 'scale-110');
      }

      this.updateHUD();

      this.spawnTimer = setTimeout(() => {
        this.spawnNextWord();
      }, 700);

    } else {
      // WRONG SELECTION!
      window.audioManager.playWrong();
      this.lives--;
      this.combo = 0;

      if (clickedBtn) {
        clickedBtn.classList.add('border-rose-500', 'bg-rose-500', 'text-white', 'shake-anim');
      }
      if (correctBtn) {
        correctBtn.classList.add('border-emerald-500', 'bg-emerald-100', 'dark:bg-emerald-950/60', 'text-emerald-800', 'dark:text-emerald-200');
      }

      this.updateHUD();

      if (this.lives <= 0) {
        this.spawnTimer = setTimeout(() => this.gameOver(), 800);
      } else {
        this.spawnTimer = setTimeout(() => {
          this.spawnNextWord();
        }, 900);
      }
    }
  }

  handleMiss() {
    if (this.isRoundTransition) return;
    this.isRoundTransition = true;

    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    this.lives--;
    this.combo = 0;
    window.audioManager.playWrong();

    // Red flash on danger line
    const dangerLine = document.getElementById('falling-danger-line');
    if (dangerLine) {
      dangerLine.classList.add('bg-rose-600', 'h-4');
      setTimeout(() => dangerLine.classList.remove('bg-rose-600', 'h-4'), 400);
    }

    // Highlight correct option
    const correctBtn = document.getElementById(`fall-opt-${this.currentWord.id}`);
    if (correctBtn) {
      correctBtn.classList.add('border-emerald-500', 'bg-emerald-100', 'dark:bg-emerald-950/60');
    }

    this.updateHUD();

    if (this.lives <= 0) {
      this.spawnTimer = setTimeout(() => this.gameOver(), 800);
    } else {
      this.spawnTimer = setTimeout(() => {
        this.spawnNextWord();
      }, 800);
    }
  }

  updateHUD() {
    const livesEl = document.getElementById('falling-lives');
    const scoreEl = document.getElementById('falling-score');
    const comboEl = document.getElementById('falling-combo');

    if (livesEl) {
      livesEl.innerText = (this.lives > 0) ? '❤️'.repeat(this.lives) : '💀';
    }
    if (scoreEl) {
      scoreEl.innerText = this.score;
    }
    if (comboEl) {
      if (this.combo >= 2) {
        comboEl.classList.remove('hidden');
        comboEl.innerText = `🔥 Combo x${Math.min(3, Math.floor(this.combo / 3) + 1)}`;
      } else {
        comboEl.classList.add('hidden');
      }
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('falling-pause-btn');
    if (btn) btn.innerText = this.isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';

    if (!this.isPaused && !this.isGameOver && !this.isRoundTransition) {
      this.tick();
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.destroy();
    window.audioManager.playFanfare();

    this.container.innerHTML = `
      <div class="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in select-none">
        <div class="text-5xl mb-3">🌧️</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Hết Lượt Chơi!</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Số điểm phản xạ của bạn:
        </p>
        <div class="my-4 text-4xl font-black text-indigo-600 dark:text-indigo-400">
          ${this.score} <span class="text-sm font-semibold text-slate-400">điểm</span>
        </div>

        <div class="mt-6 flex flex-col gap-2.5">
          <button onclick="window.fallingWordsGame.init(window.fallingWordsGame.wordsPool, window.fallingWordsGame.allWords, window.fallingWordsGame.container, window.fallingWordsGame.title)"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
            🔄 Chơi lại
          </button>
          <button onclick="window.app.showGamesHub()"
            class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm transition">
            Trở về Khu Vực Trò Chơi
          </button>
        </div>
      </div>
    `;
  }
}

window.fallingWordsGame = new FallingWordsGame();
