// Settings & Session Manager (Chỉ lưu settings trong localStorage, không lưu dữ liệu học tập)
class StorageManager {
  constructor() {
    // Chỉ lưu các tùy chọn cài đặt (Settings) vào localStorage
    this.theme = localStorage.getItem('vocab_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.accent = localStorage.getItem('vocab_accent') || 'en-US';
    this.speed = parseFloat(localStorage.getItem('vocab_speed') || '1.0');
    this.sfx = localStorage.getItem('vocab_sfx') !== 'false';
    this.autoAudio = localStorage.getItem('vocab_fc_auto_audio') !== 'false';
    
    // Ghi nhớ vị trí sách và bài học gần nhất để mở lại tiện lợi
    this.lastBook = parseInt(localStorage.getItem('vocab_last_book') || '1');
    this.lastUnit = parseInt(localStorage.getItem('vocab_last_unit') || '1');

    // Dữ liệu tương tác trong phiên học (Session-only: tự reset khi tắt/tải lại trang, không lưu vào ổ đĩa)
    this.sessionMastered = new Set();
    this.sessionStarred = new Set();
    this.sessionMistakes = new Map(); // wordId -> count
  }

  // === QUẢN LÝ CÀI ĐẶT (LOCALSTORAGE) ===
  setSetting(key, val) {
    try {
      localStorage.setItem(`vocab_${key}`, val);
    } catch (e) {}
  }

  getSetting(key, defaultVal = null) {
    try {
      const v = localStorage.getItem(`vocab_${key}`);
      return v !== null ? v : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  saveLastPosition(bookId, unitId) {
    this.lastBook = bookId;
    this.lastUnit = unitId;
    this.setSetting('last_book', bookId);
    this.setSetting('last_unit', unitId);
  }

  getLastPosition() {
    return { book: this.lastBook, unit: this.lastUnit };
  }

  // === TƯƠNG TÁC TẠM THỜI TRONG PHIÊN HỌC (IN-MEMORY SESSION ONLY) ===
  isMastered(wordId) {
    return this.sessionMastered.has(wordId);
  }

  toggleMastered(wordId) {
    if (this.sessionMastered.has(wordId)) {
      this.sessionMastered.delete(wordId);
    } else {
      this.sessionMastered.add(wordId);
    }
    return this.sessionMastered.has(wordId);
  }

  setMastered(wordId, status) {
    if (status) {
      this.sessionMastered.add(wordId);
    } else {
      this.sessionMastered.delete(wordId);
    }
  }

  isStarred(wordId) {
    return this.sessionStarred.has(wordId);
  }

  toggleStarred(wordId) {
    if (this.sessionStarred.has(wordId)) {
      this.sessionStarred.delete(wordId);
    } else {
      this.sessionStarred.add(wordId);
    }
    return this.sessionStarred.has(wordId);
  }

  recordMistake(wordId) {
    const cur = this.sessionMistakes.get(wordId) || 0;
    this.sessionMistakes.set(wordId, cur + 1);
  }

  getMistakeCount(wordId) {
    return this.sessionMistakes.get(wordId) || 0;
  }

  getMasteredCount(bookNum = null, unitNum = null) {
    let count = 0;
    for (const id of this.sessionMastered) {
      if (unitNum !== null && bookNum !== null) {
        if (id.startsWith(`b${bookNum}_u${unitNum}_`)) count++;
      } else if (bookNum !== null) {
        if (id.startsWith(`b${bookNum}_`)) count++;
      } else {
        count++;
      }
    }
    return count;
  }
}

window.storageManager = new StorageManager();
