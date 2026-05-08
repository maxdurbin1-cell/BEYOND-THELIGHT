/**
 * Integrated AI Portrait Generation System
 * Generates character portraits directly from traits and displays in Identity Card
 * Supports: Replicate, Stability AI, OpenAI Images, Hugging Face
 */

(function() {
  // Configuration - user should set their API key
  const CONFIG = {
    provider: 'replicate', // 'replicate' | 'stability' | 'openai' | 'huggingface'
    apiKey: localStorage.getItem('portraitGeneratorApiKey') || '',
    cachePortraits: true,
    maxRetries: 2,
    timeout: 60000
  };

  // Portrait cache (key: traitHash, value: dataURL)
  const portraitCache = new Map();

  /**
   * Extract character traits and build AI prompt
   */
  function buildPortraitPrompt(state) {
    const safe = state || {};
    const traitPairs = [
      ['physique', 'Physique'],
      ['skin', 'Skin'],
      ['hair', 'Hair'],
      ['face', 'Face'],
      ['clothing', 'Clothing'],
      ['virtue', 'Virtue'],
      ['vice', 'Vice'],
      ['reputation', 'Reputation'],
      ['misfortune', 'Misfortune']
    ];

    const traits = [];
    for (let i = 0; i < traitPairs.length; i++) {
      const key = traitPairs[i][0];
      const label = traitPairs[i][1];
      let value = safe[key];
      if (!value && safe.traits && typeof safe.traits === 'object') {
        value = safe.traits[key];
      }
      if (value) traits.push(label + ': ' + String(value));
    }

    // Build final prompt with style guide
    const stylePrefix = 'dark fantasy character portrait, painterly RPG style, centered head-and-shoulders, neutral background, atmospheric lighting';
    return stylePrefix + (traits.length ? ', ' + traits.join(', ') : '');
  }

  /**
   * Generate unique hash from state for caching
   */
  function hashTraits(state) {
    const traitString = [
      (state && state.physique) || '',
      (state && state.skin) || '',
      (state && state.hair) || '',
      (state && state.face) || '',
      (state && state.clothing) || '',
      (state && state.virtue) || '',
      (state && state.vice) || '',
      (state && state.reputation) || '',
      (state && state.misfortune) || ''
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < traitString.length; i++) {
      const chr = traitString.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate portrait using Replicate API
   */
  async function generateViaReplicate(prompt, apiKey) {
    const model = 'stability-ai/stable-diffusion-3-medium';
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + apiKey
      },
      body: JSON.stringify({
        version: '5f61ba55f70e559ce20b1ec09d6c69ff475271787f00eab182e108b312b39f19',
        input: {
          prompt: prompt,
          num_outputs: 1,
          height: 512,
          width: 512,
          guidance_scale: 7.5,
          num_inference_steps: 30
        }
      })
    });

    if (!response.ok) throw new Error('Replicate API error: ' + response.statusText);
    
    const data = await response.json();
    if (!data.output || !data.output.length) throw new Error('No image generated');
    
    return data.output[0];
  }

  /**
   * Generate portrait using Stability AI API
   */
  async function generateViaStabilityAI(prompt, apiKey) {
    const response = await
 fetch('https://api.stability.ai/v1/generation/stable-diffusion-v3-medium/text-to-image', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        steps: 30,
        height: 512,
        width: 512,
        guidance_scale: 7.5
      })
    });

    if (!response.ok) throw new Error('Stability AI error: ' + response.statusText);
    
    const data = await response.json();
    if (!data.artifacts || !data.artifacts.length) throw new Error('No image generated');
    
    return 'data:image/png;base64,' + data.artifacts[0].base64;
  }

  /**
   * Generate portrait using OpenAI Images API
   */
  async function generateViaOpenAI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: '512x512',
        model: 'dall-e-3',
        quality: 'standard'
      })
    });

    if (!response.ok) throw new Error('OpenAI API error: ' + response.statusText);
    
    const data = await response.json();
    if (!data.data || !data.data.length) throw new Error('No image generated');
    
    return data.data[0].url;
  }

  /**
   * Generate portrait using Hugging Face Inference API
   */
  async function generateViaHuggingFace(prompt, apiKey) {
    const model = 'stabilityai/stable-diffusion-2-1';
    const response = await fetch('https://api-inference.huggingface.co/models/' + model, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) throw new Error('Hugging Face API error: ' + response.statusText);
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Main portrait generation function
   */
  async function generatePortrait(state, options) {
    options = options || {};
    const apiKey = options.apiKey || CONFIG.apiKey;
    const provider = options.provider || CONFIG.provider;

    if (!apiKey) {
      throw new Error('Portrait generator API key not configured. Set it via setPortraitGeneratorConfig()');
    }

    const traitHash = hashTraits(state);
    if (CONFIG.cachePortraits && portraitCache.has(traitHash)) {
      return portraitCache.get(traitHash);
    }

    const prompt = buildPortraitPrompt(state);
    let imageUrl = null;
    let lastError = null;

    for (let retry = 0; retry < CONFIG.maxRetries; retry++) {
      try {
        if (provider === 'replicate') {
          imageUrl = await generateViaReplicate(prompt, apiKey);
        } else if (provider === 'stability') {
          imageUrl = await generateViaStabilityAI(prompt, apiKey);
        } else if (provider === 'openai') {
          imageUrl = await generateViaOpenAI(prompt, apiKey);
        } else if (provider === 'huggingface') {
          imageUrl = await generateViaHuggingFace(prompt, apiKey);
        } else {
          throw new Error('Unknown provider: ' + provider);
        }

        if (imageUrl) break;
      } catch (err) {
        lastError = err;
        if (retry < CONFIG.maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    if (!imageUrl) {
      throw lastError || new Error('Failed to generate portrait');
    }

    if (CONFIG.cachePortraits) {
      portraitCache.set(traitHash, imageUrl);
    }

    return imageUrl;
  }

  /**
   * Update Identity Card portrait with generated image
   */
  async function renderGeneratedPortrait(elementId, state) {
    const el = document.getElementById(elementId);
    if (!el) return false;

    // Add loading state
    const originalContent = el.innerHTML;
    el.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--muted2);">⟳ Generating portrait...</div>';

    try {
      const imageUrl = await generatePortrait(state);
      
      // Display generated portrait
      el.innerHTML = '<div style="border:1px solid var(--border2);border-radius:8px;overflow:hidden;margin-bottom:.5rem;">'
        + '<img src="' + imageUrl + '" alt="Generated Portrait" style="width:100%;height:auto;display:block;"/>'
        + '</div>'
        + '<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.3rem;">Generated portrait from character traits</div>'
        + '<div style="display:flex;gap:.25rem;flex-wrap:wrap;">'
        + '<button class="btn btn-xs" onclick="window.PortraitGenerator.clearCache();document.getElementById(\'' + elementId + '\').innerHTML=\''
        + originalContent.replace(/'/g, '\\\'').replace(/"/g, '\\"').replace(/\n/g, '\\n')
        + '\';">Regenerate</button>'
        + '<button class="btn btn-xs btn-primary" onclick="window.PortraitGenerator.downloadPortrait(\'' + imageUrl + '\',\'' + (state && state.name || 'portrait') + '\');">Download</button>'
        + '</div>';

      return true;
    } catch (err) {
      console.error('Portrait generation failed:', err);
      el.innerHTML = originalContent + '<div style="margin-top:.3rem;padding:.3rem;background:rgba(200,80,80,.1);border:1px solid rgba(200,80,80,.3);border-radius:4px;font-size:.72rem;color:var(--red2);">Generation failed: ' + err.message + '</div>';
      return false;
    }
  }

  /**
   * Download portrait as PNG
   */
  function downloadPortrait(imageUrl, characterName) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = (characterName || 'portrait') + '_portrait.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Clear portrait cache
   */
  function clearCache() {
    portraitCache.clear();
  }

  /**
   * Configure portrait generator
   */
  function setConfig(options) {
    Object.assign(CONFIG, options);
    if (options.apiKey) {
      localStorage.setItem('portraitGeneratorApiKey', options.apiKey);
    }
  }

  // Export public API
  window.PortraitGenerator = {
    generatePortrait: generatePortrait,
    renderGeneratedPortrait: renderGeneratedPortrait,
    buildPortraitPrompt: buildPortraitPrompt,
    setConfig: setConfig,
    clearCache: clearCache,
    downloadPortrait: downloadPortrait,
    CONFIG: CONFIG
  };
})();
