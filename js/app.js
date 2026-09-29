// Main Application Controller for 4000 Essential English Words Study Web App (Client-side / Offline)

class App {
  constructor() {
    this.data = window.VOCABULARY_DATA || null;
    this.currentBookId = 1;
    this.currentUnitId = 1;
    this.currentView = 'units'; // 'books' | 'units' | 'study' | 'flashcards' | 'quiz' | 'games_hub' | 'scramble' | 'falling' | 'balloon' | 'sentence' | 'truefalse' | 'crossword' | 'spelling' | 'match'
    this.maskMeaning = false;

    // Fast lookups
    this.allWords = [];
    this.wordMap = new Map();

    this.init();
  }

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  speakWord(wordId) {
    const w = this.wordMap.get(wordId);
    if (w && w.word) {
      window.audioManager.speak(w.word);
    }
  }

  speakExample(wordId) {
    const w = this.wordMap.get(wordId);
    if (w && w.example_en) {
      window.audioManager.speak(w.example_en);
    }
  }

  init() {
    if (!this.data || !this.data.books) {
      console.error("Vocabulary data not loaded!");
      return;
    }

    // Build flat index
    this.data.books.forEach(b => {
      b.units.forEach(u => {
        u.words.forEach(w => {
          this.allWords.push(w);
          this.wordMap.set(w.id, w);
        });
      });
    });

    // Restore last position from localStorage
    const lastPos = window.storageManager.getLastPosition();
    this.currentBookId = lastPos.book || 1;
    this.currentUnitId = lastPos.unit || 1;

    // Theme initialization
    this.initTheme();

    // Setup global listeners
    this.setupListeners();

    // Initial render
    this.renderHeaderNav();
    this.showUnitList(this.currentBookId);
  }

  initTheme() {
    const savedTheme = window.storageManager.theme;
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const icon = document.getElementById('theme-icon');
    if (icon) icon.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    const themeName = isDark ? 'dark' : 'light';
    window.storageManager.setSetting('theme', themeName);
    window.storageManager.theme = themeName;
    const icon = document.getElementById('theme-icon');
    if (icon) icon.innerHTML = isDark ? '☀️' : '🌙';
  }

