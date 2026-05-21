import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const START_TIMEOUT_MS = 20000;
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkPortOpen(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '127.0.0.1');
  });
}

async function pickAvailablePort(preferredPort = 3000) {
  if (await checkPortOpen(preferredPort)) return preferredPort;
  for (let i = 0; i < 25; i += 1) {
    const candidate = 4200 + Math.floor(Math.random() * 1200);
    if (await checkPortOpen(candidate)) return candidate;
  }
  throw new Error('Unable to find a free port for the dddice smoke server.');
}

async function waitForServer(url, child) {
  const start = Date.now();
  while (Date.now() - start < START_TIMEOUT_MS) {
    if (child.exitCode !== null) throw new Error('Smoke server exited before becoming ready.');
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch (_err) {}
    await wait(250);
  }
  throw new Error('Timed out waiting for smoke server readiness.');
}

async function dismissBlockingOverlays(page) {
  await page.evaluate(() => {
    try {
      if (window.introSystem && typeof window.introSystem.skipIntro === 'function') window.introSystem.skipIntro();
    } catch (_err) {}
    try {
      if (window.soloReference && typeof window.soloReference.close === 'function') window.soloReference.close();
    } catch (_err) {}
    try {
      if (typeof window.closeModal === 'function') window.closeModal();
    } catch (_err) {}
  });
}

async function run() {
  const port = await pickAvailablePort(Number(process.env.PORT || 3000));
  const baseUrl = process.env.SMOKE_URL || `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server.js'], {
    cwd: REPO_ROOT,
    env: Object.assign({}, process.env, {
      PORT: String(port),
      HOST: '127.0.0.1',
      PAYWALL_DISABLED: '1',
      PAYWALL_BYPASS_LOCALHOST: '1'
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let serverLog = '';
  child.stdout.on('data', (chunk) => { serverLog += String(chunk || ''); });
  child.stderr.on('data', (chunk) => { serverLog += String(chunk || ''); });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err && err.message ? err.message : err)));

  try {
    await waitForServer(baseUrl, child);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await dismissBlockingOverlays(page);

    await page.waitForFunction(() => typeof window.updateDiceVisualUI === 'function', null, { timeout: 10000 });

    const postBuildState = await page.evaluate(() => {
      if (typeof window.updateDiceVisualUI === 'function') window.updateDiceVisualUI();
      if (typeof window.ensureDddiceVisualControls === 'function') window.ensureDddiceVisualControls();
      if (typeof window.syncDddiceVisualProvider === 'function') window.syncDddiceVisualProvider();
      return {
        providerSel: !!document.getElementById('diceVisualProviderSel'),
        panel: !!document.getElementById('dddiceConfigPanel')
      };
    });
    if (!postBuildState.providerSel) {
      throw new Error(`dddice controls did not build: ${JSON.stringify(postBuildState)}`);
    }
    await page.evaluate(() => {
      if (typeof window.setDiceVisualProvider !== 'function') throw new Error('setDiceVisualProvider is unavailable');
      window.setDiceVisualProvider('dddice');
      if (typeof window.syncDddiceVisualProvider === 'function') window.syncDddiceVisualProvider();
    });
    const panelState = await page.evaluate(() => {
      const provider = document.getElementById('diceVisualProviderSel');
      const panel = document.getElementById('dddiceConfigPanel');
      const theme = document.getElementById('dddiceThemeSel');
      return {
        provider: provider ? provider.value : '',
        panelVisible: !!(panel && window.getComputedStyle(panel).display !== 'none'),
        defaultTheme: theme ? theme.value : '',
        overlayLoaded: !!window.BTLDddiceOverlay,
        providerState: window.DICE_VISUAL && window.DICE_VISUAL.provider
      };
    });

    if (panelState.provider !== 'classic' || panelState.panelVisible) {
      throw new Error(`dddice fallback state invalid: ${JSON.stringify(panelState)}`);
    }

    if (pageErrors.length) {
      throw new Error(`Page errors encountered: ${pageErrors.join(' | ')}`);
    }
    console.log('dddice overlay smoke passed');
  } finally {
    await browser.close();
    if (child.exitCode === null) child.kill('SIGTERM');
    if (serverLog) process.stdout.write(serverLog);
  }
}

run().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
