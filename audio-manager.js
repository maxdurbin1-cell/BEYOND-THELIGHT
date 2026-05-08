/* ============================================================
   audio-manager.js — Audio System for BEYOND: The Light
   Manages background music, sound effects, and notifications
   ============================================================ */

(function () {
  function normalizeScenarioKey(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  // ── AUDIO MANAGER STATE ──────────────────────────────────────────────────────
  const AudioManager = {
    // Master state
    enabled: true,
    musicConsent: false,
    masterVolume: 0.7,
    currentMusic: null,
    currentMusicId: "",
    currentScenario: "",
    currentAmbiences: [],
    musicVolume: 0.5,
    sfxVolume: 0.6,
    ambienceVolume: 0.45,
    currentTab: 'character',

    // Audio cache
    audioContext: null,
    audioCache: {},
    musicPlayers: {},
    musicProfiles: {},
    ambienceProfiles: {},
    scenarioProfiles: {},
    initialized: false,

    // Initialize Web Audio API
    init() {
      if (this.initialized) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // Resume audio context on user interaction (required by some browsers)
        const resumeAudio = () => {
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
              console.log('🔊 Audio context resumed');
            }).catch((err) => {
              console.warn('🔊 Failed to resume audio context:', err);
            });
          }
        };
        
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
        
        this.createSoundLibrary();
        this.initialized = true;
        console.log('🔊 Audio Manager initialized');
        console.log('🔊 Audio Context State:', this.audioContext.state);
      } catch (e) {
        console.warn('⚠️ Web Audio API not available:', e);
        this.enabled = false;
      }
    },

    ensureInitialized() {
      if (this.initialized || !this.enabled) return;
      this.init();
    },

    sampleWave(type, phase) {
      const p = phase % (Math.PI * 2);
      if (type === 'square') return Math.sign(Math.sin(p));
      if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(p));
      if (type === 'saw') {
        const unit = p / (Math.PI * 2);
        return 2 * (unit - Math.floor(unit + 0.5));
      }
      return Math.sin(p);
    },

    getBuffer(id) {
      if (this.audioCache[id]) return this.audioCache[id];
      if (this.musicProfiles[id]) {
        this.audioCache[id] = this.generateProceduralMusic(this.musicProfiles[id]);
        return this.audioCache[id];
      }
      if (this.ambienceProfiles[id]) {
        this.audioCache[id] = this.generateAmbienceBuffer(this.ambienceProfiles[id]);
        return this.audioCache[id];
      }
      return null;
    },

    stopAmbience(fadeOut = true) {
      if (!Array.isArray(this.currentAmbiences) || !this.currentAmbiences.length) return;
      const players = this.currentAmbiences.slice();
      this.currentAmbiences = [];
      players.forEach((entry) => {
        if (!entry || !entry.source || !entry.gainNode) return;
        if (fadeOut && this.audioContext) {
          const t0 = this.audioContext.currentTime;
          entry.gainNode.gain.cancelScheduledValues(t0);
          entry.gainNode.gain.setValueAtTime(entry.gainNode.gain.value, t0);
          entry.gainNode.gain.linearRampToValueAtTime(0, t0 + 1.2);
          setTimeout(() => {
            try { entry.source.stop(); } catch (_err) {}
          }, 1250);
        } else {
          try { entry.source.stop(); } catch (_err) {}
        }
      });
    },

    playAmbience(ambienceId, volume = 1, fadeIn = true) {
      this.ensureInitialized();
      if (!this.enabled || !this.audioContext || !this.musicConsent) return;
      const buffer = this.getBuffer(ambienceId);
      if (!buffer) return;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      const target = Math.max(0, Math.min(1, this.masterVolume * this.ambienceVolume * volume));
      gainNode.gain.value = fadeIn ? 0 : target;
      source.start(0);
      if (fadeIn) {
        const t0 = this.audioContext.currentTime;
        gainNode.gain.linearRampToValueAtTime(target, t0 + 2.2);
      }
      this.currentAmbiences.push({ id: ambienceId, source, gainNode });
    },

    // ── CORE PLAYBACK FUNCTIONS ──────────────────────────────────────────────
    /**
     * Play a sound effect with volume control
     * @param {string} soundId - ID of the sound to play
     * @param {number} volume - Volume multiplier (0-1)
     */
    playSFX(soundId, volume = 1) {
      this.ensureInitialized();
      if (!this.enabled || !this.audioContext) return;

      // Resume audio context if needed
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.playSFX(soundId, volume);
        }).catch((err) => {
          console.warn('🔊 Unable to resume audio for SFX:', err);
        });
        return;
      }
      
      const finalVolume = this.masterVolume * this.sfxVolume * volume;
      
      try {
        const audioData = this.audioCache[soundId];
        if (!audioData) {
          console.warn(`🔊 Sound not found: ${soundId}`);
          return;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = audioData;
        gainNode.gain.value = finalVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
      } catch (e) {
        console.warn(`🔊 Error playing sound ${soundId}:`, e);
      }
    },

    /**
     * Play background music for a page (loops)
     * @param {string} musicId - ID of the music to play
     */
    playMusic(musicId, fadeIn = true) {
      this.ensureInitialized();
      if (!this.enabled || !this.audioContext) {
        console.warn('🔊 Audio system disabled or no audio context');
        return;
      }

      if (!this.musicConsent) {
        return;
      }

      // Resume audio context if needed (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('🔊 Audio context resumed by playMusic');
          this.playMusic(musicId, fadeIn);
        }).catch((err) => {
          console.warn('🔊 Unable to resume audio for music:', err);
        });
        return;
      }

      // Stop current music
      if (this.currentMusic) {
        this.stopMusic(false);
      }

      try {
        const musicData = this.getBuffer(musicId);
        if (!musicData) {
          console.warn(`🔊 Music not found: ${musicId}`);
          return;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.loop = true;
        source.buffer = musicData;
        gainNode.gain.value = fadeIn ? 0 : this.masterVolume * this.musicVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);

        this.currentMusic = { source, gainNode };
        this.currentMusicId = String(musicId || '');
        console.log(`🔊 Now playing: ${musicId} (Context state: ${this.audioContext.state})`);

        // Fade in if requested
        if (fadeIn) {
          const startTime = this.audioContext.currentTime;
          const duration = 2; // 2 seconds fade
          for (let i = 0; i <= 10; i++) {
            gainNode.gain.setValueAtTime(
              (i / 10) * this.masterVolume * this.musicVolume,
              startTime + (i / 10) * duration
            );
          }
        }
      } catch (e) {
        console.warn(`🔊 Error playing music ${musicId}:`, e);
      }
    },

    /**
     * Stop current background music
     */
    stopMusic(fadeOut = true) {
      if (!this.currentMusic) return;

      if (fadeOut) {
        const startTime = this.audioContext.currentTime;
        const duration = 1; // 1 second fade
        for (let i = 0; i <= 10; i++) {
          this.currentMusic.gainNode.gain.setValueAtTime(
            (1 - i / 10) * this.masterVolume * this.musicVolume,
            startTime + (i / 10) * duration
          );
        }
        setTimeout(() => {
          try {
            if (this.currentMusic) {
              this.currentMusic.source.stop();
              this.currentMusic = null;
              this.currentMusicId = '';
            }
          } catch (e) {
            console.warn('🔊 Error stopping music:', e);
          }
        }, duration * 1000);
      } else {
        try {
          this.currentMusic.source.stop();
          this.currentMusic = null;
          this.currentMusicId = '';
        } catch (e) {
          console.warn('🔊 Error stopping music:', e);
        }
      }
    },

    // ── AUDIO GENERATION HELPERS ─────────────────────────────────────────────
    /**
     * Generate a simple sine wave tone
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {number} attackTime - Attack time in seconds
     * @param {number} decayTime - Decay time in seconds
     */
    generateTone(frequency, duration, attackTime = 0.01, decayTime = 0.1) {
      const sampleRate = this.audioContext.sampleRate;
      const buffer = this.audioContext.createBuffer(
        1,
        duration * sampleRate,
        sampleRate
      );
      const data = buffer.getChannelData(0);

      // Generate sine wave with envelope
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const phase = (2 * Math.PI * frequency * t) % (2 * Math.PI);
        
        // Simple ADSR envelope
        let envelope = 1;
        if (t < attackTime) {
          envelope = t / attackTime;
        } else if (t < attackTime + decayTime) {
          envelope = 1 - ((t - attackTime) / decayTime) * 0.3;
        } else if (t > duration - decayTime) {
          envelope = (duration - t) / decayTime;
        }

        data[i] = Math.sin(phase) * envelope * 0.3; // Reduce volume
      }

      return buffer;
    },

    /**
     * Generate a noise burst (white noise)
     * @param {number} duration - Duration in seconds
     */
    generateNoise(duration) {
      const sampleRate = this.audioContext.sampleRate;
      const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      return buffer;
    },

    generateProceduralMusic(profile) {
      const cfg = Object.assign({
        duration: 18,
        root: 146.83,
        bpm: 72,
        mode: 'minor',
        energy: 0.45,
        shimmer: 0.35,
        drift: 0.0015,
        bassMix: 0.28,
        pulseMix: 0.25,
        padMix: 0.37,
        leadMix: 0.18,
        noiseMix: 0.05,
        waveformPad: 'sine',
        waveformLead: 'triangle'
      }, profile || {});
      const sampleRate = this.audioContext.sampleRate;
      const total = Math.floor(cfg.duration * sampleRate);
      const buffer = this.audioContext.createBuffer(2, total, sampleRate);
      const modeIntervals = cfg.mode === 'major' ? [0, 2, 4, 5, 7, 9, 11, 12] : [0, 2, 3, 5, 7, 8, 10, 12];
      const beatDur = 60 / Math.max(40, Number(cfg.bpm || 72));
      const scaleFreq = (step) => cfg.root * Math.pow(2, modeIntervals[(step % modeIntervals.length + modeIntervals.length) % modeIntervals.length] / 12);
      const chL = buffer.getChannelData(0);
      const chR = buffer.getChannelData(1);
      let n1 = 0;
      let n2 = 0;

      for (let i = 0; i < total; i++) {
        const t = i / sampleRate;
        const section = Math.floor((t / beatDur) / 8) % 4;
        const chordRoot = section === 0 ? 0 : (section === 1 ? 3 : (section === 2 ? 5 : 4));
        const freqRoot = scaleFreq(chordRoot);
        const freqThird = scaleFreq(chordRoot + 2);
        const freqFifth = scaleFreq(chordRoot + 4);
        const bassFreq = freqRoot / 2;
        const leadStep = Math.floor(t / (beatDur / 2)) % 8;
        const leadFreq = scaleFreq(chordRoot + [0, 2, 4, 2, 5, 4, 2, 0][leadStep]);
        const beatPos = (t / beatDur) % 1;
        const pulseGate = beatPos < 0.22 ? 1 : 0.35;
        const padDrift = 1 + Math.sin(2 * Math.PI * cfg.drift * i) * 0.012;
        const shimmerLfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.11 * t);

        const pad = (
          this.sampleWave(cfg.waveformPad, 2 * Math.PI * freqRoot * padDrift * t)
          + this.sampleWave(cfg.waveformPad, 2 * Math.PI * freqThird * padDrift * t)
          + this.sampleWave(cfg.waveformPad, 2 * Math.PI * freqFifth * padDrift * t)
        ) / 3;
        const bass = this.sampleWave('triangle', 2 * Math.PI * bassFreq * t) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.03 * t));
        const pulse = this.sampleWave('saw', 2 * Math.PI * (freqRoot * 2) * t) * pulseGate;
        const lead = this.sampleWave(cfg.waveformLead, 2 * Math.PI * leadFreq * t) * (0.4 + 0.6 * shimmerLfo);

        // Simple pink-ish noise source for texture.
        const white = (Math.random() * 2 - 1);
        n1 = 0.985 * n1 + 0.015 * white;
        n2 = 0.94 * n2 + 0.06 * white;
        const noise = (n1 + n2) * 0.5;

        let sample = 0;
        sample += pad * cfg.padMix;
        sample += bass * cfg.bassMix;
        sample += pulse * cfg.pulseMix * cfg.energy;
        sample += lead * cfg.leadMix * cfg.shimmer;
        sample += noise * cfg.noiseMix;

        const env = Math.min(1, t / 1.8) * Math.min(1, (cfg.duration - t) / 1.2);
        sample *= env * 0.65;
        const pan = Math.sin(2 * Math.PI * 0.04 * t) * 0.25;
        chL[i] = Math.max(-1, Math.min(1, sample * (1 - pan)));
        chR[i] = Math.max(-1, Math.min(1, sample * (1 + pan)));
      }

      return buffer;
    },

    generateAmbienceBuffer(profile) {
      const cfg = Object.assign({
        duration: 20,
        noiseColor: 'brown',
        lowCut: 0.985,
        highCut: 0.92,
        motionHz: 0.12,
        pulseHz: 0,
        crackle: 0,
        rumble: 0,
        hiss: 0.2,
        toneHz: 0,
        toneMix: 0
      }, profile || {});

      const sampleRate = this.audioContext.sampleRate;
      const total = Math.floor(cfg.duration * sampleRate);
      const buffer = this.audioContext.createBuffer(2, total, sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      let lowL = 0;
      let lowR = 0;
      let highL = 0;
      let highR = 0;

      for (let i = 0; i < total; i++) {
        const t = i / sampleRate;
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        lowL = cfg.lowCut * lowL + (1 - cfg.lowCut) * whiteL;
        lowR = cfg.lowCut * lowR + (1 - cfg.lowCut) * whiteR;
        highL = cfg.highCut * (highL + whiteL - lowL);
        highR = cfg.highCut * (highR + whiteR - lowR);
        const baseL = (cfg.noiseColor === 'brown' ? lowL : highL);
        const baseR = (cfg.noiseColor === 'brown' ? lowR : highR);
        const motion = 0.55 + 0.45 * Math.sin(2 * Math.PI * cfg.motionHz * t);
        const pulse = cfg.pulseHz > 0 ? (0.5 + 0.5 * Math.sin(2 * Math.PI * cfg.pulseHz * t)) : 1;
        const crack = Math.random() < (cfg.crackle / sampleRate) ? (Math.random() * 2 - 1) * 0.9 : 0;
        const rumble = cfg.rumble > 0 ? Math.sin(2 * Math.PI * cfg.rumble * t) * 0.35 : 0;
        const tone = cfg.toneHz > 0 ? Math.sin(2 * Math.PI * cfg.toneHz * t) * cfg.toneMix : 0;
        const hiss = (Math.random() * 2 - 1) * cfg.hiss * 0.25;
        const vL = (baseL * motion * pulse * 0.6) + crack + rumble + tone + hiss;
        const vR = (baseR * motion * pulse * 0.6) + crack + rumble + tone + hiss;
        l[i] = Math.max(-1, Math.min(1, vL * 0.5));
        r[i] = Math.max(-1, Math.min(1, vR * 0.5));
      }
      return buffer;
    },

    // ── SOUND LIBRARY CREATION ───────────────────────────────────────────────
    createSoundLibrary() {
      if (!this.audioContext) return;

      this.musicProfiles = {
        'music-character': { root: 110, bpm: 62, mode: 'minor', energy: 0.3, shimmer: 0.35 },
        'music-map': { root: 146.83, bpm: 68, mode: 'minor', energy: 0.34, shimmer: 0.5 },
        'music-combat': { root: 196, bpm: 116, mode: 'minor', energy: 0.95, shimmer: 0.22, pulseMix: 0.4, bassMix: 0.35 },
        'music-caravan': { root: 164.81, bpm: 78, mode: 'major', energy: 0.5, shimmer: 0.4 },
        'music-missions': { root: 130.81, bpm: 92, mode: 'minor', energy: 0.62, shimmer: 0.3 },

        'music-town': { root: 196, bpm: 82, mode: 'major', energy: 0.5, shimmer: 0.36 },
        'music-city': { root: 220, bpm: 94, mode: 'major', energy: 0.62, shimmer: 0.32 },
        'music-village': { root: 174.61, bpm: 74, mode: 'major', energy: 0.45, shimmer: 0.33 },
        'music-tavern': { root: 164.81, bpm: 102, mode: 'major', energy: 0.68, shimmer: 0.25 },
        'music-dark-streets': { root: 155.56, bpm: 86, mode: 'minor', energy: 0.56, shimmer: 0.2 },
        'music-wilderness': { root: 146.83, bpm: 72, mode: 'minor', energy: 0.48, shimmer: 0.44 },
        'music-dungeon': { root: 98, bpm: 70, mode: 'minor', energy: 0.58, shimmer: 0.15 },
        'music-sacred': { root: 130.81, bpm: 58, mode: 'minor', energy: 0.35, shimmer: 0.62 },
        'music-space': { root: 123.47, bpm: 64, mode: 'minor', energy: 0.42, shimmer: 0.78, noiseMix: 0.12 },
        'music-star-birth': { root: 246.94, bpm: 50, mode: 'major', energy: 0.4, shimmer: 0.95, noiseMix: 0.15 },
        'music-starship': { root: 174.61, bpm: 88, mode: 'minor', energy: 0.7, shimmer: 0.48 },
        'music-command': { root: 207.65, bpm: 96, mode: 'minor', energy: 0.72, shimmer: 0.3 },
        'music-derelict': { root: 92.5, bpm: 54, mode: 'minor', energy: 0.38, shimmer: 0.24, noiseMix: 0.2 },
        'music-sea': { root: 155.56, bpm: 66, mode: 'major', energy: 0.44, shimmer: 0.55 },
        'music-storm-sea': { root: 130.81, bpm: 112, mode: 'minor', energy: 0.92, shimmer: 0.2, noiseMix: 0.16 },
        'music-desert': { root: 138.59, bpm: 76, mode: 'minor', energy: 0.5, shimmer: 0.34 },
        'music-bazaar': { root: 233.08, bpm: 108, mode: 'major', energy: 0.72, shimmer: 0.31 },
        'music-ice': { root: 116.54, bpm: 70, mode: 'minor', energy: 0.46, shimmer: 0.68 },
        'music-industrial': { root: 82.41, bpm: 100, mode: 'minor', energy: 0.8, shimmer: 0.14, pulseMix: 0.45 },
        'music-ritual': { root: 103.83, bpm: 60, mode: 'minor', energy: 0.48, shimmer: 0.58 },
        'music-relic': { root: 185, bpm: 72, mode: 'major', energy: 0.4, shimmer: 0.72 }
      };

      this.ambienceProfiles = {
        'amb-wind': { noiseColor: 'brown', lowCut: 0.992, motionHz: 0.08, hiss: 0.2 },
        'amb-rain': { noiseColor: 'white', highCut: 0.86, motionHz: 0.3, crackle: 140, hiss: 0.5 },
        'amb-thunder': { noiseColor: 'brown', lowCut: 0.994, motionHz: 0.05, rumble: 28, crackle: 28, hiss: 0.1 },
        'amb-river': { noiseColor: 'white', highCut: 0.9, motionHz: 0.18, hiss: 0.35 },
        'amb-waterfall': { noiseColor: 'white', highCut: 0.82, motionHz: 0.22, hiss: 0.58 },
        'amb-waves': { noiseColor: 'brown', lowCut: 0.989, motionHz: 0.11, pulseHz: 0.33, hiss: 0.34 },
        'amb-campfire': { noiseColor: 'white', highCut: 0.88, crackle: 210, hiss: 0.2, toneHz: 190, toneMix: 0.05 },
        'amb-icecracking': { noiseColor: 'brown', lowCut: 0.993, crackle: 75, rumble: 22, hiss: 0.12 },
        'amb-seagulls': { noiseColor: 'white', highCut: 0.9, motionHz: 0.24, toneHz: 880, toneMix: 0.04, hiss: 0.25 },
        'amb-crows': { noiseColor: 'white', highCut: 0.9, motionHz: 0.18, toneHz: 520, toneMix: 0.04, hiss: 0.22 },
        'amb-fire': { noiseColor: 'white', highCut: 0.86, crackle: 180, hiss: 0.3 },
        'amb-whispers': { noiseColor: 'brown', lowCut: 0.99, motionHz: 0.09, toneHz: 240, toneMix: 0.06, hiss: 0.16 },
        'amb-radio': { noiseColor: 'white', highCut: 0.91, crackle: 250, toneHz: 1200, toneMix: 0.03, hiss: 0.45 },
        'amb-crowd': { noiseColor: 'brown', lowCut: 0.988, motionHz: 0.26, toneHz: 320, toneMix: 0.05, hiss: 0.22 },
        'amb-fistfight': { noiseColor: 'white', highCut: 0.84, crackle: 160, rumble: 36, hiss: 0.28 },
        'amb-weapon-fighting': { noiseColor: 'white', highCut: 0.82, crackle: 200, toneHz: 760, toneMix: 0.04, hiss: 0.3 },
        'amb-ship-rumble': { noiseColor: 'brown', lowCut: 0.995, rumble: 31, motionHz: 0.07, hiss: 0.08 },
        'amb-rowboat': { noiseColor: 'brown', lowCut: 0.989, pulseHz: 0.62, motionHz: 0.16, hiss: 0.16 },
        'amb-train': { noiseColor: 'brown', lowCut: 0.992, pulseHz: 2.4, rumble: 42, hiss: 0.18 }
      };

      this.scenarioProfiles = {
        'town': { music: 'music-town', ambiences: ['amb-crowd', 'amb-wind'] },
        'city': { music: 'music-city', ambiences: ['amb-crowd', 'amb-radio'] },
        'village': { music: 'music-village', ambiences: ['amb-crowd', 'amb-campfire'] },
        'tavern': { music: 'music-tavern', ambiences: ['amb-crowd', 'amb-fire'] },
        'dark streets': { music: 'music-dark-streets', ambiences: ['amb-whispers', 'amb-rain'] },
        'springvale': { music: 'music-village', ambiences: ['amb-river', 'amb-crowd'] },
        'mountains': { music: 'music-wilderness', ambiences: ['amb-wind'] },
        'plains': { music: 'music-wilderness', ambiences: ['amb-wind'] },
        'forest': { music: 'music-wilderness', ambiences: ['amb-wind', 'amb-river'] },
        'cave': { music: 'music-dungeon', ambiences: ['amb-river', 'amb-whispers'] },
        'ancient grove': { music: 'music-sacred', ambiences: ['amb-wind', 'amb-river'] },
        'swamp': { music: 'music-dungeon', ambiences: ['amb-river', 'amb-whispers'] },
        'graveyard': { music: 'music-ritual', ambiences: ['amb-wind', 'amb-crows'] },
        'dungeon entrance': { music: 'music-dungeon', ambiences: ['amb-whispers'] },
        'dungeon corridors': { music: 'music-dungeon', ambiences: ['amb-whispers', 'amb-fire'] },
        'dungeon lair': { music: 'music-combat', ambiences: ['amb-fire', 'amb-weapon-fighting'] },
        'dwarves kingdom': { music: 'music-city', ambiences: ['amb-fire', 'amb-crowd'] },
        'deep space': { music: 'music-space', ambiences: ['amb-radio'] },
        'birth of a star': { music: 'music-star-birth', ambiences: ['amb-radio', 'amb-fire'] },
        'starship': { music: 'music-starship', ambiences: ['amb-ship-rumble', 'amb-radio'] },
        'command center': { music: 'music-command', ambiences: ['amb-radio'] },
        'space hub': { music: 'music-command', ambiences: ['amb-crowd', 'amb-radio'] },
        'metropolis': { music: 'music-city', ambiences: ['amb-crowd', 'amb-radio'] },
        'undercity': { music: 'music-industrial', ambiences: ['amb-whispers', 'amb-train'] },
        'mission briefing': { music: 'music-command', ambiences: ['amb-radio'] },
        'enemy base': { music: 'music-combat', ambiences: ['amb-radio', 'amb-weapon-fighting'] },
        'derelict station': { music: 'music-derelict', ambiences: ['amb-radio', 'amb-whispers'] },
        'unknown world': { music: 'music-space', ambiences: ['amb-wind', 'amb-whispers'] },
        'artifact': { music: 'music-relic', ambiences: ['amb-whispers'] },
        'setting sail': { music: 'music-sea', ambiences: ['amb-waves', 'amb-ship-rumble'] },
        'maelstrom': { music: 'music-storm-sea', ambiences: ['amb-waves', 'amb-thunder', 'amb-rain'] },
        'shipwreck cove': { music: 'music-sea', ambiences: ['amb-waves', 'amb-seagulls'] },
        'beach': { music: 'music-sea', ambiences: ['amb-waves', 'amb-seagulls'] },
        'island paths': { music: 'music-sea', ambiences: ['amb-wind', 'amb-seagulls'] },
        'merchant': { music: 'music-bazaar', ambiences: ['amb-crowd'] },
        'wilds': { music: 'music-wilderness', ambiences: ['amb-wind'] },
        'cursed lands': { music: 'music-ritual', ambiences: ['amb-whispers', 'amb-crows'] },
        'ritual': { music: 'music-ritual', ambiences: ['amb-whispers', 'amb-fire'] },
        'tainted chapel': { music: 'music-ritual', ambiences: ['amb-whispers', 'amb-crows'] },
        'the tower': { music: 'music-sacred', ambiences: ['amb-wind', 'amb-whispers'] },
        'haunted library': { music: 'music-ritual', ambiences: ['amb-whispers', 'amb-radio'] },
        'desert': { music: 'music-desert', ambiences: ['amb-wind'] },
        'sandstorm': { music: 'music-desert', ambiences: ['amb-wind', 'amb-thunder'] },
        'bazaar': { music: 'music-bazaar', ambiences: ['amb-crowd'] },
        'oasis': { music: 'music-desert', ambiences: ['amb-river', 'amb-wind'] },
        'palace': { music: 'music-sacred', ambiences: ['amb-crowd'] },
        'buried tomb': { music: 'music-dungeon', ambiences: ['amb-whispers', 'amb-fire'] },
        'relic': { music: 'music-relic', ambiences: ['amb-whispers'] },
        'mirage': { music: 'music-desert', ambiences: ['amb-wind', 'amb-whispers'] },
        'gutter': { music: 'music-dark-streets', ambiences: ['amb-rain', 'amb-whispers'] },
        'factory': { music: 'music-industrial', ambiences: ['amb-train', 'amb-radio'] },
        'body shop': { music: 'music-industrial', ambiences: ['amb-radio', 'amb-fire'] },
        'tundra': { music: 'music-ice', ambiences: ['amb-wind', 'amb-icecracking'] },
        'frozen harbor': { music: 'music-ice', ambiences: ['amb-waves', 'amb-icecracking'] },
        'blizzard': { music: 'music-ice', ambiences: ['amb-wind', 'amb-thunder', 'amb-icecracking'] },
        'glacier': { music: 'music-ice', ambiences: ['amb-icecracking', 'amb-wind'] },
        'ice creamave': { music: 'music-ice', ambiences: ['amb-icecracking', 'amb-whispers'] },
        'ice crevasse': { music: 'music-ice', ambiences: ['amb-icecracking', 'amb-whispers'] },
        'ancestral rite': { music: 'music-ritual', ambiences: ['amb-fire', 'amb-whispers'] }
      };

      // MUSIC TRACKS
      this.audioCache['music-character'] = this.generateProceduralMusic(this.musicProfiles['music-character']);
      this.audioCache['music-map'] = this.generateProceduralMusic(this.musicProfiles['music-map']);
      this.audioCache['music-combat'] = this.generateProceduralMusic(this.musicProfiles['music-combat']);
      this.audioCache['music-caravan'] = this.generateProceduralMusic(this.musicProfiles['music-caravan']);
      this.audioCache['music-missions'] = this.generateProceduralMusic(this.musicProfiles['music-missions']);

      // SOUND EFFECTS
      // Combat engagement
      this.audioCache['sfx-combat-start'] = this.generateTone(220, 0.1, 0.01, 0.05);
      
      // Combat hit (sword)
      this.audioCache['sfx-combat-hit'] = this.generateNoise(0.05);
      
      // Combat miss/blocked
      this.audioCache['sfx-combat-block'] = this.generateTone(440, 0.08, 0.01, 0.05);
      
      // Enemy defeated
      this.audioCache['sfx-enemy-defeat'] = this.generateTone(329.63, 0.2, 0.01, 0.15);
      
      // Damage taken (warning)
      this.audioCache['sfx-damage-taken'] = this.generateTone(146.83, 0.15, 0.01, 0.1);
      
      // Stress increased
      this.audioCache['sfx-stress-up'] = this.generateTone(197, 0.12, 0.01, 0.08);
      
      // Success/positive outcome
      this.audioCache['sfx-success'] = this.generateTone(349.23, 0.2, 0.05, 0.1);
      
      // Failure/negative outcome
      this.audioCache['sfx-failure'] = this.generateTone(164.81, 0.2, 0.05, 0.1);
      
      // Mission accepted
      this.audioCache['sfx-mission-accept'] = this.generateTone(261.63, 0.15, 0.05, 0.08);
      
      // Mission complete
      this.audioCache['sfx-mission-complete'] = this.generateTone(523.25, 0.3, 0.1, 0.2);
      
      // Item obtained/loot
      this.audioCache['sfx-loot'] = this.generateTone(392, 0.1, 0.02, 0.06);
      
      // Condition applied
      this.audioCache['sfx-condition'] = this.generateTone(277.18, 0.1, 0.02, 0.06);
      
      // Trauma taken
      this.audioCache['sfx-trauma'] = this.generateTone(110, 0.2, 0.01, 0.15);
      
      // TMW gained
      this.audioCache['sfx-tmw-gain'] = this.generateTone(392, 0.15, 0.05, 0.08);
      
      // UI click
      this.audioCache['sfx-ui-click'] = this.generateTone(800, 0.05, 0.01, 0.02);
      
      // Chase/pursuit
      this.audioCache['sfx-chase-alert'] = this.generateTone(440, 0.1, 0.01, 0.06);
      
      // Caravan damage
      this.audioCache['sfx-caravan-damage'] = this.generateNoise(0.08);
    },

    resolveScenarioProfile(name) {
      const key = normalizeScenarioKey(name);
      if (this.scenarioProfiles[key]) return this.scenarioProfiles[key];
      if (key.includes('space') || key.includes('starship') || key.includes('station')) return this.scenarioProfiles['deep space'];
      if (key.includes('sea') || key.includes('harbor') || key.includes('sail') || key.includes('island')) return this.scenarioProfiles['setting sail'];
      if (key.includes('desert') || key.includes('oasis') || key.includes('bazaar') || key.includes('sand')) return this.scenarioProfiles['desert'];
      if (key.includes('dungeon') || key.includes('tomb') || key.includes('lair') || key.includes('undercity')) return this.scenarioProfiles['dungeon corridors'];
      if (key.includes('ritual') || key.includes('chapel') || key.includes('tower') || key.includes('haunted')) return this.scenarioProfiles['ritual'];
      if (key.includes('combat') || key.includes('enemy')) return { music: 'music-combat', ambiences: ['amb-weapon-fighting'] };
      if (key.includes('city') || key.includes('metropolis') || key.includes('town') || key.includes('village')) return this.scenarioProfiles['city'];
      return this.scenarioProfiles['wilds'];
    },

    playScenarioAudio(name, options = {}) {
      this.ensureInitialized();
      if (!this.enabled || !this.musicConsent) return;
      const profile = this.resolveScenarioProfile(name);
      if (!profile) return;
      this.currentScenario = String(name || '');
      if (profile.music) this.playMusic(profile.music, options.fadeIn !== false);
      this.stopAmbience(options.fadeOut !== false);
      const ambienceIds = Array.isArray(options.ambiences) && options.ambiences.length
        ? options.ambiences
        : (Array.isArray(profile.ambiences) ? profile.ambiences : []);
      ambienceIds.forEach((id) => {
        if (this.ambienceProfiles[id]) this.playAmbience(id, 1, true);
      });
    },

    setScenarioContext(name, options) {
      this.playScenarioAudio(name, options || {});
    },

    // ── TAB-SPECIFIC MUSIC ───────────────────────────────────────────────────
    switchTabMusic(tabId) {
      this.currentTab = tabId;

      if (!this.musicConsent) {
        return;
      }
      
      const musicMap = {
        'character': 'music-character',
        'map': 'music-map',
        'combat': 'music-combat',
        'caravan': 'music-caravan',
        'holding': 'music-caravan',
        'missions': 'music-missions',
        'jobs': 'music-missions',
      };

      const musicId = musicMap[tabId] || 'music-character';
      this.playMusic(musicId, true);

      // Keep ambiences in sync with major tabs when explicit scenario context is not set.
      if (!this.currentScenario) {
        if (tabId === 'combat') {
          this.stopAmbience(false);
          this.playAmbience('amb-weapon-fighting', 0.9, true);
        } else if (tabId === 'map') {
          this.stopAmbience(false);
          this.playAmbience('amb-wind', 0.85, true);
        } else {
          this.stopAmbience(true);
        }
      }
    },

    // ── VOLUME CONTROLS ─────────────────────────────────────────────────────
    setMasterVolume(value) {
      this.masterVolume = Math.max(0, Math.min(1, value));
      if (this.currentMusic) {
        this.currentMusic.gainNode.gain.value = this.masterVolume * this.musicVolume;
      }
    },

    setMusicVolume(value) {
      this.musicVolume = Math.max(0, Math.min(1, value));
      if (this.currentMusic) {
        this.currentMusic.gainNode.gain.value = this.masterVolume * this.musicVolume;
      }
    },

    setSFXVolume(value) {
      this.sfxVolume = Math.max(0, Math.min(1, value));
    },

    toggleAudio(enabled) {
      this.enabled = enabled;
      if (!enabled) {
        this.stopMusic(false);
        this.stopAmbience(false);
      }
    },

    setMusicConsent(enabled) {
      const next = !!enabled;
      if (this.musicConsent === next) return;
      this.musicConsent = next;
      if (!this.musicConsent) {
        this.stopMusic(false);
        this.stopAmbience(false);
        return;
      }
      this.ensureInitialized();
      this.switchTabMusic(this.currentTab || 'character');
    },

    // ── EVENT SHORTCUTS ─────────────────────────────────────────────────────
    // Combat
    combatStarted() { this.playSFX('sfx-combat-start', 0.7); },
    combatEnded() { this.playSFX('sfx-success', 0.8); },
    combatHit(isPlayer = true) { this.playSFX('sfx-combat-hit', isPlayer ? 0.6 : 0.5); },
    combatMiss() { this.playSFX('sfx-combat-block', 0.5); },
    enemyDefeated() { this.playSFX('sfx-enemy-defeat', 0.9); },
    damageTaken(severity = 1) { this.playSFX('sfx-damage-taken', severity); },
    stressIncreased() { this.playSFX('sfx-stress-up', 0.6); },

    // Outcomes
    actionSuccess() { this.playSFX('sfx-success', 0.7); },
    actionFailed() { this.playSFX('sfx-failure', 0.7); },
    
    // Missions & Progress
    missionAccepted() { this.playSFX('sfx-mission-accept', 0.7); },
    missionComplete() { this.playSFX('sfx-mission-complete', 0.9); },
    lootObtained() { this.playSFX('sfx-loot', 0.7); },

    // Character Status
    conditionApplied() { this.playSFX('sfx-condition', 0.6); },
    traumaReceived() { this.playSFX('sfx-trauma', 0.8); },
    tmwGained() { this.playSFX('sfx-tmw-gain', 0.7); },

    // UI & Caravan
    uiClick() { this.playSFX('sfx-ui-click', 0.3); },
    chaseAlert() { this.playSFX('sfx-chase-alert', 0.8); },
    caravanDamaged() { this.playSFX('sfx-caravan-damage', 0.7); },

    // Scenario/Location conveniences
    playLocationAudio(name, options) { this.playScenarioAudio(name, options || {}); },
    setAmbienceByName(name) {
      const key = normalizeScenarioKey(name);
      const ambienceId = {
        'wind': 'amb-wind',
        'rain': 'amb-rain',
        'thunder': 'amb-thunder',
        'river': 'amb-river',
        'waterall': 'amb-waterfall',
        'waterfall': 'amb-waterfall',
        'waves': 'amb-waves',
        'campfire': 'amb-campfire',
        'icecracking': 'amb-icecracking',
        'seagulls': 'amb-seagulls',
        'crows': 'amb-crows',
        'fire': 'amb-fire',
        'whispers': 'amb-whispers',
        'radio': 'amb-radio',
        'a crowd': 'amb-crowd',
        'crowd': 'amb-crowd',
        'fistfight': 'amb-fistfight',
        'weapon fighting': 'amb-weapon-fighting',
        'ship rumble': 'amb-ship-rumble',
        'rowboat': 'amb-rowboat',
        'train': 'amb-train'
      }[key];
      if (!ambienceId) return;
      this.stopAmbience(true);
      this.playAmbience(ambienceId, 1, true);
    }
  };

  // Keep startup lightweight; initialize lazily on first audio use/consent.
  console.log('🔊 Audio system available. Background music is off until enabled in Settings.');

  // Expose globally
  window.AudioManager = AudioManager;
})();
