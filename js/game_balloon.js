// Game 3: Audio Balloon Pop (Bắt Từ Bằng Tai / Bắn Bong Bóng Luyện Nghe)
class AudioBalloonGame {
  constructor() {
    this.words = [];
    this.allWords = [];
    this.currentIndex = 0;
    this.score = 0;
    this.container = null;
    this.title = "Bắn Bong Bóng Luyện Nghe";
    this.currentWord = null;
    this.balloons = [];
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init(words, allWordsPool, containerElement, title = "Bắn Bong Bóng Luyện Nghe") {
    this.words = [...words].sort(() => Math.random() - 0.5);
    this.allWords = allWordsPool || words;
    this.container = containerElement;
    this.title = title;
    this.currentIndex = 0;
    this.score = 0;

    this.loadRound();
  }

  loadRound() {
    if (this.currentIndex >= this.words.length) {
      this.renderComplete();
      return;
    }

    this.currentWord = this.words[this.currentIndex];

    // Pick 3 distractors
    const distractors = [];
    const usedIds = new Set([this.currentWord.id]);
    const shuffled = [...this.allWords].sort(() => Math.random() - 0.5);
    for (const w of shuffled) {
      if (!usedIds.has(w.id) && w.meaning !== this.currentWord.meaning) {
        distractors.push(w);
        usedIds.add(w.id);
        if (distractors.length >= 3) break;
      }
    }

    const balloonColors = [
      'from-rose-400 to-red-500 border-red-300 text-white',
      'from-sky-400 to-blue-500 border-blue-300 text-white',
      'from-emerald-400 to-teal-500 border-emerald-300 text-white',
      'from-amber-400 to-orange-500 border-orange-300 text-white'
    ];

    const options = [this.currentWord, ...distractors].sort(() => Math.random() - 0.5);
    this.balloons = options.map((opt, idx) => ({
      word: opt,
      isCorrect: opt.id === this.currentWord.id,
      color: balloonColors[idx % balloonColors.length],
      popped: false
    }));

    this.render();

    // Speak the secret word after a short delay
    setTimeout(() => {
      window.audioManager.speak(this.currentWord.word);
    }, 250);
  }

  render() {
    if (!this.container) return;
    const progressPct = ((this.currentIndex + 1) / this.words.length) * 100;

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-2 animate-fade-in select-none">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400">
              🎈 ${this.title}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-base font-bold text-slate-800 dark:text-white">
                Bong bóng ${this.currentIndex + 1} / ${this.words.length}
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
          <div class="bg-gradient-to-r from-rose-500 to-indigo-500 h-full transition-all duration-300 rounded-full" style="width: ${progressPct}%"></div>
        </div>

        <!-- Big Audio Prompt Center -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center mb-6">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-3">
            Nghe kỹ và bấm nổ quả bóng có nghĩa tương ứng!
          </span>

          <div class="my-3">
            <button onclick="window.audioManager.speak(window.audioBalloonGame.currentWord.word)"
              class="inline-flex items-center gap-3 px-8 py-4 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 text-white font-extrabold text-lg shadow-xl shadow-rose-500/25 hover:scale-105 active:scale-95 transition">
              <span class="text-3xl animate-bounce">🔊</span> Nghe lại phát âm
            </button>
          </div>
          <p class="text-xs text-slate-400">Gợi ý: Từ có ${this.currentWord.word.length} chữ cái</p>
        </div>

        <!-- Floating Balloons Grid -->
        <div class="grid grid-cols-2 gap-4" id="balloon-grid">
          ${this.balloons.map((b, idx) => `
            <div onclick="window.audioBalloonGame.popBalloon(${idx})" id="balloon-${idx}"
              class="balloon-card cursor-pointer group relative p-6 rounded-3xl bg-gradient-to-b ${b.color} shadow-lg border-2 hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center min-h-[130px] text-center">
              <span class="text-base sm:text-lg font-extrabold leading-snug drop-shadow-sm">
                ${this.escape(b.word.meaning)}
              </span>
              <!-- Balloon string decoration -->
              <div class="w-1 h-3 bg-white/40 mt-2 rounded-full"></div>
            </div>
          `).join('')}
        </div>

        <!-- Feedback Revealed Word -->
        <div id="balloon-feedback" class="mt-4 text-center font-bold text-sm min-h-[30px]"></div>
      </div>
    `;
  }

  popBalloon(idx) {
    const balloon = this.balloons[idx];
    if (!balloon || balloon.popped) return;

    const balloonEl = document.getElementById(`balloon-${idx}`);
    const feedback = document.getElementById('balloon-feedback');

    if (balloon.isCorrect) {
      // CORRECT! POP!
      balloon.popped = true;
      window.audioManager.playCorrect();
      this.score += 100;

      if (balloonEl) {
        balloonEl.classList.add('scale-125', 'opacity-0');
      }

      if (feedback) {
        feedback.innerHTML = `
          <span class="text-emerald-600 dark:text-emerald-400 animate-fade-in flex items-center justify-center gap-2">
            💥 Nổ bong bóng! Từ tiếng Anh là: <strong class="text-lg underline">${this.escape(this.currentWord.word)}</strong>
          </span>
        `;
      }

      setTimeout(() => {
        this.currentIndex++;
        this.loadRound();
      }, 1200);
    } else {
      // WRONG!
      window.audioManager.playWrong();
      this.score = Math.max(0, this.score - 15);

      if (balloonEl) {
        balloonEl.classList.add('shake-anim');
        setTimeout(() => balloonEl.classList.remove('shake-anim'), 400);
      }

      if (feedback) {
        feedback.innerHTML = `<span class="text-rose-500">Chưa đúng, hãy bấm nút "Nghe lại" và thử lại!</span>`;
      }
    }
  }

  renderComplete() {
    window.audioManager.playFanfare();
    this.container.innerHTML = `
      <div class="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in select-none">
        <div class="text-5xl mb-3">🎈</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Hoàn thành Bắn Bong Bóng!</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Khả năng nghe nhận diện từ vựng của bạn rất tuyệt vời!
        </p>
        <div class="my-4 text-4xl font-black text-rose-500">
          ${this.score} <span class="text-sm font-semibold text-slate-400">điểm</span>
        </div>

        <div class="mt-6 flex flex-col gap-2.5">
          <button onclick="window.audioBalloonGame.init(window.audioBalloonGame.words, window.audioBalloonGame.allWords, window.audioBalloonGame.container, window.audioBalloonGame.title)"
            class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
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

window.audioBalloonGame = new AudioBalloonGame();
