/* ============================================================
   audio-manager.js — Audio System for BEYOND: The Light
   Manages background music, sound effects, and notifications
   ============================================================ */

(function () {
  // ── AUDIO MANAGER STATE ──────────────────────────────────────────────────────
  const AudioManager = {
    // Master state
    enabled: true,
    masterVolume: 0.7,
    currentMusic: null,
    musicVolume: 0.5,
    sfxVolume: 0.6,
    currentTab: 'character',

    // Audio cache
    audioContext: null,
    audioCache: {},
    musicPlayers: {},

    // Initialize Web Audio API
    init() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // Resume audio context on user interaction (required by some browsers)
        const resumeAudio = () => {
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
              console.log('🔊 Audio context resumed');
            });
          }
        };
        
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
        
        this.createSoundLibrary();
        console.log('🔊 Audio Manager initialized');
        console.log('🔊 Audio Context State:', this.audioContext.state);
      } catch (e) {
        console.warn('⚠️ Web Audio API not available:', e);
        this.enabled = false;
      }
    },

    // ── CORE PLAYBACK FUNCTIONS ──────────────────────────────────────────────
    /**
     * Play a sound effect with volume control
     * @param {string} soundId - ID of the sound to play
     * @param {number} volume - Volume multiplier (0-1)
     */
    playSFX(soundId, volume = 1) {
      if (!this.enabled || !this.audioContext) return;

      // Resume audio context if needed
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
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
      if (!this.enabled || !this.audioContext) {
        console.warn('🔊 Audio system disabled or no audio context');
        return;
      }

      // Resume audio context if needed (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('🔊 Audio context resumed by playMusic');
        });
        return;
      }

      // Stop current music
      if (this.currentMusic) {
        this.stopMusic(false);
      }

      try {
        const musicData = this.audioCache[musicId];
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
            }
          } catch (e) {
            console.warn('🔊 Error stopping music:', e);
          }
        }, duration * 1000);
      } else {
        try {
          this.currentMusic.source.stop();
          this.currentMusic = null;
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

    // ── SOUND LIBRARY CREATION ───────────────────────────────────────────────
    createSoundLibrary() {
      if (!this.audioContext) return;

      // MUSIC TRACKS
      // Character/Menu ambient
      this.audioCache['music-character'] = this.generateTone(110, 4, 0.5, 0.3);
      
      // Map exploration (ethereal)
      this.audioCache['music-map'] = this.generateTone(146.83, 4, 0.5, 0.3);
      
      // Combat intense
      this.audioCache['music-combat'] = this.generateTone(196, 4, 0.1, 0.2);
      
      // Caravan/Journey
      this.audioCache['music-caravan'] = this.generateTone(164.81, 4, 0.5, 0.3);
      
      // Missions/Quests
      this.audioCache['music-missions'] = this.generateTone(130.81, 4, 0.5, 0.3);

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

    // ── TAB-SPECIFIC MUSIC ───────────────────────────────────────────────────
    switchTabMusic(tabId) {
      this.currentTab = tabId;
      
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
      }
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
  };

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      AudioManager.init();
      console.log('🔊 Audio system ready. Click anywhere to enable music.');
      // Start with character music after first user interaction
      setTimeout(() => {
        if (AudioManager.audioContext && AudioManager.audioContext.state === 'running') {
          AudioManager.playMusic('music-character', false);
          console.log('🔊 Starting character music...');
        }
      }, 100);
    });
  } else {
    AudioManager.init();
    console.log('🔊 Audio system ready. Click anywhere to enable music.');
    // Start with character music after first user interaction
    setTimeout(() => {
      if (AudioManager.audioContext && AudioManager.audioContext.state === 'running') {
        AudioManager.playMusic('music-character', false);
        console.log('🔊 Starting character music...');
      }
    }, 100);
  }

  // Expose globally
  window.AudioManager = AudioManager;
})();
