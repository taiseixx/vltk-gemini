export interface Note {
  pitch: number; // Frequency in Hz
  dur: number;   // Duration in beats
}

// Melody transcription for Vo Lam Truyen Ky theme: "Kiếm Hiệp Tình"
// In A-minor Pentatonic. 0 represents musical rests.
const melody: Note[] = [
  // Verse A: "Phút giây đầu tiên khi anh gặp em..."
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 440.00, dur: 0.5 }, // A4
  { pitch: 493.88, dur: 0.5 }, // B4
  { pitch: 523.25, dur: 1.0 }, // C5
  { pitch: 493.88, dur: 0.5 }, // B4
  { pitch: 440.00, dur: 0.5 }, // A4
  { pitch: 493.88, dur: 1.5 }, // B4
  { pitch: 0, dur: 1.0 },      // rest
  
  // "Khói mây ngập tràn nơi đây..."
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 392.00, dur: 0.5 }, // G4
  { pitch: 440.00, dur: 0.5 }, // A4
  { pitch: 493.88, dur: 1.0 }, // B4
  { pitch: 440.00, dur: 0.5 }, // A4
  { pitch: 392.00, dur: 0.5 }, // G4
  { pitch: 329.63, dur: 1.5 }, // E4
  { pitch: 0, dur: 1.0 },      // rest

  // "Bỗng nghe tiêu sầu nơi đâu cô tịch..."
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 440.00, dur: 0.5 }, // A4
  { pitch: 493.88, dur: 0.5 }, // B4
  { pitch: 523.25, dur: 1.0 }, // C5
  { pitch: 587.33, dur: 0.5 }, // D5
  { pitch: 659.25, dur: 1.0 }, // E5
  { pitch: 659.25, dur: 1.5 }, // E5
  { pitch: 0, dur: 1.0 },      // rest

  // "Khép mi thương nhớ muôn trùng..."
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 587.33, dur: 0.5 }, // D5
  { pitch: 523.25, dur: 0.5 }, // C5
  { pitch: 493.88, dur: 1.0 }, // B4
  { pitch: 440.00, dur: 0.5 }, // A4
  { pitch: 523.25, dur: 0.5 }, // C5
  { pitch: 440.00, dur: 2.0 }, // A4
  { pitch: 0, dur: 2.0 },      // rest

  // Verse B: "Đóa hoa nở muôn nụ hoa thắm nồng..."
  { pitch: 523.25, dur: 0.5 }, // C5
  { pitch: 587.33, dur: 0.5 }, // D5
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 783.99, dur: 1.0 }, // G5
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 587.33, dur: 0.5 }, // D5
  { pitch: 659.25, dur: 1.5 }, // E5
  { pitch: 0, dur: 1.0 },      // rest

  // "Kiếm đao nhòa trong giọt nước mắt hồng..."
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 783.99, dur: 0.5 }, // G5
  { pitch: 880.00, dur: 0.5 }, // A5
  { pitch: 783.99, dur: 1.0 }, // G5
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 587.33, dur: 0.5 }, // D5
  { pitch: 659.25, dur: 1.5 }, // E5
  { pitch: 0, dur: 1.0 },      // rest

  // "Lòng nhân gian đầy oán than oán sầu..."
  { pitch: 880.00, dur: 0.5 }, // A5
  { pitch: 783.99, dur: 0.5 }, // G5
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 783.99, dur: 1.0 }, // G5
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 587.33, dur: 0.5 }, // D5
  { pitch: 523.25, dur: 1.5 }, // C5
  { pitch: 0, dur: 1.0 },      // rest

  // "Khói sương mờ lối xưa... về đâu..."
  { pitch: 659.25, dur: 0.5 }, // E5
  { pitch: 587.33, dur: 0.5 }, // D5
  { pitch: 523.25, dur: 0.5 }, // C5
  { pitch: 493.88, dur: 1.0 }, // B4
  { pitch: 523.25, dur: 0.5 }, // C5
  { pitch: 440.00, dur: 3.0 }, // A4
  { pitch: 0, dur: 3.0 },      // rest
];

