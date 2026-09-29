// Audio Manager: Text-to-Speech (TTS) and Web Audio Synthesized Sound Effects
class AudioManager {
  constructor() {
    this.speechSynth = window.speechSynthesis || null;
    this.voiceUS = null;
    this.voiceUK = null;
    this.preferredAccent = localStorage.getItem('vocab_accent') || 'en-US';
    this.speechRate = parseFloat(localStorage.getItem('vocab_speed') || '1.0');
    this.soundEffectsEnabled = localStorage.getItem('vocab_sfx') !== 'false';
    this.audioCtx = null;

    this.initVoices();
    if (this.speechSynth && this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = () => this.initVoices();
    }
  }

  initVoices() {
    if (!this.speechSynth) return;
    const voices = this.speechSynth.getVoices();
    if (!voices || voices.length === 0) return;

    // Find best US voice
    this.voiceUS = voices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en_US')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira'))) 
      || voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en_US')) 
      || voices.find(v => v.lang.startsWith('en'));

    // Find best UK voice
    this.voiceUK = voices.find(v => (v.lang === 'en-GB' || v.lang.startsWith('en_GB')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('George') || v.name.includes('Susan'))) 
      || voices.find(v => v.lang === 'en-GB' || v.lang.startsWith('en_GB')) 
      || this.voiceUS;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  speak(text, rateModifier = 1.0) {
    if (!this.speechSynth || !text) return;
    this.speechSynth.cancel(); // Stop any pending speech

    const cleanText = text.replace(/\[.*?\]|\(.*?\)/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const accent = this.preferredAccent;
    const voice = accent === 'en-GB' ? (this.voiceUK || this.voiceUS) : (this.voiceUS || this.voiceUK);
    
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = accent;
    }

    utterance.rate = Math.max(0.5, Math.min(2.0, this.speechRate * rateModifier));
    utterance.pitch = 1.0;

    try {
      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  stopSpeech() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
  }

  setAccent(accent) {
    this.preferredAccent = accent;
    localStorage.setItem('vocab_accent', accent);
  }

  setSpeed(rate) {
    this.speechRate = parseFloat(rate);
    localStorage.setItem('vocab_speed', this.speechRate.toString());
  }

  setSoundEffects(enabled) {
    this.soundEffectsEnabled = !!enabled;
    localStorage.setItem('vocab_sfx', this.soundEffectsEnabled.toString());
  }

  // Synthesized Sound Effects via Web Audio API (Zero external MP3 dependencies!)
  playCorrect() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      // Joyful chime: E5 (659.25Hz) -> A5 (880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.setValueAtTime(880, now + 0.08);
      
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.35);
    } catch (e) {
      // Audio context may require user interaction
    }
  }

  playWrong() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      // Gentle buzzer: 220Hz -> 170Hz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(170, now + 0.25);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      // Ignore
    }
  }

  playFlip() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playFanfare() {
    if (!this.soundEffectsEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      // Fanfare: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + (idx * 0.1);
        const dur = idx === 3 ? 0.5 : 0.15;
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {}
  }
}

window.audioManager = new AudioManager();
