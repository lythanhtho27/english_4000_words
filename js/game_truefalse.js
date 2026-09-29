// Game 5: True or False? (Đúng Hay Sai - Quyết Định 3 Giây)
class TrueFalseGame {
  constructor() {
    this.words = [];
    this.allWords = [];
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.container = null;
    this.title = "Đúng Hay Sai 3 Giây";
    this.currentPair = null; // { word, displayedMeaning, isActuallyTrue }
    this.timer = null;
    this.timeLeft = 3.0; // 3 seconds
    this.timerInterval = null;
    this.answered = false;
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init(words, allWordsPool, containerElement, title = "Đúng Hay Sai 3 Giây") {
    this.words = [...words].sort(() => Math.random() - 0.5);
    this.allWords = allWordsPool || words;
    this.container = containerElement;
    this.title = title;
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;

    window.removeEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keydown', this.boundKeyDown);

    this.nextRound();
  }

  destroy() {
    clearInterval(this.timerInterval);
    window.removeEventListener('keydown', this.boundKeyDown);
  }

  handleKeyDown(e) {
    if (!this.container || this.container.offsetParent === null) return;
    if (this.answered) return;

    if (e.key === '1' || e.code === 'ArrowLeft') {
      e.preventDefault();
      this.answer(true);
    } else if (e.key === '2' || e.code === 'ArrowRight') {
      e.preventDefault();
      this.answer(false);
    }
  }

  nextRound() {
    clearInterval(this.timerInterval);

    if (this.currentIndex >= Math.min(20, this.words.length)) {
      this.renderComplete();
      return;
    }

    const word = this.words[this.currentIndex];
    const isActuallyTrue = Math.random() < 0.5;
    let displayedMeaning = word.meaning;

    if (!isActuallyTrue) {
      // Pick random different meaning
      const otherWords = this.allWords.filter(w => w.meaning !== word.meaning);
      const randomOther = otherWords[Math.floor(Math.random() * otherWords.length)];
      displayedMeaning = randomOther ? randomOther.meaning : "nghĩa khác";
    }

    this.currentPair = {
      word: word,
      displayedMeaning: displayedMeaning,
      isActuallyTrue: isActuallyTrue
    };

    this.answered = false;
    this.timeLeft = 3.0;
    this.render();

    // Auto speak English word
    window.audioManager.speak(word.word);

    // Start 3-second countdown timer
    const timerStep = 50; // ms
    this.timerInterval = setInterval(() => {
      this.timeLeft -= timerStep / 1000;
      const bar = document.getElementById('tf-countdown-bar');
      const timeText = document.getElementById('tf-countdown-text');

      if (bar) {
        const pct = Math.max(0, (this.timeLeft / 3.0) * 100);
        bar.style.width = `${pct}%`;
      }
      if (timeText) {
        timeText.innerText = Math.max(0, this.timeLeft).toFixed(1) + 's';
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeout();
      }
    }, timerStep);
  }

  render() {
    if (!this.container) return;
    const current = this.currentPair;
    const totalRounds = Math.min(20, this.words.length);

    this.container.innerHTML = `
      <div class="max-w-xl mx-auto px-4 py-2 animate-fade-in select-none">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
              ⚡ ${this.title}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-base font-bold text-slate-800 dark:text-white">
                Câu ${this.currentIndex + 1} / ${totalRounds}
              </span>
              ${this.streak >= 2 ? `
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 animate-pulse">
                  🔥 Chuỗi: ${this.streak}
                </span>
              ` : ''}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900">
              ⏱️ <span id="tf-countdown-text">3.0s</span>
            </span>
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Điểm: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${this.score}</strong>
            </span>
          </div>
        </div>

        <!-- 3s Countdown Bar -->
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-6">
          <div id="tf-countdown-bar" class="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-75 rounded-full" style="width: 100%"></div>
        </div>

        <!-- Word Pair Card -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-700 mb-6 text-center">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
            Từ vựng này có nghĩa sau đúng hay sai?
          </span>

          <div class="my-4">
            <div class="flex items-center justify-center gap-3">
              <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                ${this.escape(current.word.word)}
              </h2>
              <button onclick="window.app.speakWord('${current.word.id}')" class="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition" title="Nghe phát âm">
                🔊
              </button>
            </div>
            ${current.word.pos ? `<span class="inline-block text-xs font-semibold text-slate-400 mt-1">(${this.escape(current.word.pos)})</span>` : ''}
          </div>

          <div class="py-4 px-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 my-2">
            <span class="text-xs text-slate-400 uppercase tracking-wider block mb-1">Nghĩa hiển thị:</span>
            <span class="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              "${this.escape(current.displayedMeaning)}"
            </span>
          </div>
        </div>

        <!-- 2 Big Buttons: TRUE vs FALSE -->
        <div class="grid grid-cols-2 gap-4" id="tf-action-buttons">
          <button onclick="window.trueFalseGame.answer(true)" id="btn-true"
            class="py-5 px-6 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-600/25 active:scale-95 transition flex flex-col items-center justify-center gap-1">
            <span class="text-3xl">✓</span>
            <span>ĐÚNG</span>
            <span class="text-[11px] font-normal opacity-70 hidden sm:inline">[Phím 1 hoặc ←]</span>
          </button>

          <button onclick="window.trueFalseGame.answer(false)" id="btn-false"
            class="py-5 px-6 rounded-3xl bg-rose-600 hover:bg-rose-700 text-white font-black text-lg sm:text-xl shadow-lg shadow-rose-600/25 active:scale-95 transition flex flex-col items-center justify-center gap-1">
            <span class="text-3xl">✕</span>
            <span>SAI</span>
            <span class="text-[11px] font-normal opacity-70 hidden sm:inline">[Phím 2 hoặc →]</span>
          </button>
        </div>

        <div id="tf-feedback" class="mt-4 text-center font-bold text-sm min-h-[30px]"></div>
      </div>
    `;
  }

  answer(userChoice) {
    if (this.answered) return;
    this.answered = true;
    clearInterval(this.timerInterval);

    const isCorrect = userChoice === this.currentPair.isActuallyTrue;
    const feedback = document.getElementById('tf-feedback');

    if (isCorrect) {
      window.audioManager.playCorrect();
      this.score++;
      this.streak++;
      if (feedback) {
        feedback.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 animate-fade-in">✓ Chính xác! (${this.escape(this.currentPair.word.word)}: ${this.escape(this.currentPair.word.meaning)})</span>`;
      }
    } else {
      window.audioManager.playWrong();
      this.streak = 0;
      if (feedback) {
        feedback.innerHTML = `<span class="text-rose-500 animate-fade-in">✕ Chưa đúng! Nghĩa đúng là: <strong>${this.escape(this.currentPair.word.meaning)}</strong></span>`;
      }
    }

    setTimeout(() => {
      this.currentIndex++;
      this.nextRound();
    }, 1100);
  }

  handleTimeout() {
    if (this.answered) return;
    this.answered = true;
    window.audioManager.playWrong();
    this.streak = 0;

    const feedback = document.getElementById('tf-feedback');
    if (feedback) {
      feedback.innerHTML = `<span class="text-rose-500 animate-fade-in">⏰ Hết 3 giây! Nghĩa đúng là: <strong>${this.escape(this.currentPair.word.meaning)}</strong></span>`;
    }

    setTimeout(() => {
      this.currentIndex++;
      this.nextRound();
    }, 1200);
  }

  renderComplete() {
    window.audioManager.playFanfare();
    const totalRounds = Math.min(20, this.words.length);
    const pct = Math.round((this.score / totalRounds) * 100);

    this.container.innerHTML = `
      <div class="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in select-none">
        <div class="text-5xl mb-3">⚡</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Hoàn thành Đúng hay Sai!</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Tốc độ phản xạ của bạn đạt:
        </p>
        <div class="my-5 text-4xl font-black text-amber-500">
          ${this.score} / ${totalRounds} <span class="text-sm font-semibold text-slate-400">(${pct}%)</span>
        </div>

        <div class="mt-6 flex flex-col gap-2.5">
          <button onclick="window.trueFalseGame.init(window.trueFalseGame.words, window.trueFalseGame.allWords, window.trueFalseGame.container, window.trueFalseGame.title)"
            class="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm transition shadow-sm">
            🔄 Chơi lại lượt mới
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

window.trueFalseGame = new TrueFalseGame();