export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private bgmMuted: boolean = false;
  private lastPlayTime: Record<string, number> = {};

  // Background music scheduler states
  private isBgmPlaying: boolean = false;
  private schedulerTimerRef: any = null;
  private tempoBpm: number = 74; // Deep, elegant, nostalgic swordplay bpm
  private nextBeatTime: number = 0;
  private currentNoteIndex: number = 0;

  // Global Audio Effects nodes
  private delayNode: DelayNode | null = null;
  private delayGain: GainNode | null = null;

  constructor() {
    // Lazy initialisation to comply with standard browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    // Configure a global pristine mountain canyon delay loop for wuxia echo effects
    if (!this.delayNode && this.ctx) {
      this.delayNode = this.ctx.createDelay(1.5);
      this.delayNode.delayTime.value = 0.45; // 450ms eco interval

      this.delayGain = this.ctx.createGain();
      this.delayGain.gain.value = 0.18; // Wetness blend

      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.38; // Echo repeats

      // Connect source to delay node, back through feedback for repeating echo loops
      this.delayGain.connect(this.delayNode);
      this.delayNode.connect(feedback);
      feedback.connect(this.delayNode);

      this.delayNode.connect(this.ctx.destination);
    }
  }

  // Prevents sound overlaps/spamming on rapid execution
  private throttle(key: string, limitMs: number): boolean {
    const now = performance.now();
    const last = this.lastPlayTime[key] || 0;
    if (now - last < limitMs) {
      return false;
    }
    this.lastPlayTime[key] = now;
    return true;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem("vltk_muted", this.muted ? "1" : "0");
    } catch (_) {}
    return this.muted;
  }

  public isMuted(): boolean {
    try {
      const saved = localStorage.getItem("vltk_muted");
      if (saved !== null) {
        this.muted = saved === "1";
      }
    } catch (_) {}
    return this.muted;
  }

  public toggleBgmMute(): boolean {
    this.bgmMuted = !this.bgmMuted;
    try {
      localStorage.setItem("vltk_bgm_muted", this.bgmMuted ? "1" : "0");
    } catch (_) {}
    
    // Auto initiate play if unmuting BGM and it is not running
    if (!this.bgmMuted && !this.isBgmPlaying) {
      this.playBgm();
    }
    return this.bgmMuted;
  }

  public isBgmMuted(): boolean {
    try {
      const saved = localStorage.getItem("vltk_bgm_muted");
      if (saved !== null) {
        this.bgmMuted = saved === "1";
      }
    } catch (_) {}
    return this.bgmMuted;
  }

  // SFX 1: Click / Menu selection -> Replaced with a gentle Guzheng plucked string chime
  public playClick() {
    if (this.isMuted()) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      if (this.delayGain) {
        gain.connect(this.delayGain);
      }
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      // Pure pentatonic Guzheng resonance
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context Click failed:", e);
    }
  }

  // SFX 2: Sword Strike -> Designed metallic clashing ring + bandpass filtered whizzing slice whoosh!
  public playStrike() {
    if (this.isMuted()) return;
    if (!this.throttle("strike", 100)) return; // Max 10 per sec
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Blade Metallic ring (High pitch detuned sine sweep)
      const oscMetal1 = this.ctx.createOscillator();
      const oscMetal2 = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();

      oscMetal1.connect(metalGain);
      oscMetal2.connect(metalGain);
      metalGain.connect(this.ctx.destination);

      oscMetal1.type = "sine";
      oscMetal1.frequency.setValueAtTime(1450, now);
      oscMetal1.frequency.exponentialRampToValueAtTime(950, now + 0.1);

      oscMetal2.type = "sine";
      oscMetal2.frequency.setValueAtTime(1485, now); // Detuned for ring modulation
      oscMetal2.frequency.exponentialRampToValueAtTime(910, now + 0.1);

      metalGain.gain.setValueAtTime(0.04, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      // 2. Air Whoosh (Procedural buffer with a Sweep Bandpass Filter)
      const bufferSize = this.ctx.sampleRate * 0.14; // 140ms attack whoosh
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(900, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(220, now + 0.14);
      noiseFilter.Q.setValueAtTime(4.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.09, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // Fire
      oscMetal1.start(now);
      oscMetal2.start(now);
      noiseNode.start(now);

      oscMetal1.stop(now + 0.1);
      oscMetal2.stop(now + 0.1);
      noiseNode.stop(now + 0.14);
    } catch (e) {
      console.warn("Audio Context Strike failed:", e);
    }
  }

  // SFX 3: Skill casting -> Replaced with complex ancient Qigong energy raise (sub drone) + bell sweep down
  public playSkill(skillTier: number = 0) {
    if (this.isMuted()) return;
    if (!this.throttle("skill", 150)) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Qigong wave rise (Triangle sweep)
      const qigongOsc = this.ctx.createOscillator();
      const qigongGain = this.ctx.createGain();
      qigongOsc.connect(qigongGain);
      qigongGain.connect(this.ctx.destination);

      qigongOsc.type = "triangle";
      qigongOsc.frequency.setValueAtTime(100 + skillTier * 50, now);
      qigongOsc.frequency.linearRampToValueAtTime(280 + skillTier * 80, now + 0.22);

      qigongGain.gain.setValueAtTime(0.08, now);
      qigongGain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      qigongGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      // 2. Chime sequence (Sparkling pentatonic arpeggio sound)
      const pitches = [523.25, 659.25, 783.99, 880.00, 1046.50]; // Pentatonic scale points
      pitches.forEach((f, index) => {
        if (!this.ctx) return;
        const oscChime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();

        oscChime.connect(chimeGain);
        if (this.delayGain) {
          chimeGain.connect(this.delayGain);
        }
        chimeGain.connect(this.ctx.destination);

        oscChime.type = "sine";
        oscChime.frequency.setValueAtTime(f + skillTier * 60, now + index * 0.03); // Quick arpeggio staggered cascade

        chimeGain.gain.setValueAtTime(0.04, now + index * 0.03);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.03 + 0.3);

        oscChime.start(now + index * 0.03);
        oscChime.stop(now + index * 0.03 + 0.3);
      });

      qigongOsc.start(now);
      qigongOsc.stop(now + 0.22);
    } catch (e) {
      console.warn("Audio Context Skill failed:", e);
    }
  }

  // SFX 4: Level Up -> Sáo trúc (flute) pentatonic ascending flourish glissando
  public playLevelUp() {
    if (this.isMuted()) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Traditional ascending bamboo flute flourish
      const notes = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
      
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        osc.connect(gain);
        if (this.delayGain) {
          gain.connect(this.delayGain);
        }
        gain.connect(this.ctx.destination);

        // Flute vibrato logic
        lfo.frequency.value = 5.2; 
        lfoGain.gain.value = 3.5;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        // Smooth breathing volume rise/fade
        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

        lfo.start(now + idx * 0.06);
        osc.start(now + idx * 0.06);

        lfo.stop(now + idx * 0.06 + 0.28);
        osc.stop(now + idx * 0.06 + 0.28);
      });
    } catch (e) {
      console.warn("Audio Context LevelUp failed:", e);
    }
  }

  // SFX 5: Game Over / Hero Dead -> Dramatic ancient Temple Copper Bell toll with thick acoustic harmonics
  public playGameOver() {
    if (this.isMuted()) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const gongFreqs = [76.0, 153.0, 230.5, 307.2, 461.0]; // Realistic metallic copper bell overtones

      gongFreqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = idx === 0 ? "sine" : "triangle"; // sine on heavy low bass, triangle for clang
        osc.frequency.setValueAtTime(freq, now);

        const volume = idx === 0 ? 0.22 : 0.06 / idx;
        const decayTime = idx === 0 ? 1.8 : 1.4 - idx * 0.15; // lower overtones ring longer

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

        osc.start(now);
        osc.stop(now + decayTime);
      });
    } catch (e) {
      console.warn("Audio Context Game Over failed:", e);
    }
  }

  // BGM Synthesizer Scheduler engine: "Kiếm Hiệp Tình" Loop
  public playBgm(): void {
    if (this.isBgmPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      
      this.isBgmPlaying = true;
      this.nextBeatTime = this.ctx.currentTime + 0.1;
      this.currentNoteIndex = 0;
      this.startSchedulerLoop();
    } catch (e) {
      console.warn("BGM play failed:", e);
    }
  }

  public stopBgm(): void {
    this.isBgmPlaying = false;
    if (this.schedulerTimerRef) {
      clearTimeout(this.schedulerTimerRef);
      this.schedulerTimerRef = null;
    }
  }

  private startSchedulerLoop() {
    const scheduler = () => {
      if (!this.isBgmPlaying || !this.ctx) return;

      // Fill our buffer queue ahead (400ms ahead queueing window)
      while (this.nextBeatTime < this.ctx.currentTime + 0.4) {
        this.scheduleMelodyNote(this.currentNoteIndex, this.nextBeatTime);
        this.scheduleBackupChord(this.currentNoteIndex, this.nextBeatTime);

        const note = melody[this.currentNoteIndex];
        const beatDuration = (60 / this.tempoBpm) * note.dur;
        this.nextBeatTime += beatDuration;

        this.currentNoteIndex = (this.currentNoteIndex + 1) % melody.length;
      }

      this.schedulerTimerRef = setTimeout(scheduler, 100);
    };

    scheduler();
  }

  // Synthesizes a beautiful traditional Chinese Bamboo Flute (Sáo Trúc)
  private scheduleMelodyNote(idx: number, time: number) {
    if (this.isMuted() || this.isBgmMuted() || !this.ctx) return;
    const note = melody[idx];
    if (note.pitch === 0) return; // Musical rest

    const duration = (60 / this.tempoBpm) * note.dur;

    const oscNode = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    const vibratoLfo = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();

    oscNode.connect(gainNode);
    if (this.delayGain) {
      gainNode.connect(this.delayGain); // Cascade into mountain delay reverb
    }
    gainNode.connect(this.ctx.destination);

    // Flute vibrato settings
    vibratoLfo.frequency.setValueAtTime(5.4, time); // beautiful 5.4Hz emotional vibrato
    vibratoGain.gain.setValueAtTime(3.8, time); // pitch depth
    vibratoLfo.connect(vibratoGain);
    vibratoGain.connect(oscNode.frequency);

    oscNode.type = "sine";

    // Traditional frequency glide/bend (portamento) from prior notes
    const priorIdx = (idx - 1 + melody.length) % melody.length;
    const priorNote = melody[priorIdx];
    if (priorNote && priorNote.pitch > 0 && Math.random() < 0.7) {
      oscNode.frequency.setValueAtTime(priorNote.pitch, time);
      oscNode.frequency.exponentialRampToValueAtTime(note.pitch, time + 0.08);
    } else {
      oscNode.frequency.setValueAtTime(note.pitch, time);
    }

    // Gentle wind-blown breathing amplitude envelope
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.045, time + 0.05); // soft warm release/attack
    gainNode.gain.linearRampToValueAtTime(0.038, time + duration * 0.7);
    gainNode.gain.linearRampToValueAtTime(0, time + duration * 0.98); // elegant fadeout

    vibratoLfo.start(time);
    oscNode.start(time);

    vibratoLfo.stop(time + duration);
    oscNode.stop(time + duration);
  }

  // Synthesizes a beautiful staggered sweep of low strings mimicking Đàn Tranh / Guzheng sweeps
  private scheduleBackupChord(idx: number, time: number) {
    if (this.isMuted() || this.isBgmMuted() || !this.ctx) return;

    // Direct harmonies on major interval bounds
    let chordPitches: number[] = [];
    if (idx === 0) chordPitches = [110.00, 165.00, 220.00, 261.63];     // A-minor (Am)
    else if (idx === 8) chordPitches = [98.00, 146.83, 196.00, 246.94]; // G-major (G)
    else if (idx === 16) chordPitches = [110.00, 165.00, 220.00, 261.63]; // A-minor (Am)
    else if (idx === 24) chordPitches = [87.31, 130.81, 174.61, 261.63];  // F-major (F)
    else if (idx === 32) chordPitches = [130.81, 196.00, 261.63, 329.63]; // C-major (C)
    else if (idx === 40) chordPitches = [82.41, 123.47, 164.81, 196.00];  // E-minor (Em)
    else if (idx === 48) chordPitches = [87.31, 130.81, 174.61, 261.63];  // F-major (F)
    else if (idx === 56) chordPitches = [110.00, 165.00, 220.00, 261.63];  // A-minor (Am)
    else return; // Only play on phrase transitions

    // Traditional Guzheng sweeping technique (stagger chord notes by 35ms)
    chordPitches.forEach((freq, chordIdx) => {
      if (!this.ctx) return;
      const sweepTime = time + chordIdx * 0.035;

      const oscNode = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      oscNode.connect(gainNode);
      if (this.delayGain) {
        gainNode.connect(this.delayGain); // lush atmospheric reverberation
      }
      gainNode.connect(this.ctx.destination);

      oscNode.type = "triangle";
      oscNode.frequency.setValueAtTime(freq, sweepTime);

      // Guzheng pluck string decay envelope
      gainNode.gain.setValueAtTime(0, sweepTime);
      gainNode.gain.linearRampToValueAtTime(0.03, sweepTime + 0.015); // sharp pluck
      gainNode.gain.exponentialRampToValueAtTime(0.001, sweepTime + 1.22); // lengthy ring out

      oscNode.start(sweepTime);
      oscNode.stop(sweepTime + 1.25);
    });
  }
}

export const sfx = new AudioManager();
