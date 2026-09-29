// Game 4: Sentence Builder (Sắp Xếp Câu Ví Dụ)
class SentenceBuilderGame {
  constructor() {
    this.words = [];
    this.currentIndex = 0;
    this.score = 0;
    this.container = null;
    this.title = "Sắp Xếp Câu Ví Dụ";
    this.currentSentenceTokens = []; // original tokens in order
    this.shuffledTokens = [];       // { id, text, used }
    this.assembledTokens = [];      // { id, text }
  }

  escape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init(words, containerElement, title = "Sắp Xếp Câu Ví Dụ") {
    // Filter words that have valid example sentences
    this.words = words.filter(w => w.example_en && w.example_en.trim().length > 5).sort(() => Math.random() - 0.5);
    this.container = containerElement;
    this.title = title;
    this.currentIndex = 0;
    this.score = 0;

    this.loadCurrentSentence();
  }

  loadCurrentSentence() {
    if (this.currentIndex >= this.words.length) {
      this.renderComplete();
      return;
    }

    const currentWord = this.words[this.currentIndex];
    const sentence = currentWord.example_en.trim();

    // Split sentence into words while preserving punctuation
    const tokens = sentence.split(/\s+/).filter(t => t.length > 0);
    this.currentSentenceTokens = [...tokens];

    // Shuffled chips
    this.shuffledTokens = tokens.map((token, idx) => ({
      id: `tok_${idx}`,
      text: token,
      used: false
    })).sort(() => Math.random() - 0.5);

    this.assembledTokens = [];
    this.render();
  }

  render() {
    if (!this.container) return;
    const currentWord = this.words[this.currentIndex];
    const progressPct = ((this.currentIndex + 1) / this.words.length) * 100;

    this.container.innerHTML = `
      <div class="max-w-3xl mx-auto px-4 py-2 animate-fade-in select-none">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
              🧩 ${this.title}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-base font-bold text-slate-800 dark:text-white">
                Câu ${this.currentIndex + 1} / ${this.words.length}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Đã ghép đúng: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${this.score}</strong>
            </span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-6">
          <div class="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-300 rounded-full" style="width: ${progressPct}%"></div>
        </div>

        <!-- Prompt Goal (Vietnamese Translation & Target Word) -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Dịch câu sau sang tiếng Anh:
            </span>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Từ trọng tâm: <strong>${this.escape(currentWord.word)}</strong>
            </span>
          </div>

          <p class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
            "${this.escape(currentWord.example_vi || currentWord.meaning)}"
          </p>
        </div>

        <!-- Assembled Sentence Area -->
        <div class="bg-slate-100 dark:bg-slate-900/60 p-5 rounded-3xl mb-6 border border-slate-200 dark:border-slate-800 min-h-[90px]">
          <div class="text-xs text-slate-400 mb-2">Câu của bạn (Bấm vào khối từ để gỡ bỏ):</div>
          <div id="assembled-chips-container" class="flex flex-wrap items-center gap-2">
            ${this.renderAssembledChips()}
          </div>
        </div>

        <!-- Available Word Chips Bank -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <div class="text-xs text-slate-400 mb-3 text-center">Bấm vào các từ bên dưới theo đúng thứ tự:</div>
          <div id="word-chips-bank" class="flex flex-wrap justify-center items-center gap-2.5">
            ${this.renderChipsBank()}
          </div>
        </div>

        <!-- Control Buttons -->
        <div class="flex items-center justify-between gap-3">
          <button onclick="window.sentenceBuilderGame.resetSentence()" 
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition">
            🔄 Xếp lại từ đầu
          </button>
          <button onclick="window.sentenceBuilderGame.giveHint()" 
            class="px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1.5">
            <span>💡</span> Gợi ý từ tiếp
          </button>
          <button onclick="window.sentenceBuilderGame.skipSentence()" 
            class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-medium transition">
            Bỏ qua →
          </button>
        </div>

        <div id="sentence-feedback" class="mt-4 text-center font-bold text-sm min-h-[30px]"></div>
      </div>
    `;
  }

