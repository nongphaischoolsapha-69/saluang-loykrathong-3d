(function () {
  'use strict';

  const TOTO = (window.TOTO = window.TOTO || {});

  // Thai Ramwong Loy Krathong Melody ("วันเพ็ญเดือนสิบสอง" pentatonic approximation in Hz)
  const RAMWONG_NOTES = [
    523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0,
    659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 523.25, 0,
    783.99, 880.00, 1046.50, 880.00, 783.99, 659.25, 587.33, 659.25,
    523.25, 587.33, 659.25, 587.33, 523.25, 392.00, 523.25, 0
  ];

  class SoundFX {
    constructor() {
      this.ctx = null;
      this.sizzleGain = null;
      this.sizzleFilter = null;
      this.ready = false;
      this.noiseBuf = null;
      this.beatAccum = 0;
      this.noteStep = 0;
      this.bpm = 112;
    }

    init() {
      if (this.ready) {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        const bufSize = this.ctx.sampleRate * 2;
        this.noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.55;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuf;
        noise.loop = true;

        this.sizzleFilter = this.ctx.createBiquadFilter();
        this.sizzleFilter.type = 'bandpass';
        this.sizzleFilter.frequency.value = 3200;
        this.sizzleFilter.Q.value = 0.7;

        this.sizzleGain = this.ctx.createGain();
        this.sizzleGain.gain.value = 0.0001;

        noise.connect(this.sizzleFilter);
        this.sizzleFilter.connect(this.sizzleGain);
        this.sizzleGain.connect(this.ctx.destination);
        noise.start();
        this.ready = true;
      } catch (e) {
        // AudioContext unavailable
      }
    }

    setSizzle(intensity) {
      if (!this.ready || !this.sizzleGain) return;
      const target = TOTO.STATE.muted ? 0.0001 : Math.max(0.0001, intensity * 0.14);
      this.sizzleGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
    }

    playSpatula() {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1150 + Math.random() * 400, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.09);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);

      if (this.sizzleGain) {
        this.sizzleGain.gain.setValueAtTime(0.24, t);
        this.sizzleGain.gain.exponentialRampToValueAtTime(0.11, t + 0.22);
      }
    }

    playCash() {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      [987.77, 1318.5, 1567.98].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.065);
        g.gain.setValueAtTime(0.12, t + idx * 0.065);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.065 + 0.28);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t + idx * 0.065);
        osc.stop(t + idx * 0.065 + 0.3);
      });
    }

    playBell() {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    }

    playStep() {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + Math.random() * 25, t);
      osc.frequency.exponentialRampToValueAtTime(48, t + 0.05);
      g.gain.setValueAtTime(0.03, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    playPop() {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(460, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.08);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }

    playWaterRipple() {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      // Soft water drop + gentle chime
      [340, 510, 680].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.09);
        osc.frequency.exponentialRampToValueAtTime(f * 1.45, t + idx * 0.09 + 0.14);
        g.gain.setValueAtTime(0.09, t + idx * 0.09);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.25);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t + idx * 0.09);
        osc.stop(t + idx * 0.09 + 0.26);
      });
    }

    playFirework() {
      if (!this.ready || TOTO.STATE.muted || !this.noiseBuf) return;
      const t = this.ctx.currentTime;
      // Whistle up
      const wh = this.ctx.createOscillator();
      const wg = this.ctx.createGain();
      wh.type = 'sine';
      wh.frequency.setValueAtTime(420, t);
      wh.frequency.exponentialRampToValueAtTime(1450, t + 0.35);
      wg.gain.setValueAtTime(0.06, t);
      wg.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      wh.connect(wg);
      wg.connect(this.ctx.destination);
      wh.start(t);
      wh.stop(t + 0.4);

      // Burst boom after 0.38s
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(950, t + 0.38);
      lp.frequency.exponentialRampToValueAtTime(180, t + 0.95);
      const bg = this.ctx.createGain();
      bg.gain.setValueAtTime(0.24, t + 0.38);
      bg.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      src.connect(lp);
      lp.connect(bg);
      bg.connect(this.ctx.destination);
      src.start(t + 0.38);
      src.stop(t + 1.05);
    }

    playRamwongHit(isPerfect) {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      const freqs = isPerfect ? [784, 1046.5, 1318.5] : [523.25, 659.25];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + i * 0.03);
        g.gain.setValueAtTime(0.11, t + i * 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.18);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t + i * 0.03);
        osc.stop(t + i * 0.03 + 0.2);
      });
    }

    playMatchLight() {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      if (this.noiseBuf) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2400, t);
        bp.frequency.exponentialRampToValueAtTime(850, t + 0.18);
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.14, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        src.connect(bp);
        bp.connect(ng);
        ng.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.24);
      }
      [523.25, 659.25, 1046.5].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + 0.05 + i * 0.055);
        g.gain.setValueAtTime(0.075, t + 0.05 + i * 0.055);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35 + i * 0.055);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t + 0.05 + i * 0.055);
        osc.stop(t + 0.38 + i * 0.055);
      });
    }

    playWishChime() {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;
      [528, 1056, 1584].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(i === 0 ? 0.11 : 0.045, t);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 1.3);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 1.35);
      });
    }

    playWaterPush(isPerfect) {
      if (!this.ready || TOTO.STATE.muted) return;
      if (typeof this.playWaterRipple === 'function') this.playWaterRipple();
      if (!isPerfect) return;
      const t = this.ctx.currentTime;
      [784, 1046.5, 1318.5, 1567.98].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + i * 0.065);
        g.gain.setValueAtTime(0.095, t + i * 0.065);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.065 + 0.34);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t + i * 0.065);
        osc.stop(t + i * 0.065 + 0.36);
      });
    }

    _playRamwongStep(step) {
      if (!this.ready || TOTO.STATE.muted) return;
      const t = this.ctx.currentTime;

      // Glong Yao / Ramwong Drum on beats 0, 2, 3, 4, 6
      const isDownBeat = step % 4 === 0;
      const isOffDrum = step % 4 === 2 || step % 8 === 3;
      if (isDownBeat || isOffDrum) {
        const drum = this.ctx.createOscillator();
        const dg = this.ctx.createGain();
        drum.type = 'sine';
        drum.frequency.setValueAtTime(isDownBeat ? 155 : 210, t);
        drum.frequency.exponentialRampToValueAtTime(isDownBeat ? 58 : 95, t + 0.13);
        dg.gain.setValueAtTime(isDownBeat ? 0.08 : 0.05, t);
        dg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        drum.connect(dg);
        dg.connect(this.ctx.destination);
        drum.start(t);
        drum.stop(t + 0.16);
      }

      // Thai Ching (ฉิ่ง / ฉับ)
      if (step % 2 === 0) {
        const ching = this.ctx.createOscillator();
        const cg = this.ctx.createGain();
        ching.type = 'sine';
        ching.frequency.setValueAtTime(step % 4 === 0 ? 3150 : 2400, t);
        cg.gain.setValueAtTime(0.022, t);
        cg.gain.exponentialRampToValueAtTime(0.0005, t + (step % 4 === 0 ? 0.14 : 0.05));
        ching.connect(cg);
        cg.connect(this.ctx.destination);
        ching.start(t);
        ching.stop(t + 0.15);
      }

      // Thai Ranat-Ek wooden xylophone melody
      const note = RAMWONG_NOTES[step % RAMWONG_NOTES.length];
      if (note > 0) {
        const ranat = this.ctx.createOscillator();
        const rg = this.ctx.createGain();
        ranat.type = 'triangle';
        ranat.frequency.setValueAtTime(note, t);
        rg.gain.setValueAtTime(0.038, t);
        rg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        ranat.connect(rg);
        rg.connect(this.ctx.destination);
        ranat.start(t);
        ranat.stop(t + 0.24);
      }
    }

    update(dt) {
      // Continuously drive Ramwong rhythm phase (0..1 per beat)
      const beatDuration = 60 / this.bpm; // ~0.535s per beat
      this.beatAccum += dt;
      TOTO.STATE.ramwongBeatPhase = (this.beatAccum % beatDuration) / beatDuration;

      if (!TOTO.STATE.loyKrathongMode || !TOTO.STATE.started) return;

      const eighthStep = beatDuration / 2;
      const currentTotalStep = Math.floor(this.beatAccum / eighthStep);
      if (currentTotalStep !== this.noteStep) {
        this.noteStep = currentTotalStep;
        this._playRamwongStep(this.noteStep);
      }
    }
  }

  TOTO.sfx = new SoundFX();
})();
