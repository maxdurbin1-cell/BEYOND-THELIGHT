/**
 * BEYOND: The Light - 3D Dice Roller
 * Professional animated dice with physics simulation
 * Matches D&D Beyond / Roll20 visual style
 * Integrates with BEYOND's game math
 */

(function() {
  'use strict';

  // Dice configuration
  const DICE_CONFIG = {
    d4: { sides: 4, color: '#8b8b9a', min: 1, max: 4 },
    d6: { sides: 6, color: '#49c9bb', min: 1, max: 6 },
    d8: { sides: 8, color: '#7bc87b', min: 1, max: 8 },
    d10: { sides: 10, color: '#f0a840', min: 1, max: 10 },
    d12: { sides: 12, color: '#f0b028', min: 1, max: 12 },
    d20: { sides: 20, color: '#e05050', min: 1, max: 20 }
  };

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
        <div id="diceRollerModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);">
          <div style="background:rgba(11,12,26,.98);border:2px solid rgba(201,162,39,.4);border-radius:12px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.6),0 0 1px rgba(201,162,39,.3) inset;max-width:680px;width:90%;">
            <div style="background:linear-gradient(180deg,rgba(201,162,39,.12) 0%,rgba(201,162,39,.02) 100%);border-bottom:1px solid rgba(201,162,39,.2);padding:1rem;display:flex;justify-content:space-between;align-items:center;">
              <div style="font-family:'Cinzel',serif;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold2);">⚄ Roll Dice</div>
              <button onclick="document.getElementById('diceRollerModal').style.display='none'" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:1.4rem;">✕</button>
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

      // Draw dice
      this.dice.forEach(die => {
        this.drawDice(die);
      });
    }

    drawDice(die) {
      const config = DICE_CONFIG[die.type];
      const x = die.x;
      const y = die.y;
      const size = this.diceSize;

      this.ctx.save();
      this.ctx.translate(x, y);

      // Apply rotation
      this.ctx.rotate(die.rotZ);
      this.ctx.rotate(die.rotY);
      this.ctx.rotate(die.rotX);

      // Draw die cube with shading
      this.ctx.fillStyle = config.color;
      this.ctx.strokeStyle = 'rgba(255,255,255,.2)';
      this.ctx.lineWidth = 0.5;

      // Front face
      this.ctx.fillRect(-size / 2, -size / 2, size, size);
      this.ctx.strokeRect(-size / 2, -size / 2, size, size);

      // Top face (light)
      this.ctx.fillStyle = this.lightenColor(config.color, 0.3);
      this.ctx.beginPath();
      this.ctx.moveTo(-size / 2, -size / 2);
      this.ctx.lineTo(-size / 2 + size / 4, -size / 2 - size / 4);
      this.ctx.lineTo(size / 2 + size / 4, -size / 2 - size / 4);
      this.ctx.lineTo(size / 2, -size / 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Right face (darker)
      this.ctx.fillStyle = this.darkenColor(config.color, 0.2);
      this.ctx.beginPath();
      this.ctx.moveTo(size / 2, -size / 2);
      this.ctx.lineTo(size / 2 + size / 4, -size / 2 - size / 4);
      this.ctx.lineTo(size / 2 + size / 4, size / 2 - size / 4);
      this.ctx.lineTo(size / 2, size / 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw pip/number indicator
      this.ctx.fillStyle = '#fff';
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

      // Display result
      const resultEl = document.getElementById('diceRollerResult');
      if (resultEl) {
        resultEl.innerHTML = `<span style="color:var(--gold2);margin-right:.5rem;">📊</span>${resultStr}`;
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

    let html = `
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
    document.querySelector('[data-type="d20"]').style.opacity = '1';
    document.querySelector('[data-count="1"]').style.background = 'rgba(46,196,182,.5)';
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

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDiceRoller);
  } else {
    initializeDiceRoller();
  }
})();
