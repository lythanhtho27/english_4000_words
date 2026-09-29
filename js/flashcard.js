// Flashcard 3D Study Mode (Serverless & Zero Storage)
class FlashcardMode {
  constructor() {
    this.words = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.flipDirection = 'en-vi'; // 'en-vi' or 'vi-en'
    this.autoAudio = window.storageManager.autoAudio;
    this.container = null;
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init(words, containerElement, title = "Flashcards") {
    this.words = [...words];
    this.title = title;
    this.currentIndex = 0;
    this.isFlipped = false;
    this.container = containerElement;
    
    window.removeEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keydown', this.boundKeyDown);

    this.render();
    if (this.autoAudio && this.words.length > 0 && this.flipDirection === 'en-vi') {
      this.playCurrentAudio();
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.audioManager.stopSpeech();
  }

  handleKeyDown(e) {
    if (!this.container || this.container.offsetParent === null) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      this.flipCard();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      this.nextCard();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      this.prevCard();
    } else if (e.key === '1') {
      e.preventDefault();
      this.markNeedsWork();
    } else if (e.key === '2') {
      e.preventDefault();
      this.markMastered();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      this.playCurrentAudio();
    }
  }

  shuffle() {
    for (let i = this.words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
    }
    this.currentIndex = 0;
    this.isFlipped = false;
    this.render();
  }

  flipCard() {
    if (this.words.length === 0) return;
    this.isFlipped = !this.isFlipped;
    window.audioManager.playFlip();
    const cardInner = this.container.querySelector('.flashcard-inner');
    if (cardInner) {
      if (this.isFlipped) {
        cardInner.classList.add('is-flipped');
      } else {
        cardInner.classList.remove('is-flipped');
      }
    }
  }

  nextCard() {
    if (this.currentIndex < this.words.length - 1) {
      this.currentIndex++;
      this.isFlipped = false;
      this.updateCard();
    } else {
      this.renderComplete();
    }
  }

  prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.isFlipped = false;
      this.updateCard();
    }
  }

  markNeedsWork() {
    window.audioManager.playWrong();
    this.nextCard();
  }

  markMastered() {
    window.audioManager.playCorrect();
    this.nextCard();
  }

  playCurrentAudio() {
    const word = this.words[this.currentIndex];
    if (word) {
      window.audioManager.speak(word.word);
    }
  }

  playCurrentExample() {
    const word = this.words[this.currentIndex];
    if (word && word.example_en) {
      window.audioManager.speak(word.example_en);
    }
  }

  updateCard() {
    const word = this.words[this.currentIndex];
    if (!word) return;

    const cardInner = this.container.querySelector('.flashcard-inner');
    if (cardInner) {
      cardInner.classList.remove('is-flipped');
    }

    if (this.autoAudio) {
      setTimeout(() => {
        if (this.flipDirection === 'en-vi') {
          this.playCurrentAudio();
        }
      }, 150);
    }

    const cardWrapper = this.container.querySelector('.flashcard-container');
    if (cardWrapper) {
      cardWrapper.innerHTML = this.renderCardInner(word);
    }
    this.updateProgress();
  }

  updateProgress() {
    const countEl = this.container.querySelector('.card-counter');
    const progressEl = this.container.querySelector('.card-progress-bar');
    if (countEl) {
      countEl.innerText = `${this.currentIndex + 1} / ${this.words.length}`;
    }
    if (progressEl) {
      const pct = ((this.currentIndex + 1) / this.words.length) * 100;
      progressEl.style.width = `${pct}%`;
    }
  }

  render() {
    if (!this.container) return;
    if (this.words.length === 0) {
      this.container.innerHTML = `
        <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-lg mx-auto">
          <div class="text-4xl mb-3">📭</div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-white">Không có từ vựng nào</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Danh sách từ này hiện đang trống. Hãy chọn bài học khác!</p>
          <button onclick="window.app.showUnitList()" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition">
            Quay lại chọn bài
          </button>
        </div>
      `;
      return;
    }

    const word = this.words[this.currentIndex];
    const pct = ((this.currentIndex + 1) / this.words.length) * 100;

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-2">
        <!-- Header Controls -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">${this.title}</span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="card-counter text-base font-bold text-slate-800 dark:text-white">
                ${this.currentIndex + 1} / ${this.words.length}
              </span>
              <span class="text-xs text-slate-400 dark:text-slate-500">• Bấm Thẻ hoặc [Phím Cách] để lật</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Flip Direction Toggle -->
            <button onclick="window.flashcardMode.toggleFlipDirection()" title="Đổi chiều lật thẻ"
              class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1">
              <span>🔄</span> ${this.flipDirection === 'en-vi' ? 'Anh → Việt' : 'Việt → Anh'}
            </button>

            <!-- Shuffle Button -->
            <button onclick="window.flashcardMode.shuffle()" title="Xáo trộn thẻ"
              class="p-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              🔀
            </button>

            <!-- Auto Audio Toggle -->
            <button onclick="window.flashcardMode.toggleAutoAudio()" 
              class="p-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 ${this.autoAudio ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 text-slate-400'} hover:opacity-80 transition" title="Tự động phát âm thanh khi chuyển thẻ">
              🔊
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-6">
          <div class="card-progress-bar bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full" style="width: ${pct}%"></div>
        </div>

        <!-- 3D Flashcard Container -->
        <div class="flashcard-container select-none mb-6">
          ${this.renderCardInner(word)}
        </div>

        <!-- Action & Navigation Controls -->
        <div class="flex items-center justify-between gap-3">
          <button onclick="window.flashcardMode.prevCard()" ${this.currentIndex === 0 ? 'disabled' : ''}
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm">
            <span>←</span> Trước
          </button>

          <div class="flex items-center gap-3">
            <button onclick="window.flashcardMode.markNeedsWork()"
              class="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-sm font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95" title="Phím tắt: 1">
              <span>✕</span> Chưa nhớ <span class="hidden sm:inline text-xs opacity-60">(1)</span>
            </button>

            <button onclick="window.flashcardMode.markMastered()"
              class="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-sm font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95" title="Phím tắt: 2">
              <span>✓</span> Đã nhớ <span class="hidden sm:inline text-xs opacity-60">(2)</span>
            </button>
          </div>

          <button onclick="window.flashcardMode.nextCard()"
            class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition flex items-center gap-1 shadow-sm active:scale-95">
            Tiếp <span>→</span>
          </button>
        </div>

        <!-- Keyboard Shortcut Hint -->
        <div class="mt-6 text-center text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
          💡 Phím tắt: <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">Space</kbd> Lật thẻ • 
          <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">←</kbd> <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">→</kbd> Trước/Sau • 
          <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">1</kbd> Chưa nhớ • 
          <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">2</kbd> Đã nhớ • 
          <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">R</kbd> Nghe phát âm
        </div>
      </div>
    `;
  }

  renderCardInner(word) {
    const frontContent = this.flipDirection === 'en-vi' ? this.renderEnglishFace(word) : this.renderVietnameseFace(word, true);
    const backContent = this.flipDirection === 'en-vi' ? this.renderVietnameseFace(word, false) : this.renderEnglishFace(word);

    return `
      <div class="flashcard-scene" onclick="window.flashcardMode.flipCard()">
        <div class="flashcard-inner relative w-full h-[380px] sm:h-[400px] cursor-pointer transition-transform duration-500 rounded-3xl ${this.isFlipped ? 'is-flipped' : ''}">
          <!-- FRONT FACE -->
          <div class="flashcard-face flashcard-front absolute inset-0 w-full h-full bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                Book ${word.book} • Unit ${word.unit}
              </span>
              <button onclick="event.stopPropagation(); window.flashcardMode.playCurrentAudio()" class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 transition" title="Nghe phát âm">
                🔊
              </button>
            </div>

            <div class="my-auto text-center px-4">
              ${frontContent}
            </div>

            <div class="text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
              <span>👆 Nhấn để xem mặt sau</span>
            </div>
          </div>

          <!-- BACK FACE -->
          <div class="flashcard-face flashcard-back absolute inset-0 w-full h-full bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-slate-700">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Nghĩa & Giải thích
              </span>
              <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                <button onclick="window.flashcardMode.playCurrentAudio()" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition" title="Phát âm từ">
                  🔊
                </button>
              </div>
            </div>

            <div class="my-auto overflow-y-auto max-h-[250px] pr-2 custom-scroll text-left">
              ${backContent}
            </div>

            <div class="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <span>👆 Nhấn để lật lại mặt trước</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderEnglishFace(word) {
    return `
      <div class="space-y-3">
        ${word.pos ? `<span class="inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-md border border-emerald-200 dark:border-emerald-800">${this.escape(word.pos)}</span>` : ''}
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">${this.escape(word.word)}</h2>
        <div class="pt-2" onclick="event.stopPropagation()">
          <button onclick="window.flashcardMode.playCurrentAudio()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 font-medium text-sm transition">
            <span>🔊</span> Nghe phát âm
          </button>
        </div>
      </div>
    `;
  }

  renderVietnameseFace(word, isFront) {
    if (isFront) {
      return `
        <div class="space-y-3">
          <span class="inline-block text-xs uppercase tracking-wider text-slate-400 font-medium">Nghĩa tiếng Việt</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">${this.escape(word.meaning)}</h2>
          <p class="text-xs text-slate-400">Bạn có nhớ từ tiếng Anh tương ứng không?</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        <div>
          <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Từ vựng & Nghĩa</span>
          <h3 class="text-xl sm:text-2xl font-bold text-white mt-0.5 flex items-center gap-2">
            ${this.escape(word.word)} 
            ${word.pos ? `<span class="text-xs font-normal text-slate-400">(${this.escape(word.pos)})</span>` : ''}
          </h3>
          <p class="text-base text-amber-300 font-semibold mt-1">${this.escape(word.meaning)}</p>
        </div>

        <div class="pt-2 border-t border-slate-800">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Định nghĩa (Definition)</p>
          <p class="text-sm text-slate-200 mt-0.5 italic">"${this.escape(word.def_en)}"</p>
          ${word.def_vi ? `<p class="text-xs text-slate-400 mt-0.5">→ ${this.escape(word.def_vi)}</p>` : ''}
        </div>

        <div class="pt-2 border-t border-slate-800">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ví dụ (Example)</span>
            <button onclick="window.flashcardMode.playCurrentExample()" class="text-xs text-indigo-400 hover:text-indigo-300" title="Đọc câu ví dụ">
              🔊 Đọc ví dụ
            </button>
          </div>
          <p class="text-sm text-indigo-200 mt-0.5">"${this.escape(word.example_en)}"</p>
          ${word.example_vi ? `<p class="text-xs text-slate-400 mt-0.5">→ ${this.escape(word.example_vi)}</p>` : ''}
        </div>
      </div>
    `;
  }

  toggleFlipDirection() {
    this.flipDirection = this.flipDirection === 'en-vi' ? 'vi-en' : 'en-vi';
    this.isFlipped = false;
    this.render();
  }

  toggleAutoAudio() {
    this.autoAudio = !this.autoAudio;
    window.storageManager.setSetting('fc_auto_audio', this.autoAudio.toString());
    window.storageManager.autoAudio = this.autoAudio;
    this.render();
  }

  renderComplete() {
    window.audioManager.playFanfare();
    this.container.innerHTML = `
      <div class="max-w-md mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
        <div class="text-5xl mb-3">🎉</div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white">Hoàn thành lượt thẻ!</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Bạn đã duyệt qua toàn bộ <strong>${this.words.length}</strong> từ vựng.
        </p>

        <div class="mt-6 flex flex-col gap-2.5">
          <button onclick="window.flashcardMode.init(window.flashcardMode.words, window.flashcardMode.container, window.flashcardMode.title)"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
            🔄 Học lại từ đầu
          </button>
          
          <button onclick="window.app.startQuizForCurrentWords()"
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
            🎯 Làm bài kiểm tra trắc nghiệm
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

window.flashcardMode = new FlashcardMode();