  setupListeners() {
    // Global keyboard shortcut: Ctrl+K or / for Search, Esc to close modals
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === 'Escape') {
        this.closeSearchDropdown();
        this.closeModal();
      }
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      const searchBox = document.getElementById('search-container');
      if (searchBox && !searchBox.contains(e.target)) {
        this.closeSearchDropdown();
      }
    });
  }

  stopActiveGames() {
    if (window.fallingWordsGame) window.fallingWordsGame.destroy();
    if (window.trueFalseGame) window.trueFalseGame.destroy();
    if (window.wordScrambleGame) window.wordScrambleGame.destroy();
    if (window.matchGame) window.matchGame.destroy();
    if (window.flashcardMode) window.flashcardMode.destroy();
  }

  getCurrentBook() {
    return this.data.books.find(b => b.book === this.currentBookId) || this.data.books[0];
  }

  getCurrentUnit() {
    const book = this.getCurrentBook();
    return book.units.find(u => u.unit === this.currentUnitId) || book.units[0];
  }

  getCurrentWords() {
    const unit = this.getCurrentUnit();
    return unit ? unit.words : [];
  }

  // ================= VIEW ROUTING =================

  showBookList() {
    this.stopActiveGames();
    this.currentView = 'books';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    container.innerHTML = this.renderBooksViewHTML();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showUnitList(bookId = null) {
    this.stopActiveGames();
    if (bookId !== null) {
      this.currentBookId = bookId;
      window.storageManager.saveLastPosition(this.currentBookId, this.currentUnitId);
    }
    this.currentView = 'units';
    this.updateHeaderNav();
    this.renderUnitsView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showStudyList(bookId = null, unitId = null) {
    this.stopActiveGames();
    if (bookId !== null) this.currentBookId = bookId;
    if (unitId !== null) this.currentUnitId = unitId;
    window.storageManager.saveLastPosition(this.currentBookId, this.currentUnitId);

    this.currentView = 'study';
    this.updateHeaderNav();
    this.renderStudyView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showGamesHub() {
    this.stopActiveGames();
    this.currentView = 'games_hub';
    this.updateHeaderNav();
    this.renderGamesHubView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startFlashcards(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'flashcards';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.flashcardMode.init(targetWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startQuiz(words = null, title = null, count = 20) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Kiểm tra ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'quiz';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.quizMode.init(targetWords, this.allWords, container, defaultTitle, count);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- GAME LAUNCHERS ---

  startScramble(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Xáo Chữ ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'scramble';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.wordScrambleGame.init(targetWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startFallingWords(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Mưa Từ ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'falling';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.fallingWordsGame.init(targetWords, this.allWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startAudioBalloon(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Bong Bóng Nghe ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'balloon';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.audioBalloonGame.init(targetWords, this.allWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startSentenceBuilder(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Sắp Xếp Câu ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'sentence';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.sentenceBuilderGame.init(targetWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startTrueFalse(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Đúng Hay Sai ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'truefalse';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.trueFalseGame.init(targetWords, this.allWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startCrossword(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Ô Chữ ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'crossword';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.miniCrosswordGame.init(targetWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startSpelling(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Luyện gõ từ ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'spelling';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.spellingMode.init(targetWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startMatchGame(words = null, title = null) {
    this.stopActiveGames();
    const targetWords = words || this.getCurrentWords();
    const book = this.getCurrentBook();
    const defaultTitle = title || `Nối từ ${book.badge} • Unit ${this.currentUnitId}`;

    this.currentView = 'match';
    this.updateHeaderNav();
    const container = document.getElementById('main-content');
    window.matchGame.init(targetWords, container, defaultTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startQuizForBook(bookId) {
    const book = this.data.books.find(b => b.book === bookId);
    if (!book) return;
    const words = [];
    book.units.forEach(u => words.push(...u.words));
    this.startQuiz(words, `Thi trọn gói ${book.badge}`, 25);
  }

  startQuizForCurrentWords() {
    this.startQuiz();
  }

  // ================= VIEW RENDERING =================

  // 1. Books Grid View
  renderBooksViewHTML() {
    return `
      <div class="max-w-6xl mx-auto px-4 py-4 animate-fade-in">
        <!-- Hero Banner -->
        <div class="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-xl relative overflow-hidden">
          <div class="relative z-10 max-w-2xl">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
              Offline 100% • 4,000 Essential English Words
            </span>
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Hệ Thống Ôn Tập Từ Vựng & Trò Chơi
            </h1>
            <p class="text-indigo-200 text-sm sm:text-base leading-relaxed mb-6">
              Kho 3,601 từ vựng phân chia theo 6 Sách và 180 Bài học (Unit). Đầy đủ phát âm chuẩn bản xứ (US / UK), định nghĩa song ngữ, ví dụ và 8 trò chơi tương tác hấp dẫn!
            </p>

            <div class="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <div class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span>📚 6 Sách</span>
              </div>
              <div class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span>📝 180 Units</span>
              </div>
              <div class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span>🎮 8 Game Ôn Tập</span>
              </div>
              <div class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span>🔊 Phát âm US / UK</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Book Selection Cards -->
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>📖</span> Chọn Sách Ôn Tập
          </h2>
          <span class="text-xs text-slate-400">Nhấn vào sách để xem 30 bài học</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${this.data.books.map(b => {
            const colorGradients = {
              1: 'from-emerald-500 to-teal-700',
              2: 'from-sky-500 to-blue-700',
              3: 'from-indigo-500 to-violet-700',
              4: 'from-amber-500 to-orange-700',
              5: 'from-rose-500 to-pink-700',
              6: 'from-purple-600 to-fuchsia-800'
            };
            const grad = colorGradients[b.book] || 'from-indigo-600 to-slate-800';

            return `
              <div onclick="window.app.showUnitList(${b.book})" 
                class="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-4">
                    <span class="w-12 h-12 rounded-2xl bg-gradient-to-tr ${grad} text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/10 group-hover:scale-105 transition">
                      ${b.book}
                    </span>
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      ${b.level}
                    </span>
                  </div>

                  <h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    ${this.escape(b.title)}
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    ${this.escape(b.desc)}
                  </p>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-400">30 Units • ${b.total_words} từ</span>
                  <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                    Xem 30 bài học →
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 2. Units Grid View
  renderUnitsView() {
    const book = this.getCurrentBook();
    const container = document.getElementById('main-content');

    container.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-4 animate-fade-in">
        <!-- Book Header Banner -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-start gap-4">
            <span class="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
              B${book.book}
            </span>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                  ${book.level}
                </span>
                <span class="text-xs text-slate-400 font-medium">30 Units • ${book.total_words} từ vựng</span>
              </div>
              <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white">${this.escape(book.title)}</h1>
              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">${this.escape(book.desc)}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.app.showGamesHub()"
              class="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl transition text-center shadow-md shadow-indigo-600/20 flex items-center gap-1.5">
              <span>🎮</span> Khám Phá 8 Trò Chơi
            </button>
            <button onclick="window.app.startQuizForBook(${book.book})"
              class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition text-center flex items-center gap-1.5">
              <span>🎯</span> Thi cả sách
            </button>
          </div>
        </div>

        <!-- Unit List Selector -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>📑</span> Danh sách 30 bài học (Units)
          </h2>
          <span class="text-xs text-slate-400">Chọn bài để học hoặc chơi trò chơi</span>
        </div>

        <!-- 30 Units Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${book.units.map(u => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-base font-extrabold text-slate-900 dark:text-white">
                    Unit ${u.unit}
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-medium">
                    ${u.word_count} từ
                  </span>
                </div>

                <div class="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mb-4 italic">
                  ${this.escape(u.words.slice(0, 4).map(w => w.word).join(', '))}...
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button onclick="window.app.showStudyList(${book.book}, ${u.unit})"
                  class="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition text-center shadow-sm flex items-center justify-center gap-1">
                  <span>📖</span> Học từ
                </button>
                <button onclick="window.app.startFlashcardsForUnit(${book.book}, ${u.unit})"
                  class="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-semibold transition text-center flex items-center justify-center gap-1">
                  <span>🎴</span> Thẻ
                </button>
                <button onclick="window.app.showUnitGames(${book.book}, ${u.unit})"
                  class="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-xl text-xs font-semibold transition text-center flex items-center justify-center gap-1">
                  <span>🎮</span> Game
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  showUnitGames(bookId, unitId) {
    this.currentBookId = bookId;
    this.currentUnitId = unitId;
    window.storageManager.saveLastPosition(this.currentBookId, this.currentUnitId);
    this.showGamesHub();
  }

  // 3. Vocabulary List Study View
  renderStudyView() {
    const book = this.getCurrentBook();
    const unit = this.getCurrentUnit();
    const words = unit.words;
    const container = document.getElementById('main-content');

    container.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 py-4 animate-fade-in ${this.maskMeaning ? 'mask-meaning' : ''}">
        <!-- Top Sticky Unit Toolbar -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <button onclick="window.app.showUnitList(${book.book})" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  ← Trở về 30 Units
                </button>
                <span class="text-slate-300 dark:text-slate-600">•</span>
                <span class="text-xs font-semibold text-slate-500">${book.badge} • Level ${book.level}</span>
              </div>
              <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                Unit ${unit.unit} (${words.length} từ vựng)
              </h1>
            </div>

            <!-- Quick Play Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <button onclick="window.app.startFlashcards()"
                class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95">
                <span>🎴</span> Flashcard
              </button>
              <button onclick="window.app.startQuiz()"
                class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95">
                <span>🎯</span> Trắc nghiệm
              </button>
              <button onclick="window.app.showGamesHub()"
                class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95">
                <span>🎮</span> Chơi Game (${unit.words.length} từ)
              </button>
            </div>
          </div>

          <!-- Unit Navigation Controls -->
          <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <button onclick="window.app.toggleMaskMeaning()" 
              class="px-3 py-1.5 rounded-xl border text-xs font-medium transition ${this.maskMeaning ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/80 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}" title="Ẩn nghĩa tiếng Việt để tự kiểm tra trí nhớ">
              👁️ ${this.maskMeaning ? 'Đang ẩn nghĩa TV (Bấm từ để xem)' : 'Ẩn nghĩa tiếng Việt để tự ôn'}
            </button>

            <!-- Prev / Next Unit quick switch -->
            <div class="flex items-center gap-1.5">
              <button onclick="window.app.prevUnit()" ${unit.unit <= 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold" title="Bài trước">
                ◀ Unit ${unit.unit - 1}
              </button>
              <button onclick="window.app.nextUnit()" ${unit.unit >= 30 ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold" title="Bài sau">
                Unit ${unit.unit + 1} ▶
              </button>
            </div>
          </div>
        </div>

        <!-- Word Cards List -->
        <div class="space-y-4" id="word-cards-container">
          ${words.map((word, idx) => this.renderWordCardHTML(word, idx + 1)).join('')}
        </div>
      </div>
    `;
  }

  renderWordCardHTML(word, displayIndex) {
    return `
      <div id="card-${word.id}" class="word-card bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <!-- Word Title & Audio -->
          <div class="flex items-start gap-3">
            <span class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              ${displayIndex}
            </span>

            <div>
              <div class="flex items-center gap-2.5 flex-wrap">
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  ${this.escape(word.word)}
                </h3>
                <button onclick="window.app.speakWord('${word.id}')" 
                  class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition" title="Nghe phát âm">
                  🔊
                </button>
                ${word.pos ? `<span class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-md border border-emerald-100 dark:border-emerald-900">${this.escape(word.pos)}</span>` : ''}
              </div>

              <!-- Vietnamese Meaning -->
              <div class="mt-1.5">
                <span class="word-meaning-text text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400" onclick="this.classList.toggle('revealed')">
                  ${this.escape(word.meaning)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Definition Section -->
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-sm">
          <div class="flex items-start gap-2">
            <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mt-0.5">Định nghĩa:</span>
            <div class="text-slate-700 dark:text-slate-300 leading-relaxed">
              <span class="italic font-medium">"${this.escape(word.def_en)}"</span>
              ${word.def_vi ? `<span class="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">→ ${this.escape(word.def_vi)}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Example Sentence Section -->
        <div class="word-example-section mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-sm bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-2">
              <span class="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider shrink-0 mt-0.5">Ví dụ:</span>
              <div>
                <p class="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  "${this.escape(word.example_en)}"
                </p>
                ${word.example_vi ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">→ ${this.escape(word.example_vi)}</p>` : ''}
              </div>
            </div>
            <button onclick="window.app.speakExample('${word.id}')" 
              class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0" title="Đọc cả câu ví dụ">
              🔊
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Games Hub View (Trung Tâm Trò Chơi Ôn Tập)
  renderGamesHubView() {
    const book = this.getCurrentBook();
    const unit = this.getCurrentUnit();
    const container = document.getElementById('main-content');

    const gamesList = [
      {
        id: 'scramble',
        title: 'Xáo Chữ Ghép Từ',
        desc: 'Sắp xếp lại các chữ cái bị xáo trộn để tạo thành từ vựng đúng chính tả.',
        badge: 'Rèn Chính Tả',
        icon: '🔤',
        color: 'from-indigo-500 to-blue-600',
        action: () => this.startScramble()
      },
      {
        id: 'falling',
        title: 'Mưa Từ Vựng',
        desc: 'Chọn nhanh nghĩa tiếng Việt trước khi từ tiếng Anh rơi chạm đáy!',
        badge: 'Phản Xạ Tốc Độ',
        icon: '🌧️',
        color: 'from-sky-500 to-indigo-600',
        action: () => this.startFallingWords()
      },
      {
        id: 'balloon',
        title: 'Bắn Bong Bóng Nghe',
        desc: 'Nghe phát âm từ bí mật và bấm nổ bong bóng có nghĩa tương ứng.',
        badge: 'Luyện Nghe Nhạy',
        icon: '🎧',
        color: 'from-rose-500 to-pink-600',
        action: () => this.startAudioBalloon()
      },
      {
        id: 'sentence',
        title: 'Sắp Xếp Câu Ví Dụ',
        desc: 'Ghép các khối từ thành câu ví dụ hoàn chỉnh theo nghĩa tiếng Việt.',
        badge: 'Học Ngữ Cảnh',
        icon: '🧩',
        color: 'from-emerald-500 to-teal-600',
        action: () => this.startSentenceBuilder()
      },
      {
        id: 'truefalse',
        title: 'Đúng Hay Sai 3 Giây',
        desc: 'Quyết định chớp nhoáng cặp từ và nghĩa hiển thị là ĐÚNG hay SAI.',
        badge: 'Phản Xạ Nhanh',
        icon: '⚡',
        color: 'from-amber-500 to-orange-600',
        action: () => this.startTrueFalse()
      },
      {
        id: 'crossword',
        title: 'Ô Chữ Mini',
        desc: 'Giải đố bảng ô chữ mini với các gợi ý định nghĩa và nghĩa tiếng Việt.',
        badge: 'Tư Duy Giải Đố',
        icon: '📰',
        color: 'from-purple-600 to-violet-700',
        action: () => this.startCrossword()
      },
      {
        id: 'match',
        title: 'Game Nối Cặp Từ',
        desc: 'Ghép nối nhanh các cặp từ tiếng Anh và nghĩa tiếng Việt trên ô lưới.',
        badge: 'Trí Nhớ Nhanh',
        icon: '⚡',
        color: 'from-blue-600 to-cyan-600',
        action: () => this.startMatchGame()
      },
      {
        id: 'spelling',
        title: 'Luyện Gõ Từ & Điền',
        desc: 'Nghe phát âm và gõ chính xác từ vựng vào ô nhập liệu có gợi ý chữ.',
        badge: 'Gõ Phím Chuẩn',
        icon: '✍️',
        color: 'from-slate-700 to-slate-900',
        action: () => this.startSpelling()
      }
    ];

    container.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-4 animate-fade-in">
        <!-- Hub Banner -->
        <div class="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30 mb-2">
              🎮 Khu Vực Trò Chơi Ôn Tập
            </span>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              8 Trò Chơi Ôn Tập • ${book.badge} - Unit ${unit.unit}
            </h1>
            <p class="text-indigo-200 text-xs sm:text-sm mt-1">
              Áp dụng trực tiếp cho 20 từ vựng của Unit ${unit.unit}. Rèn luyện đa giác quan: Nghe, Chính tả, Phản xạ và Cấu trúc câu!
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.app.showStudyList(${book.book}, ${unit.unit})"
              class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5">
              <span>📖</span> Danh sách từ vựng
            </button>
          </div>
        </div>

        <!-- 8 Games Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${gamesList.map(g => `
            <div onclick="window.app.runGame('${g.id}')"
              class="group bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="w-12 h-12 rounded-2xl bg-gradient-to-tr ${g.color} text-white text-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition">
                    ${g.icon}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    ${g.badge}
                  </span>
                </div>

                <h3 class="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  ${g.title}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  ${g.desc}
                </p>
              </div>

              <div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span class="text-[11px] text-slate-400">Unit ${unit.unit} (20 từ)</span>
                <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                  Chơi ngay →
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  runGame(gameId) {
    switch (gameId) {
      case 'scramble': this.startScramble(); break;
      case 'falling': this.startFallingWords(); break;
      case 'balloon': this.startAudioBalloon(); break;
      case 'sentence': this.startSentenceBuilder(); break;
      case 'truefalse': this.startTrueFalse(); break;
      case 'crossword': this.startCrossword(); break;
      case 'match': this.startMatchGame(); break;
      case 'spelling': this.startSpelling(); break;
      default: this.startScramble();
    }
  }

  // ================= ACTIONS & HELPERS =================

  toggleMaskMeaning() {
    this.maskMeaning = !this.maskMeaning;
    this.renderStudyView();
  }

  prevUnit() {
    if (this.currentUnitId > 1) {
      this.currentUnitId--;
      this.showStudyList(this.currentBookId, this.currentUnitId);
    }
  }

  nextUnit() {
    if (this.currentUnitId < 30) {
      this.currentUnitId++;
      this.showStudyList(this.currentBookId, this.currentUnitId);
    }
  }

  startFlashcardsForUnit(bookId, unitId) {
    this.currentBookId = bookId;
    this.currentUnitId = unitId;
    this.startFlashcards();
  }

  // Header Nav state
  renderHeaderNav() {
    this.updateHeaderNav();
  }

  updateHeaderNav() {
    const bookSelector = document.getElementById('header-book-select');
    const unitSelector = document.getElementById('header-unit-select');

    if (bookSelector) {
      bookSelector.value = this.currentBookId;
    }
    if (unitSelector) {
      unitSelector.value = this.currentUnitId;
    }

    const tabs = ['books', 'units', 'study', 'flashcards', 'quiz', 'games_hub'];
    tabs.forEach(t => {
      const el = document.getElementById(`nav-${t}`);
      if (el) {
        if (this.currentView === t) {
          el.className = 'px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm';
        } else {
          el.className = 'px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs sm:text-sm';
        }
      }
    });
  }

  // ================= GLOBAL SEARCH =================

  handleSearchInput(query) {
    const clean = query.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    if (!clean || clean.length < 2) {
      if (dropdown) dropdown.classList.add('hidden');
      return;
    }

    const matches = [];
    for (const w of this.allWords) {
      if (w.word.toLowerCase().includes(clean) || w.meaning.toLowerCase().includes(clean) || w.def_en.toLowerCase().includes(clean)) {
        matches.push(w);
        if (matches.length >= 10) break;
      }
    }

    if (!dropdown) return;
    dropdown.classList.remove('hidden');

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-400">
          Không tìm thấy từ vựng nào khớp với "${this.escape(query)}"
        </div>
      `;
      return;
    }

    dropdown.innerHTML = `
      <div class="p-2 space-y-1 max-h-96 overflow-y-auto custom-scroll">
        <div class="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Tìm thấy ${matches.length} kết quả
        </div>
        ${matches.map(w => `
          <div onclick="window.app.jumpToWord('${w.id}')"
            class="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between gap-3 transition">
            <div>
              <div class="flex items-center gap-2">
                <strong class="text-sm font-bold text-slate-900 dark:text-white">${this.escape(w.word)}</strong>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                  Book ${w.book} • Unit ${w.unit}
                </span>
                ${w.pos ? `<span class="text-[10px] text-slate-400">(${this.escape(w.pos)})</span>` : ''}
              </div>
              <p class="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">${this.escape(w.meaning)}</p>
            </div>
            <button onclick="event.stopPropagation(); window.app.speakWord('${w.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 text-xs" title="Phát âm">
              🔊
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  jumpToWord(wordId) {
    const word = this.wordMap.get(wordId);
    if (!word) return;
    this.closeSearchDropdown();
    this.showStudyList(word.book, word.unit);

    setTimeout(() => {
      const card = document.getElementById(`card-${wordId}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('ring-4', 'ring-indigo-500/50');
        setTimeout(() => card.classList.remove('ring-4', 'ring-indigo-500/50'), 2500);
      }
    }, 200);
  }

  closeSearchDropdown() {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  }

  // ================= SETTINGS MODAL =================

  showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    const accent = window.audioManager.preferredAccent;
    const speed = window.audioManager.speechRate;
    const sfx = window.audioManager.soundEffectsEnabled;

    modal.innerHTML = `
      <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onclick="window.app.closeModal()">
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⚙️</span> Cài Đặt (Lưu vào localStorage)
            </h3>
            <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
          </div>

          <div class="space-y-5">
            <!-- Accent Voice -->
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Giọng đọc tiếng Anh</label>
              <select onchange="window.audioManager.setAccent(this.value)" class="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none">
                <option value="en-US" ${accent === 'en-US' ? 'selected' : ''}>🇺🇸 Giọng Mỹ (English US)</option>
                <option value="en-GB" ${accent === 'en-GB' ? 'selected' : ''}>🇬🇧 Giọng Anh (English UK)</option>
              </select>
            </div>

            <!-- Speech Speed -->
            <div>
              <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                <span>Tốc độ đọc</span>
                <span id="speed-label" class="text-indigo-600 dark:text-indigo-400">${speed}x</span>
              </div>
              <input type="range" min="0.7" max="1.3" step="0.1" value="${speed}"
                oninput="document.getElementById('speed-label').innerText = this.value + 'x'; window.audioManager.setSpeed(this.value);"
                class="w-full accent-indigo-600 cursor-pointer">
              <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Chậm (0.7x)</span>
                <span>Bình thường (1.0x)</span>
                <span>Nhanh (1.3x)</span>
              </div>
            </div>

            <!-- Sound Effects Toggle -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <div>
                <span class="text-sm font-semibold text-slate-800 dark:text-white block">Âm thanh hiệu ứng</span>
                <span class="text-xs text-slate-400">Tiếng chuông khi trả lời câu hỏi và game</span>
              </div>
              <input type="checkbox" ${sfx ? 'checked' : ''} onchange="window.audioManager.setSoundEffects(this.checked)"
                class="w-5 h-5 accent-indigo-600 rounded cursor-pointer">
            </div>

            <!-- Test Audio Button -->
            <div class="pt-2">
              <button onclick="window.audioManager.speak('Hello! Welcome to 4000 Essential English Words.')"
                class="w-full py-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition flex items-center justify-center gap-1.5">
                <span>🔊</span> Nghe thử phát âm mẫu
              </button>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <button onclick="window.app.closeModal()" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;
  }

  closeModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.innerHTML = '';
  }
}

// Global instance initialized on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