  renderAssembledChips() {
    if (this.assembledTokens.length === 0) {
      return `<span class="text-xs text-slate-400 italic">Chưa có từ nào được chọn...</span>`;
    }

    return this.assembledTokens.map((t, idx) => `
      <button onclick="window.sentenceBuilderGame.removeToken(${idx})"
        class="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-sm active:scale-95 transition flex items-center gap-1.5">
        <span>${this.escape(t.text)}</span>
        <span class="text-xs opacity-60">✕</span>
      </button>
    `).join('');
  }

  renderChipsBank() {
    return this.shuffledTokens.map(t => `
      <button onclick="window.sentenceBuilderGame.pickToken('${t.id}')" ${t.used ? 'disabled' : ''}
        class="px-4 py-2.5 rounded-2xl border-2 font-bold text-sm sm:text-base transition-all ${t.used ? 'opacity-20 border-slate-200 dark:border-slate-700 cursor-not-allowed scale-90' : 'bg-slate-50 dark:bg-slate-700 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-white hover:border-emerald-500 hover:scale-105 active:scale-95 shadow-sm'}">
        ${this.escape(t.text)}
      </button>
    `).join('');
  }

  pickToken(tokenId) {
    const token = this.shuffledTokens.find(t => t.id === tokenId);
    if (!token || token.used) return;

    token.used = true;
    this.assembledTokens.push({ id: token.id, text: token.text });
    this.updateAndCheck();
  }

  removeToken(index) {
    const assembled = this.assembledTokens[index];
    if (!assembled) return;

    const token = this.shuffledTokens.find(t => t.id === assembled.id);
    if (token) token.used = false;

    this.assembledTokens.splice(index, 1);
    this.updateAndCheck();
  }

  resetSentence() {
    this.shuffledTokens.forEach(t => t.used = false);
    this.assembledTokens = [];
    this.updateAndCheck();
  }

  giveHint() {
    const nextIdx = this.assembledTokens.length;
    if (nextIdx >= this.currentSentenceTokens.length) return;

    const correctText = this.currentSentenceTokens[nextIdx];
    const candidate = this.shuffledTokens.find(t => !t.used && t.text === correctText);
    if (candidate) {
      this.pickToken(candidate.id);
    }
  }

  skipSentence() {
    this.currentIndex++;
    this.loadCurrentSentence();
  }

  updateAndCheck() {
    const chipsContainer = document.getElementById('assembled-chips-container');
    const bankContainer = document.getElementById('word-chips-bank');
    if (chipsContainer) chipsContainer.innerHTML = this.renderAssembledChips();
    if (bankContainer) bankContainer.innerHTML = this.renderChipsBank();

    // Check completion
    if (this.assembledTokens.length === this.currentSentenceTokens.length) {
      const userSentence = this.assembledTokens.map(t => t.text).join(' ');
      const targetSentence = this.currentSentenceTokens.join(' ');
      const feedback = document.getElementById('sentence-feedback');

      if (userSentence.toLowerCase() === targetSentence.toLowerCase()) {
        window.audioManager.playCorrect();
        window.audioManager.speak(targetSentence);
        this.score++;

        if (feedback) {
          feedback.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400">✓ Hoàn toàn chính xác! 🔊 Đang đọc câu ví dụ...</span>`;
        }

        setTimeout(() => {
          this.currentIndex++;
          this.loadCurrentSentence();
        }, 1800);
      } else {
        window.audioManager.playWrong();
        if (feedback) {
          feedback.innerHTML = `<span class="text-rose-500">Cấu trúc câu chưa chính xác, hãy bấm từ để điều chỉnh lại!</span>`;
        }
      }
    }
  }

  renderComplete() {
    window.audioManager.playFanfare();
    this.container.innerHTML = `
      <div class="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in select-none">
        <div class="text-5xl mb-3">🧩</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Hoàn thành Sắp Xếp Câu!</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Bạn đã ghép đúng <strong>${this.score} / ${this.words.length}</strong> câu ví dụ hoàn chỉnh.
        </p>

        <div class="mt-6 flex flex-col gap-2.5">
          <button onclick="window.sentenceBuilderGame.init(window.sentenceBuilderGame.words, window.sentenceBuilderGame.container, window.sentenceBuilderGame.title)"
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
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

window.sentenceBuilderGame = new SentenceBuilderGame();
