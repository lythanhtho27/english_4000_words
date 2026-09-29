// Quiz Mode: Multiple Choice Quiz with 4 dynamic question types (Zero persistent data)
class QuizMode {
  constructor() {
    this.allWordsPool = [];
    this.quizWords = [];
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.userAnswers = [];
    this.answered = false;
    this.container = null;
    this.title = "Trắc nghiệm từ vựng";
    this.autoAdvanceTimer = null;
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init(words, allWordsPool, containerElement, title = "Trắc nghiệm", questionCount = 20, questionTypeFilter = 'all') {
    this.quizWords = [...words];
    this.allWordsPool = allWordsPool && allWordsPool.length > 10 ? allWordsPool : words;
    this.container = containerElement;
    this.title = title;
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.userAnswers = [];
    this.answered = false;

    this.generateQuestions(questionCount, questionTypeFilter);
    this.render();
  }

  generateQuestions(maxCount, filterType) {
    const shuffledWords = [...this.quizWords].sort(() => Math.random() - 0.5);
    const count = Math.min(maxCount, shuffledWords.length);
    const selectedWords = shuffledWords.slice(0, count);

    const questionTypes = ['en_to_vi', 'vi_to_en', 'listening', 'sentence_blank'];
    
    this.questions = selectedWords.map((word, qIndex) => {
      let qType = filterType;
      if (!filterType || filterType === 'all') {
        qType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      }

      if (qType === 'sentence_blank') {
        const regex = new RegExp(`\\b${word.word}\\b`, 'i');
        if (!word.example_en || !regex.test(word.example_en)) {
          qType = 'en_to_vi';
        }
      }

      const distractors = this.getDistractors(word, 3);
      const options = [word, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = options.findIndex(o => o.id === word.id);

      return {
        word: word,
        type: qType,
        options: options,
        correctIdx: correctIdx,
        qIndex: qIndex
      };
    });
  }

  getDistractors(correctWord, count) {
    const distractors = [];
    const usedIds = new Set([correctWord.id]);

    const sameUnit = this.allWordsPool.filter(w => w.book === correctWord.book && w.unit === correctWord.unit && w.id !== correctWord.id);
    const pool = sameUnit.length >= count ? sameUnit : this.allWordsPool;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const w of shuffled) {
      if (!usedIds.has(w.id) && w.meaning !== correctWord.meaning && w.word !== correctWord.word) {
        distractors.push(w);
        usedIds.add(w.id);
        if (distractors.length >= count) break;
      }
    }
    return distractors;
  }

  render() {
    if (!this.container) return;
    if (this.questions.length === 0) {
      this.container.innerHTML = `
        <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-lg mx-auto">
          <div class="text-4xl mb-3">❓</div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-white">Không có câu hỏi nào</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Danh sách từ này hiện đang trống.</p>
          <button onclick="window.app.showUnitList()" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition">
            Quay lại chọn bài
          </button>
        </div>
      `;
      return;
    }

    if (this.currentIndex >= this.questions.length) {
      this.renderSummary();
      return;
    }

    const q = this.questions[this.currentIndex];
    this.answered = false;
    clearTimeout(this.autoAdvanceTimer);

    const progressPct = ((this.currentIndex + 1) / this.questions.length) * 100;

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-2">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <span class="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">${this.title}</span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-base font-bold text-slate-800 dark:text-white">
                Câu ${this.currentIndex + 1} / ${this.questions.length}
              </span>
              ${this.streak >= 2 ? `
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                  🔥 Chuỗi đúng: ${this.streak}
                </span>
              ` : ''}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Điểm: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">${this.score}</strong> / ${this.currentIndex}
            </span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-6">
          <div class="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full" style="width: ${progressPct}%"></div>
        </div>

        <!-- Question Box -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          ${this.renderQuestionContent(q)}
        </div>

        <!-- Options Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" id="quiz-options-grid">
          ${this.renderOptions(q)}
        </div>

        <!-- Feedback & Next Action Box -->
        <div id="quiz-feedback-box" class="hidden transition-all duration-300"></div>
      </div>
    `;

    if (q.type === 'listening') {
      setTimeout(() => {
        window.audioManager.speak(q.word.word);
      }, 200);
    }
  }

  renderQuestionContent(q) {
    const word = q.word;

    if (q.type === 'en_to_vi') {
      return `
        <div class="text-center">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-3">
            Chọn nghĩa tiếng Việt chính xác
          </span>
          <div class="flex items-center justify-center gap-3">
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">${this.escape(word.word)}</h2>
            <button onclick="window.app.speakWord('${word.id}')" class="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 transition" title="Nghe phát âm">
              🔊
            </button>
          </div>
          ${word.pos ? `<span class="inline-block mt-2 text-xs font-semibold text-slate-400">(${this.escape(word.pos)})</span>` : ''}
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">"${this.escape(word.def_en)}"</p>
        </div>
      `;
    }

    if (q.type === 'vi_to_en') {
      return `
        <div class="text-center">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-3">
            Chọn từ tiếng Anh có nghĩa là
          </span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">${this.escape(word.meaning)}</h2>
          ${word.def_vi ? `<p class="text-xs text-slate-400 dark:text-slate-500 mt-2">Định nghĩa: ${this.escape(word.def_vi)}</p>` : ''}
        </div>
      `;
    }

    if (q.type === 'listening') {
      return `
        <div class="text-center">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 mb-3">
            🎧 Luyện nghe: Nghe và chọn từ/nghĩa chính xác
          </span>
          <div class="my-4">
            <button onclick="window.app.speakWord('${word.id}')" 
              class="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-base shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition">
              <span class="text-2xl">🔊</span> Bấm để nghe lại
            </button>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500">Hãy chọn từ bạn vừa nghe thấy bên dưới:</p>
        </div>
      `;
    }

    if (q.type === 'sentence_blank') {
      const regex = new RegExp(`\\b${word.word}\\b`, 'i');
      const blankedSentence = word.example_en.replace(regex, '__________');

      return `
        <div class="text-center">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mb-3">
            Điền từ thích hợp vào câu ví dụ
          </span>
          <p class="text-lg sm:text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed my-2">
            "${this.escape(blankedSentence)}"
          </p>
          ${word.example_vi ? `<p class="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">Dịch: "${this.escape(word.example_vi)}"</p>` : ''}
        </div>
      `;
    }

    return '';
  }

  renderOptions(q) {
    const letters = ['A', 'B', 'C', 'D'];
    return q.options.map((opt, idx) => {
      let displayText = '';
      if (q.type === 'en_to_vi') {
        displayText = this.escape(opt.meaning);
      } else if (q.type === 'vi_to_en') {
        displayText = `${this.escape(opt.word)} ${opt.pos ? `<span class="text-xs opacity-60">(${this.escape(opt.pos)})</span>` : ''}`;
      } else if (q.type === 'listening') {
        displayText = `${this.escape(opt.word)} — <span class="text-xs opacity-75">${this.escape(opt.meaning)}</span>`;
      } else if (q.type === 'sentence_blank') {
        displayText = this.escape(opt.word);
      }

      return `
        <button onclick="window.quizMode.selectOption(${idx})" id="quiz-opt-${idx}"
          class="quiz-option group w-full text-left p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex items-center gap-3">
          <span class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
            ${letters[idx]}
          </span>
          <span class="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 flex-1">
            ${displayText}
          </span>
        </button>
      `;
    }).join('');
  }

  selectOption(selectedIdx) {
    if (this.answered) return;
    this.answered = true;

    const q = this.questions[this.currentIndex];
    const isCorrect = selectedIdx === q.correctIdx;
    
    if (isCorrect) {
      this.score++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      window.audioManager.playCorrect();
    } else {
      this.streak = 0;
      window.audioManager.playWrong();
    }

    this.userAnswers.push({
      question: q,
      selectedIdx: selectedIdx,
      isCorrect: isCorrect
    });

    const buttons = this.container.querySelectorAll('.quiz-option');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIdx) {
        btn.classList.remove('border-slate-200', 'dark:border-slate-700');
        btn.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950/60', 'text-emerald-800', 'dark:text-emerald-200');
        const badge = btn.querySelector('span');
        if (badge) {
          badge.className = 'w-8 h-8 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center';
          badge.innerHTML = '✓';
        }
      } else if (idx === selectedIdx && !isCorrect) {
        btn.classList.remove('border-slate-200', 'dark:border-slate-700');
        btn.classList.add('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/60', 'text-rose-800', 'dark:text-rose-200', 'shake-anim');
        const badge = btn.querySelector('span');
        if (badge) {
          badge.className = 'w-8 h-8 rounded-xl bg-rose-500 text-white font-bold text-sm flex items-center justify-center';
          badge.innerHTML = '✕';
        }
      } else {
        btn.classList.add('opacity-40');
      }
    });

    const feedbackBox = this.container.querySelector('#quiz-feedback-box');
    if (feedbackBox) {
      feedbackBox.classList.remove('hidden');
      feedbackBox.innerHTML = `
        <div class="p-5 rounded-2xl border ${isCorrect ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900' : 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900'} mb-4 animate-fade-in">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'} flex items-center gap-1.5">
              ${isCorrect ? '✓ Chính xác!' : '✕ Chưa chính xác!'}
            </span>
            <button onclick="window.app.speakWord('${q.word.id}')" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>🔊</span> Phát âm
            </button>
          </div>
          <div class="mt-2 text-sm text-slate-700 dark:text-slate-300">
            <strong class="text-slate-900 dark:text-white">${this.escape(q.word.word)}</strong>: ${this.escape(q.word.meaning)}
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"${this.escape(q.word.def_en)}"</p>
            <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Ví dụ: "${this.escape(q.word.example_en)}"</p>
          </div>
        </div>

        <div class="flex justify-end">
          <button onclick="window.quizMode.nextQuestion()" 
            class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95">
            ${this.currentIndex < this.questions.length - 1 ? 'Câu tiếp theo <span>→</span>' : 'Xem kết quả bài thi <span>🏆</span>'}
          </button>
        </div>
      `;
    }
  }

  nextQuestion() {
    this.currentIndex++;
    this.render();
  }

  renderSummary() {
    clearTimeout(this.autoAdvanceTimer);
    window.audioManager.playFanfare();

    const total = this.questions.length;
    const correct = this.score;
    const pct = Math.round((correct / total) * 100);

    let badge = 'Xuất sắc! 🎉';
    let badgeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400';
    if (pct < 50) {
      badge = 'Cần cố gắng thêm! 💪';
      badgeColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400';
    } else if (pct < 80) {
      badge = 'Làm tốt lắm! 👏';
      badgeColor = 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400';
    }

    const mistakes = this.userAnswers.filter(a => !a.isCorrect);

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-4 animate-fade-in">
        <!-- Result Card -->
        <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 mb-6">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${badgeColor}">
            ${badge}
          </span>
          <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white">Hoàn thành bài kiểm tra!</h2>

          <!-- Circular Score -->
          <div class="my-6 inline-flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 p-1 shadow-lg">
            <div class="w-full h-full bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center">
              <span class="text-4xl font-black text-slate-900 dark:text-white">${pct}%</span>
              <span class="text-xs font-semibold text-slate-400">${correct} / ${total} câu đúng</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6 text-center">
            <div class="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span class="text-xs text-slate-400 font-medium">Chuỗi đúng nhất</span>
              <p class="text-lg font-bold text-amber-500">🔥 ${this.bestStreak} câu</p>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span class="text-xs text-slate-400 font-medium">Số câu trả lời sai</span>
              <p class="text-lg font-bold text-rose-500">${mistakes.length} câu</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            ${mistakes.length > 0 ? `
              <button onclick="window.quizMode.retryMistakes()"
                class="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2">
                <span>🔄</span> Làm lại ${mistakes.length} câu sai
              </button>
            ` : ''}

            <button onclick="window.quizMode.init(window.quizMode.quizWords, window.quizMode.allWordsPool, window.quizMode.container, window.quizMode.title, window.quizMode.questions.length)"
              class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2">
              <span>🎯</span> Làm lại đề thi mới
            </button>

            <button onclick="window.app.showUnitList()"
              class="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-sm transition shadow-sm">
              Trở về danh sách bài
            </button>
          </div>
        </div>

        <!-- Detailed Review of Missed Questions -->
        ${mistakes.length > 0 ? `
          <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 class="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span class="text-rose-500">⚠️</span> Danh sách câu trả lời sai (${mistakes.length})
            </h3>
            <div class="space-y-3">
              ${mistakes.map(m => `
                <div class="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <strong class="text-base text-slate-900 dark:text-white">${this.escape(m.question.word.word)}</strong>
                      <span class="text-xs text-rose-600 dark:text-rose-400 font-medium">(${this.escape(m.question.word.meaning)})</span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"${this.escape(m.question.word.example_en)}"</p>
                  </div>
                  <div class="flex items-center gap-2 self-end sm:self-auto">
                    <button onclick="window.app.speakWord('${m.question.word.id}')" class="p-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 text-indigo-600 dark:text-indigo-300 transition text-sm" title="Phát âm">
                      🔊
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  retryMistakes() {
    const mistakes = this.userAnswers.filter(a => !a.isCorrect).map(a => a.question.word);
    if (mistakes.length === 0) return;
    this.init(mistakes, this.allWordsPool, this.container, `Ôn lại câu sai (${mistakes.length} từ)`, mistakes.length);
  }
}

window.quizMode = new QuizMode();
