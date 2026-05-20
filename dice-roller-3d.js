/**
 * BEYOND: The Light - 3D Dice Roller
 * Professional animated dice with physics simulation, skins, and Fabled-style roll effects
 * Nat 20 → gold fireworks burst | Nat 1 → comical downward sprinkle
 * Collectible dice skin system with persistent selection
 */

(function() {
  'use strict';

  // ── Dice Skins ────────────────────────────────────────────────────────────
  const DICE_SKINS = {
    obsidian: {
      label: 'Obsidian',
      icon: '🖤',
      colors: { d4:'#3d3d4d', d6:'#2e2e40', d8:'#3a3a50', d10:'#464658', d12:'#3f3f55', d20:'#292940' },
      numberColor: '#e3bc5e',
      edgeColor: 'rgba(227,188,94,0.5)',
      glowColor: 'rgba(227,188,94,0.4)'
    },
    arcane: {
      label: 'Arcane',
      icon: '🔮',
      colors: { d4:'#5c2d91', d6:'#6b35a8', d8:'#7c42c2', d10:'#8a4dd4', d12:'#7038b8', d20:'#4a2280' },
      numberColor: '#c9f0ff',
      edgeColor: 'rgba(160,100,255,0.6)',
      glowColor: 'rgba(140,80,255,0.5)'
    },
    bloodForge: {
      label: 'Blood Forge',
      icon: '🔴',
      colors: { d4:'#6b1414', d6:'#7d1a1a', d8:'#8c2020', d10:'#9c2828', d12:'#8a1c1c', d20:'#5a0e0e' },
      numberColor: '#ffd0d0',
      edgeColor: 'rgba(220,60,60,0.6)',
      glowColor: 'rgba(200,40,40,0.5)'
    },
    voidWalker: {
      label: 'Void Walker',
      icon: '✨',
      colors: { d4:'#0a0a1a', d6:'#060614', d8:'#0c0c20', d10:'#08081c', d12:'#0a0a18', d20:'#040410' },
      numberColor: '#49c9bb',
      edgeColor: 'rgba(73,201,187,0.7)',
      glowColor: 'rgba(73,201,187,0.6)'
    },
    aurora: {
      label: 'Aurora',
      icon: '🌈',
      colors: { d4:'#1a5e4a', d6:'#1c4e6e', d8:'#3a1f6b', d10:'#5e2060', d12:'#6e1a2e', d20:'#1a3a5e' },
      numberColor: '#ffffff',
      edgeColor: 'rgba(120,220,200,0.5)',
      glowColor: 'rgba(140,200,255,0.4)'
    },
    classic: {
      label: 'Classic',
      icon: '🎲',
      colors: { d4:'#8b8b9a', d6:'#49c9bb', d8:'#7bc87b', d10:'#f0a840', d12:'#f0b028', d20:'#e05050' },
      numberColor: '#ffffff',
      edgeColor: 'rgba(255,255,255,0.2)',
      glowColor: 'rgba(255,255,255,0.15)'
    }
  };

  const SKIN_STORAGE_KEY = 'btl-dice-skin-v1';
  function getActiveSkin() {
    try { return DICE_SKINS[localStorage.getItem(SKIN_STORAGE_KEY)] || DICE_SKINS.classic; } catch(e) { return DICE_SKINS.classic; }
  }
  function setActiveSkin(key) {
    try { localStorage.setItem(SKIN_STORAGE_KEY, key); } catch(e) {}
  }

  // ── Base dice config (sides / range only — colours come from skin) ─────────
  const DICE_CONFIG = {
    d4: { sides: 4, color: '#8b8b9a', min: 1, max: 4 },
    d6: { sides: 6, color: '#49c9bb', min: 1, max: 6 },
    d8: { sides: 8, color: '#7bc87b', min: 1, max: 8 },
    d10: { sides: 10, color: '#f0a840', min: 1, max: 10 },
    d12: { sides: 12, color: '#f0b028', min: 1, max: 12 },
    d20: { sides: 20, color: '#e05050', min: 1, max: 20 }
  };

  // ── Particle / Effect helpers ─────────────────────────────────────────────
  const PARTICLE_POOL = [];

  function spawnParticles(ctx, cx, cy, count, opts) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = (opts.minSpeed || 2) + Math.random() * ((opts.maxSpeed || 8) - (opts.minSpeed || 2));
      PARTICLE_POOL.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (opts.gravityBias || 0),
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        size: (opts.minSize || 3) + Math.random() * ((opts.maxSize || 7) - (opts.minSize || 3)),
        color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
        shape: opts.shapes ? opts.shapes[Math.floor(Math.random() * opts.shapes.length)] : 'circle',
        gravity: opts.gravity || 0,
        spin: (Math.random() - 0.5) * 0.3
      });
    }
  }

  function updateAndDrawParticles(ctx) {
    for (let i = PARTICLE_POOL.length - 1; i >= 0; i--) {
      const p = PARTICLE_POOL[i];
      p.life -= p.decay;
      if (p.life <= 0) { PARTICLE_POOL.splice(i, 1); continue; }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97;
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin * (1 - p.life) * 10);
      if (p.shape === 'star') {
        drawStar(ctx, 0, 0, p.size);
      } else if (p.shape === 'confetti') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawStar(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outer = { x: x + r * Math.cos((Math.PI * 2 * i) / 5 - Math.PI / 2), y: y + r * Math.sin((Math.PI * 2 * i) / 5 - Math.PI / 2) };
      const inner = { x: x + r * 0.4 * Math.cos((Math.PI * 2 * i) / 5 - Math.PI / 2 + Math.PI / 5), y: y + r * 0.4 * Math.sin((Math.PI * 2 * i) / 5 - Math.PI / 2 + Math.PI / 5) };
      i === 0 ? ctx.moveTo(outer.x, outer.y) : ctx.lineTo(outer.x, outer.y);
      ctx.lineTo(inner.x, inner.y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ── Nat-20 firework burst ──────────────────────────────────────────────────
  function triggerNat20Effect(ctx, cx, cy) {
    const colors = ['#e3bc5e','#ffd700','#ff9f00','#ffffff','#49c9bb','#ff6b6b','#c9a0ff'];
    spawnParticles(ctx, cx, cy, 60, {
      colors, minSpeed: 4, maxSpeed: 14, minSize: 4, maxSize: 9,
      shapes: ['star', 'circle', 'confetti'], gravity: 0.08, gravityBias: -2
    });
    // Second burst ring
    spawnParticles(ctx, cx, cy, 30, {
      colors: ['#ffffff','#fffacd','#ffd700'],
      minSpeed: 1, maxSpeed: 4, minSize: 2, maxSize: 4,
      shapes: ['circle'], gravity: 0.04, gravityBias: -1
    });
  }

  // ── Nat-1 comical sprinkle ─────────────────────────────────────────────────
  function triggerNat1Effect(ctx, cx, cy) {
    const colors = ['#888','#9fa7bc','#555','#777','#bbb'];
    spawnParticles(ctx, cx, cy, 28, {
      colors, minSpeed: 0.5, maxSpeed: 3, minSize: 2, maxSize: 5,
      shapes: ['circle', 'confetti'], gravity: 0.18, gravityBias: 3
    });
  }

  class Dice3DRoller {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.dice = [];
      this.isAnimating = false;
      this.animationFrameId = null;
      this.timeElapsed = 0;
      this.totalAnimationTime = 1200; // 1.2 seconds
      this.diceSize = 40;
      this.gravity = 0.0008;
      this.damping = 0.98;
      this.results = [];
      this.onComplete = null;
      this.effectPhase = null; // 'nat20' | 'nat1' | null
      this.effectTimer = 0;
      this.effectDuration = 1400;
    }

    init() {
      const container = document.getElementById('diceRollerContainer');
      if (!container) this.createContainer();
      
      this.canvas = document.getElementById('diceRollerCanvas');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'diceRollerCanvas';
        this.canvas.width = 640;
        this.canvas.height = 480;
        document.getElementById('diceRollerContainer').appendChild(this.canvas);
      }
      
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    createContainer() {
      if (document.getElementById('diceRollerContainer')) return;
      
      const container = document.createElement('div');
      container.id = 'diceRollerContainer';
      container.innerHTML = `
        <div id="diceRollerModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:2000;align-items:center;justify-content:center;backdrop-filter:blur(8px);">
          <div style="background:rgba(11,12,26,.98);border:2px solid rgba(201,162,39,.4);border-radius:12px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.6),0 0 1px rgba(201,162,39,.3) inset;max-width:680px;width:90%;">
            <div style="background:linear-gradient(180deg,rgba(201,162,39,.12) 0%,rgba(201,162,39,.02) 100%);border-bottom:1px solid rgba(201,162,39,.2);padding:1rem;display:flex;justify-content:space-between;align-items:center;">
              <div style="font-family:'Cinzel',serif;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold2);">⚄ Roll Dice</div>
              <button onclick="closeDiceRoller()" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.4rem;">✕</button>
            </div>
            <div style="padding:1.2rem;background:rgba(6,7,14,.5);">
              <canvas id="diceRollerCanvas" width="640" height="480" style="max-width:100%;border-radius:8px;display:block;margin:0 auto;border:1px solid rgba(201,162,39,.15);"></canvas>
              <div id="diceRollerControls" style="margin-top:1rem;"></div>
            </div>
            <div style="background:linear-gradient(180deg,rgba(201,162,39,.02) 0%,rgba(201,162,39,.08) 100%);border-top:1px solid rgba(201,162,39,.2);padding:1rem;display:flex;justify-content:flex-end;gap:.5rem;flex-wrap:wrap;">
              <div id="diceRollerResult" style="flex:1;min-height:2rem;display:flex;align-items:center;font-size:.9rem;color:var(--teal);font-family:'Rajdhani',sans-serif;font-weight:600;"></div>
              <button onclick="closeDiceRoller()" class="btn btn-sm">Close</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = Math.floor(rect.width * window.devicePixelRatio);
      this.canvas.height = Math.floor(rect.height * window.devicePixelRatio);
      this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    roll(diceString) {
      // Parse dice string: "2d6", "3d20", "1d20+5", etc
      const match = diceString.toLowerCase().match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
      if (!match) {
        console.error('Invalid dice string:', diceString);
        return null;
      }

      const count = parseInt(match[1]);
      const sides = parseInt(match[2]);
      const bonus = parseInt(match[3]) || 0;

      // Validate
      if (count < 1 || count > 10) {
        console.error('Dice count must be 1-10');
        return null;
      }

      const diceKey = `d${sides}`;
      if (!DICE_CONFIG[diceKey]) {
        console.error('Invalid dice type:', diceKey);
        return null;
      }

      this.initRoll(count, diceKey, bonus);
      return this;
    }

    initRoll(count, diceType, bonus = 0) {
      this.dice = [];
      this.results = [];
      this.timeElapsed = 0;
      this.isAnimating = true;
      this.bonus = bonus;
      this.diceType = diceType;
      this.presetValues = null;
      this.effectPhase = null;
      this.effectTimer = 0;
      PARTICLE_POOL.length = 0;

      // Create dice with random initial velocities
      const startX = this.canvas.width / 2;
      const startY = this.canvas.height / 2;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 8 + Math.random() * 4;
        
        const die = {
          id: i,
          type: diceType,
          x: startX + Math.cos(angle) * 40,
          y: startY + Math.sin(angle) * 40,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 2,
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
          rotZ: Math.random() * Math.PI * 2,
          angVelX: (Math.random() - 0.5) * 0.3,
          angVelY: (Math.random() - 0.5) * 0.3,
          angVelZ: (Math.random() - 0.5) * 0.3,
          settled: false,
          settledValue: null
        };
        this.dice.push(die);
      }

      this.animate();
    }

    rollPreset(sides, values, bonus = 0) {
      const safeSides = Math.max(2, Number(sides || 20));
      const safeValues = Array.isArray(values) ? values.map(v => Math.max(1, Math.min(safeSides, Number(v || 1)))) : [];
      if (!safeValues.length) return null;
      const diceKey = `d${safeSides}`;
      if (!DICE_CONFIG[diceKey]) return null;
      this.initRoll(safeValues.length, diceKey, Number(bonus || 0));
      this.presetValues = safeValues.slice();
      for (let i = 0; i < this.dice.length; i++) {
        if (!this.dice[i]) continue;
        this.dice[i].presetValue = this.presetValues[i % this.presetValues.length];
      }
      return this;
    }

    animate = () => {
      this.timeElapsed += 16; // ~60fps

      // Update physics
      this.dice.forEach(die => {
        if (die.settled) return;

        // Gravity
        die.vy += this.gravity * 100;

        // Damping
        die.vx *= this.damping;
        die.vy *= this.damping;

        // Position
        die.x += die.vx;
        die.y += die.vy;

        // Rotation
        die.rotX += die.angVelX;
        die.rotY += die.angVelY;
        die.rotZ += die.angVelZ;

        // Bouncing off walls
        if (die.x - this.diceSize / 2 < 20) {
          die.x = this.diceSize / 2 + 20;
          die.vx = Math.abs(die.vx) * 0.7;
        }
        if (die.x + this.diceSize / 2 > this.canvas.width - 20) {
          die.x = this.canvas.width - this.diceSize / 2 - 20;
          die.vx = -Math.abs(die.vx) * 0.7;
        }
        if (die.y - this.diceSize / 2 < 20) {
          die.y = this.diceSize / 2 + 20;
          die.vy = Math.abs(die.vy) * 0.7;
        }

        // Bottom floor - settle dice
        if (die.y + this.diceSize / 2 > this.canvas.height - 20) {
          die.y = this.canvas.height - this.diceSize / 2 - 20;
          die.vy = die.vy > 0 ? -die.vy * 0.6 : 0;
          die.vx *= 0.9;

          // Check if settled
          const speed = Math.sqrt(die.vx ** 2 + die.vy ** 2);
          if (speed < 0.3 && this.timeElapsed > 600) {
            die.settled = true;
            die.settledValue = this.getDiceResult(die);
          }
        }
      });

      // Draw
      this.draw();

      // Check if all settled or time exceeded
      const allSettled = this.dice.every(d => d.settled);
      if (allSettled || this.timeElapsed > this.totalAnimationTime) {
        this.isAnimating = false;
        this.finishRoll();
      } else {
        this.animationFrameId = requestAnimationFrame(this.animate);
      }
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Background gradient
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, 'rgba(11,14,28,.2)');
      gradient.addColorStop(1, 'rgba(6,7,14,.4)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Border
      this.ctx.strokeStyle = 'rgba(201,162,39,.15)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);

      // Draw floor line
      this.ctx.strokeStyle = 'rgba(201,162,39,.1)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.canvas.height - 20);
      this.ctx.lineTo(this.canvas.width, this.canvas.height - 20);
      this.ctx.stroke();

      // Draw particles (effects layer behind dice)
      updateAndDrawParticles(this.ctx);

      // Draw dice
      this.dice.forEach(die => {
        this.drawDice(die);
      });

      // Nat-20 flash overlay
      if (this.effectPhase === 'nat20') {
        const t = Math.min(1, this.effectTimer / 300);
        const alpha = t < 0.5 ? t * 2 * 0.35 : (1 - t) * 0.35;
        this.ctx.save();
        this.ctx.fillStyle = `rgba(227,188,94,${alpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = `bold ${Math.round(32 + t * 20)}px Cinzel, serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = `rgba(255,255,255,${Math.min(1, t * 3)})`;
        this.ctx.fillText('NAT 20!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.restore();
      }

      // Nat-1 sad overlay
      if (this.effectPhase === 'nat1') {
        const t = Math.min(1, this.effectTimer / 300);
        const alpha = t < 0.5 ? t * 2 * 0.2 : (1 - t) * 0.2;
        this.ctx.save();
        this.ctx.fillStyle = `rgba(80,80,80,${alpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = `bold ${Math.round(26 + t * 10)}px Cinzel, serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = `rgba(200,200,200,${Math.min(1, t * 3)})`;
        this.ctx.fillText('Nat 1... 😬', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.restore();
      }
    }

    drawDice(die) {
      const skin = getActiveSkin();
      const baseColor = skin.colors[die.type] || DICE_CONFIG[die.type].color;
      const x = die.x;
      const y = die.y;
      const size = this.diceSize;

      this.ctx.save();
      this.ctx.translate(x, y);

      // Apply rotation
      this.ctx.rotate(die.rotZ);
      this.ctx.rotate(die.rotY);
      this.ctx.rotate(die.rotX);

      // Skin glow when settled
      if (die.settled && skin.glowColor) {
        this.ctx.shadowColor = skin.glowColor;
        this.ctx.shadowBlur = 14;
      }

      // Draw die cube with shading
      this.ctx.fillStyle = baseColor;
      this.ctx.strokeStyle = skin.edgeColor || 'rgba(255,255,255,.2)';
      this.ctx.lineWidth = die.settled ? 1.5 : 0.5;

      // Front face
      this.ctx.fillRect(-size / 2, -size / 2, size, size);
      this.ctx.strokeRect(-size / 2, -size / 2, size, size);

      // Top face (light)
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = this.lightenColor(baseColor, 0.3);
      this.ctx.beginPath();
      this.ctx.moveTo(-size / 2, -size / 2);
      this.ctx.lineTo(-size / 2 + size / 4, -size / 2 - size / 4);
      this.ctx.lineTo(size / 2 + size / 4, -size / 2 - size / 4);
      this.ctx.lineTo(size / 2, -size / 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Right face (darker)
      this.ctx.fillStyle = this.darkenColor(baseColor, 0.2);
      this.ctx.beginPath();
      this.ctx.moveTo(size / 2, -size / 2);
      this.ctx.lineTo(size / 2 + size / 4, -size / 2 - size / 4);
      this.ctx.lineTo(size / 2 + size / 4, size / 2 - size / 4);
      this.ctx.lineTo(size / 2, size / 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw pip/number indicator
      this.ctx.shadowBlur = 0;
      const skin2 = getActiveSkin();
      this.ctx.fillStyle = skin2.numberColor || '#fff';
      this.ctx.font = 'bold 14px Rajdhani, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      if (die.settledValue) {
        this.ctx.fillText(String(die.settledValue), 0, 0);
      } else {
        this.ctx.font = 'bold 12px Rajdhani, sans-serif';
        this.ctx.fillText('⚄', 0, 0);
      }

      this.ctx.restore();
    }

    getDiceResult(die) {
      if (die && Number.isFinite(Number(die.presetValue))) {
        const safe = Math.max(1, Math.min(DICE_CONFIG[die.type].sides, Number(die.presetValue)));
        return safe;
      }
      const config = DICE_CONFIG[die.type];
      return Math.floor(Math.random() * config.sides) + 1;
    }

    lightenColor(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.min(255, (num >> 16) + percent * 255);
      const g = Math.min(255, ((num >> 8) & 0x00FF) + percent * 255);
      const b = Math.min(255, (num & 0x0000FF) + percent * 255);
      return `rgb(${r},${g},${b})`;
    }

    darkenColor(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.max(0, (num >> 16) - percent * 255);
      const g = Math.max(0, ((num >> 8) & 0x00FF) - percent * 255);
      const b = Math.max(0, (num & 0x0000FF) - percent * 255);
      return `rgb(${r},${g},${b})`;
    }

    finishRoll() {
      // Calculate results
      this.results = this.dice.map(d => ({
        id: d.id,
        type: d.type,
        value: d.settledValue || this.getDiceResult(d)
      }));

      const total = this.results.reduce((sum, r) => sum + r.value, 0) + this.bonus;
      const resultStr = this.results.map(r => r.value).join(' + ') + (this.bonus ? ` + ${this.bonus}` : '') + ` = ${total}`;

      // Detect nat 20 / nat 1 for d20 rolls
      const d20Results = this.results.filter(r => r.type === 'd20');
      const hasNat20 = d20Results.some(r => r.value === 20);
      const hasNat1  = d20Results.some(r => r.value === 1);

      // Trigger effect animation
      if (hasNat20 || hasNat1) {
        this.effectPhase = hasNat20 ? 'nat20' : 'nat1';
        this.effectTimer = 0;
        const cx = this.canvas.width / (window.devicePixelRatio || 1) / 2;
        const cy = this.canvas.height / (window.devicePixelRatio || 1) / 2;
        if (hasNat20) triggerNat20Effect(this.ctx, cx, cy);
        else triggerNat1Effect(this.ctx, cx, cy);

        const effectAnimate = () => {
          this.effectTimer += 16;
          this.draw();
          if (this.effectTimer < this.effectDuration) {
            requestAnimationFrame(effectAnimate);
          } else {
            this.effectPhase = null;
            PARTICLE_POOL.length = 0;
            this.draw();
          }
        };
        requestAnimationFrame(effectAnimate);
      }

      // Display result
      const resultEl = document.getElementById('diceRollerResult');
      if (resultEl) {
        let badge = '';
        if (hasNat20) badge = '<span style="color:#e3bc5e;font-weight:700;margin-left:.4rem;text-transform:uppercase;letter-spacing:.08em;font-size:.7rem;border:1px solid rgba(227,188,94,.5);padding:.1rem .35rem;border-radius:4px;">Nat 20 🎉</span>';
        else if (hasNat1) badge = '<span style="color:#9fa7bc;font-weight:700;margin-left:.4rem;text-transform:uppercase;letter-spacing:.08em;font-size:.7rem;border:1px solid rgba(159,167,188,.3);padding:.1rem .35rem;border-radius:4px;">Nat 1 😬</span>';
        resultEl.innerHTML = `<span style="color:var(--gold2);margin-right:.5rem;">📊</span>${resultStr}${badge}`;
      }

      if (this.onComplete) {
        this.onComplete({ rolls: this.results, bonus: this.bonus, total });
      }
    }
  }

  // Global instance
  let diceRoller = null;

  function initializeDiceRoller() {
    if (!diceRoller) {
      diceRoller = new Dice3DRoller();
      diceRoller.init();
    }
  }

  function openDiceRoller() {
    initializeDiceRoller();
    const modal = document.getElementById('diceRollerModal');
    if (modal) {
      modal.style.display = 'flex';
      renderDiceRollerControls();
    }
  }

  function closeDiceRoller() {
    const modal = document.getElementById('diceRollerModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function renderDiceRollerControls() {
    const controlsEl = document.getElementById('diceRollerControls');
    if (!controlsEl) return;

    const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
    const counts = [1, 2, 3, 4, 5];
    const activeSkinKey = (() => { try { return localStorage.getItem(SKIN_STORAGE_KEY) || 'classic'; } catch(e) { return 'classic'; } })();

    // ── Skin selector row ──────────────────────────────────────────────────
    let skinHtml = `<div style="margin-bottom:.8rem;">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;">Dice Skin</div>
      <div style="display:flex;gap:.3rem;flex-wrap:wrap;">`;
    Object.entries(DICE_SKINS).forEach(([key, skin]) => {
      const active = key === activeSkinKey;
      skinHtml += `<button class="dice-skin-btn" data-skin="${key}" title="${skin.label}" style="
        background:${active ? 'rgba(227,188,94,.22)' : 'rgba(255,255,255,.05)'};
        border:2px solid ${active ? 'rgba(227,188,94,.7)' : 'rgba(255,255,255,.12)'};
        color:var(--text);border-radius:6px;padding:.3rem .5rem;cursor:pointer;font-size:.78rem;
        transition:all .15s;">${skin.icon} ${skin.label}</button>`;
    });
    skinHtml += `</div></div>`;

    let html = skinHtml + `
      <div style="margin-bottom:1rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem;">Select Dice</div>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:.4rem;">
    `;

    diceTypes.forEach(type => {
      const config = DICE_CONFIG[type];
      html += `
        <button class="dice-btn" data-type="${type}" style="
          background:${config.color};
          border:2px solid rgba(255,255,255,.1);
          color:#fff;
          padding:.5rem;
          font-weight:700;
          border-radius:6px;
          cursor:pointer;
          transition:all .15s;
          font-family:'Rajdhani',sans-serif;
        " onmouseover="this.style.borderColor='rgba(255,255,255,.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,.1)'">${type}</button>
      `;
    });

    html += `
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem;">
        <div>
          <label style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);display:block;margin-bottom:.35rem;">Count</label>
          <div style="display:flex;gap:.25rem;flex-wrap:wrap;">
    `;

    counts.forEach(count => {
      html += `
        <button class="count-btn" data-count="${count}" style="
          background:rgba(46,196,182,.2);
          border:1px solid var(--teal);
          color:var(--teal);
          padding:.4rem .6rem;
          border-radius:4px;
          cursor:pointer;
          font-size:.8rem;
          font-weight:600;
          transition:all .15s;
        " onmouseover="this.style.background='rgba(46,196,182,.35)'" onmouseout="this.style.background='rgba(46,196,182,.2)'">${count}</button>
      `;
    });

    html += `
          </div>
        </div>
        <div>
          <label style="font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);display:block;margin-bottom:.35rem;">Bonus</label>
          <input type="number" id="bonusInput" value="0" min="-10" max="20" style="
            background:var(--surface);
            border:1px solid var(--border2);
            color:var(--text);
            padding:.5rem;
            border-radius:4px;
            width:100%;
            font-size:.9rem;
          ">
        </div>
      </div>
      <button onclick="rollDiceFromUI()" style="
        margin-top:1rem;
        background:linear-gradient(180deg,rgba(73,201,187,.3) 0%,rgba(73,201,187,.1) 100%);
        border:2px solid var(--teal);
        color:var(--teal);
        padding:.7rem 1.5rem;
        border-radius:6px;
        font-family:'Cinzel',serif;
        font-size:.85rem;
        letter-spacing:.12em;
        text-transform:uppercase;
        cursor:pointer;
        font-weight:600;
        transition:all .2s;
        width:100%;
      " onmouseover="this.style.background='linear-gradient(180deg,rgba(73,201,187,.5) 0%,rgba(73,201,187,.2) 100%)';this.style.borderColor='rgba(73,201,187,.8)'" onmouseout="this.style.background='linear-gradient(180deg,rgba(73,201,187,.3) 0%,rgba(73,201,187,.1) 100%)';this.style.borderColor='var(--teal)'">
        🎲 Roll Dice
      </button>
    `;

    controlsEl.innerHTML = html;

    // Skin selection
    document.querySelectorAll('.dice-skin-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        setActiveSkin(this.dataset.skin);
        renderDiceRollerControls();
      });
    });

    // Setup event listeners
    let selectedDice = 'd20';
    let selectedCount = 1;

    document.querySelectorAll('.dice-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.dice-btn').forEach(b => b.style.opacity = '0.6');
        this.style.opacity = '1';
        selectedDice = this.dataset.type;
      });
    });

    document.querySelectorAll('.count-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.count-btn').forEach(b => b.style.background = 'rgba(46,196,182,.2)');
        this.style.background = 'rgba(46,196,182,.5)';
        selectedCount = parseInt(this.dataset.count);
      });
    });

    // Set defaults selected
    const defaultDiceBtn = document.querySelector('[data-type="d20"]');
    if (defaultDiceBtn) defaultDiceBtn.style.opacity = '1';
    const defaultCountBtn = document.querySelector('[data-count="1"]');
    if (defaultCountBtn) defaultCountBtn.style.background = 'rgba(46,196,182,.5)';
  }

  function rollDiceFromUI() {
    const selectedType = document.querySelector('.dice-btn[style*="opacity: 1"]')?.dataset.type || 'd20';
    const selectedCount = parseInt(document.querySelector('.count-btn[style*="background: rgba(46, 196, 182, 0.5)"]')?.dataset.count || 1);
    const bonus = parseInt(document.getElementById('bonusInput')?.value || 0);

    const diceString = `${selectedCount}${selectedType}${bonus ? '+' + bonus : ''}`;
    diceRoller.roll(diceString);
  }

  // Expose to window
  window.initializeDiceRoller = initializeDiceRoller;
  window.openDiceRoller = openDiceRoller;
  window.closeDiceRoller = closeDiceRoller;
  window.rollDiceFromUI = rollDiceFromUI;
  window.Dice3DRoller = Dice3DRoller;
  window.DICE_SKINS = DICE_SKINS;
  window.getDiceActiveSkin = getActiveSkin;
  window.setDiceActiveSkin = function(key) { setActiveSkin(key); renderDiceRollerControls(); };
  window.rollPreset3DDice = function(sides, values, bonus, onComplete) {
    initializeDiceRoller();
    const modal = document.getElementById('diceRollerModal');
    if (modal) modal.style.display = 'flex';
    if (typeof onComplete === 'function') diceRoller.onComplete = onComplete;
    return diceRoller.rollPreset(sides, values, bonus || 0);
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDiceRoller);
  } else {
    initializeDiceRoller();
  }
})();
