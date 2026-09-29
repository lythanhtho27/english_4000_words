// Spelling & Typing Practice Mode (Zero persistent data)
class SpellingMode {
  constructor() {
    this.words = [];
    this.currentIndex = 0;
    this.score = 0;
    this.revealedLetters = 0;
    this.container = null;
    this.title = "Luyện gõ từ vựng";
    this.wrongAttempts = 0;
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init(words, containerElement, title = "Luyện gõ từ") {
    this.words = [...words].sort(() => Math.random() - 0.5);
    this.container = containerElement;
    this.title = title;
    this.currentIndex = 0;
    this.score = 0;
    this.revealedLetters = 0;
    this.wrongAttempts = 0;

    this.render();
  }

  render() {
    if (!this.container) return;
    if (this.words.length === 0) {
      this.container.innerHTML = `
        <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-lg mx-auto">
          <p class="text-slate-500 dark:text-slate-400">Không có từ vựng nào.</p>
        </div>
      `;
      return;
    }

    if (this.currentIndex >= this.words.length) {
      this.renderSummary();
      return;
    }

    const word = this.words[this.currentIndex];
    this.revealedLetters = 0;
    this.wrongAttempts = 0;

    const progressPct = ((this.currentIndex + 1) / this.words.length) * 100;
    const cleanWord = word.word.trim();

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-2">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">${this.title}</span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-base font-bold text-slate-800 dark:text-white">
                Từ ${this.currentIndex + 1} / ${this.words.length}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Đúng: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${this.score}</strong>
            </span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-6">
          <div class="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full" style="width: ${progressPct}%"></div>
        </div>

        <!-- Card Prompt -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 dark:border-slate-700 mb-6 text-center">
          <div class="flex items-center justify-center gap-2 mb-3">
            <button onclick="window.app.speakWord('${word.id}')" 
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-sm font-semibold transition" title="Nghe phát âm">
              <span>🔊</span> Nghe phát âm
            </button>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
              ${cleanWord.length} chữ cái
            </span>
          </div>

          <h2 class="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight my-2">
            ${this.escape(word.meaning)}
          </h2>

          <p class="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">
            "${this.escape(word.def_en)}"
          </p>

          <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
            Ví dụ: "${this.escape(word.example_en.replace(new RegExp(`\\b${word.word}\\b`, 'i'), '______'))}"
          </div>

          <!-- Letter Hints Preview -->
          <div id="spelling-hint-display" class="mt-6 flex justify-center items-center gap-1.5 flex-wrap font-mono text-xl sm:text-2xl font-bold">
            ${this.renderLetterBoxes(cleanWord, 0)}
          </div>
        </div>

        <!-- Input Box & Buttons -->
        <div class="space-y-4">
          <form onsubmit="event.preventDefault(); window.spellingMode.checkAnswer();" class="relative">
            <input type="text" id="spelling-input" autocomplete="off" autocapitalize="off" spellcheck="false"
              placeholder="Gõ từ tiếng Anh tại đây..."
              class="w-full text-center text-xl sm:text-2xl font-bold py-4 px-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm transition">
          </form>

          <div class="flex items-center justify-between gap-3">
            <button onclick="window.spellingMode.giveHint()" 
              class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-1.5">
              <span>💡</span> Gợi ý chữ cái
            </button>

            <button onclick="window.spellingMode.skip()" 
              class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs sm:text-sm font-medium transition">
              Bỏ qua từ này
            </button>

            <button onclick="window.spellingMode.checkAnswer()" 
              class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition shadow-sm">
              Kiểm tra (Enter)
            </button>
          </div>
        </div>

        <div id="spelling-feedback" class="mt-4 text-center font-medium text-sm min-h-[30px]"></div>
      </div>
    `;

    setTimeout(() => {
      const input = document.getElementById('spelling-input');
      if (input) input.focus();
    }, 100);
  }

  renderLetterBoxes(word, revealedCount) {
    return word.split('').map((char, idx) => {
      if (char === ' ' || char === '-') {
        return `<span class="w-6 text-center text-slate-400">${char}</span>`;
      }
      if (idx < revealedCount) {
        return `<span class="w-8 h-10 flex items-center justify-center border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400">${char}</span>`;
      }
      return `<span class="w-8 h-10 flex items-center justify-center border-b-2 border-slate-300 dark:border-slate-600 text-transparent select-none">_</span>`;
    }).join('');
  }

  giveHint() {
    const word = this.words[this.currentIndex];
    const clean = word.word.trim();
    if (this.revealedLetters < clean.length) {
      this.revealedLetters++;
      const hintBox = document.getElementById('spelling-hint-display');
      if (hintBox) {
        hintBox.innerHTML = this.renderLetterBoxes(clean, this.revealedLetters);
      }
    }
  }

  checkAnswer() {
    const input = document.getElementById('spelling-input');
    const feedback = document.getElementById('spelling-feedback');
    if (!input) return;

    const userInput = input.value.trim().toLowerCase();
    const word = this.words[this.currentIndex];
    const target = word.word.trim().toLowerCase();

    if (!userInput) return;

    if (userInput === target) {
      window.audioManager.playCorrect();
      window.audioManager.speak(word.word);
      this.score++;

      if (feedback) {
        feedback.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold">✓ Hoàn toàn chính xác! <strong>${this.escape(word.word)}</strong></span>`;
      }
      input.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950/40');

      setTimeout(() => {
        this.currentIndex++;
        this.render();
      }, 1000);
    } else {
      window.audioManager.playWrong();
      this.wrongAttempts++;

      input.classList.add('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/40', 'shake-anim');
      setTimeout(() => {
        input.classList.remove('shake-anim');
      }, 500);

      if (feedback) {
        if (this.wrongAttempts >= 2) {
          feedback.innerHTML = `<span class="text-rose-600 dark:text-rose-400">Đáp án đúng là: <strong class="underline">${this.escape(word.word)}</strong></span>`;
        } else {
          feedback.innerHTML = `<span class="text-rose-500 font-medium">Chưa đúng, hãy thử lại hoặc bấm "Gợi ý"!</span>`;
        }
      }
    }
  }

  skip() {
    this.currentIndex++;
    this.render();
  }

  renderSummary() {
    window.audioManager.playFanfare();
    const total = this.words.length;
    const correct = this.score;

    this.container.innerHTML = `
      <div class="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
        <div class="text-5xl mb-3">✍️</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Hoàn thành luyện gõ từ!</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Bạn đã gõ đúng <strong>${correct} / ${total}</strong> từ vựng.
        </p>

        <div class="mt-6 flex flex-col gap-2.5">
          <button onclick="window.spellingMode.init(window.spellingMode.words, window.spellingMode.container, window.spellingMode.title)"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
            🔄 Luyện tập lại danh sách này
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

window.spellingMode = new SpellingMode();
