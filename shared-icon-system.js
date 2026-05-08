(function () {
  function escHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hashString(value) {
    var text = String(value || '');
    var out = 0;
    for (var i = 0; i < text.length; i++) out = ((out << 5) - out) + text.charCodeAt(i);
    return Math.abs(out || 1);
  }

  function resolveAccent(seed) {
    var hues = ['#e8c050', '#46c4b6', '#ff8450', '#9ad7ff', '#c39cff', '#7fd07f'];
    return hues[hashString(seed) % hues.length];
  }

  function frameSvg(inner, opts) {
    var size = Math.max(18, Number(opts && opts.size || 44));
    var accent = String(opts && opts.accent || '#e8c050');
    var bg = String(opts && opts.bg || 'rgba(11,16,22,.92)');
    var glow = String(opts && opts.glow || accent);
    var title = escHtml(opts && opts.title || '');
    return '<span style="display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;border-radius:14px;border:1px solid ' + accent + ';background:' + bg + ';box-shadow:0 0 0 1px rgba(255,255,255,.05) inset, 0 0 16px rgba(0,0,0,.18), 0 0 20px ' + glow + '22;overflow:hidden;">'
      + '<svg viewBox="0 0 64 64" width="' + Math.round(size - 8) + '" height="' + Math.round(size - 8) + '" aria-hidden="true" focusable="false">'
      + (title ? '<title>' + title + '</title>' : '')
      + inner
      + '</svg></span>';
  }

  function iconMedal(opts) {
    var accent = String(opts && opts.accent || '#e8c050');
    return frameSvg(
      '<path d="M20 8h10l4 14H26z" fill="#5bc4b6"/><path d="M34 8h10l-6 14H30z" fill="#ff8450"/>'
      + '<circle cx="32" cy="34" r="16" fill="' + accent + '"/><circle cx="32" cy="34" r="10" fill="#161d27"/>'
      + '<path d="M32 24l3.2 6.8 7.5 1-5.5 5.1 1.4 7.4L32 40.6l-6.6 3.7 1.4-7.4-5.5-5.1 7.5-1z" fill="#f8f4df"/>',
      opts
    );
  }

  function iconChest(opts) {
    var accent = String(opts && opts.accent || '#c98d44');
    return frameSvg(
      '<rect x="12" y="24" width="40" height="24" rx="5" fill="#4a2d17" stroke="' + accent + '" stroke-width="2"/>'
      + '<path d="M12 28c8-8 32-8 40 0v-7c0-4-3-7-7-7H19c-4 0-7 3-7 7z" fill="' + accent + '" opacity=".88"/>'
      + '<rect x="29" y="22" width="6" height="26" rx="2" fill="#f4d889"/>'
      + '<rect x="26" y="30" width="12" height="8" rx="3" fill="#20160e" stroke="#f4d889" stroke-width="1.4"/>',
      opts
    );
  }

  function iconMonster(region, opts) {
    var palette = {
      province: '#ff8450',
      sea: '#46c4b6',
      wtw: '#c39cff',
      planet: '#7fd07f',
      galaxy: '#9ad7ff'
    };
    var accent = palette[String(region || 'province')] || '#e8c050';
    var glyphs = {
      province: '<path d="M15 44l9-22 8 9 8-17 9 30H39l-7-7-6 7z" fill="' + accent + '"/><circle cx="25" cy="28" r="2" fill="#10151c"/><circle cx="39" cy="24" r="2" fill="#10151c"/>',
      sea: '<path d="M13 40c8-18 30-22 38-8-4 0-8 3-10 8 3 0 6 3 7 8-8-4-14-4-19 0 0-6-4-8-16-8z" fill="' + accent + '"/><circle cx="41" cy="27" r="2" fill="#0f1720"/>',
      wtw: '<circle cx="32" cy="28" r="13" fill="' + accent + '" opacity=".95"/><path d="M22 46c4-6 16-6 20 0" stroke="' + accent + '" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="27" cy="28" r="2.4" fill="#111822"/><circle cx="37" cy="28" r="2.4" fill="#111822"/>',
      planet: '<path d="M20 42c0-10 5-20 12-20s12 10 12 20" fill="none" stroke="' + accent + '" stroke-width="6" stroke-linecap="round"/><path d="M16 27l10-9M48 27l-10-9M22 45l-6 7M42 45l6 7" stroke="' + accent + '" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="25" r="3" fill="#10151c"/>',
      galaxy: '<path d="M11 37c8-12 15-17 21-17s13 5 21 17l-10 4-11-8-11 8z" fill="' + accent + '"/><path d="M26 38h12l4 9H22z" fill="#f4f8ff" opacity=".88"/>'
    };
    var next = Object.assign({}, opts || {}, { accent: accent, title: String(opts && opts.title || (String(region || 'monster') + ' creature')) });
    return frameSvg(glyphs[String(region || 'province')] || glyphs.province, next);
  }

  function iconWayfarer(seed, opts) {
    var accent = String(opts && opts.accent || resolveAccent(seed || 'wayfarer'));
    return frameSvg(
      '<circle cx="32" cy="21" r="9" fill="' + accent + '" opacity=".95"/>'
      + '<path d="M18 49c2-10 7-17 14-17s12 7 14 17" fill="none" stroke="' + accent + '" stroke-width="8" stroke-linecap="round"/>'
      + '<path d="M22 19l8-9 12 0 4 6" fill="none" stroke="#0f1620" stroke-width="3" stroke-linecap="round" opacity=".35"/>',
      Object.assign({}, opts || {}, { accent: accent })
    );
  }

  function iconTrophy(opts) {
    var accent = String(opts && opts.accent || '#e8c050');
    return frameSvg(
      '<path d="M22 14h20v9c0 7-4 14-10 16-6-2-10-9-10-16z" fill="' + accent + '"/>'
      + '<path d="M22 17h-6c0 8 4 12 10 12M42 17h6c0 8-4 12-10 12" fill="none" stroke="' + accent + '" stroke-width="4" stroke-linecap="round"/>'
      + '<rect x="28" y="39" width="8" height="7" rx="2" fill="#f6f0d5"/><rect x="22" y="46" width="20" height="6" rx="3" fill="#755127"/>',
      opts
    );
  }

  function iconVehicle(kind, opts) {
    var accents = { caravan: '#c98d44', starship: '#9ad7ff', naval: '#46c4b6' };
    var accent = accents[String(kind || 'caravan')] || '#e8c050';
    var glyphs = {
      caravan: '<path d="M12 38h34l6 7H12z" fill="' + accent + '"/><path d="M18 23h19l5 15H13z" fill="#6b4220" stroke="' + accent + '" stroke-width="2"/><circle cx="21" cy="49" r="5" fill="#1a2029" stroke="' + accent + '" stroke-width="2"/><circle cx="42" cy="49" r="5" fill="#1a2029" stroke="' + accent + '" stroke-width="2"/>',
      starship: '<path d="M32 9l10 17h10l-11 8 3 16-12-8-12 8 3-16-11-8h10z" fill="' + accent + '"/>',
      naval: '<path d="M10 41h44l-9 10H19z" fill="' + accent + '"/><path d="M30 15h4l8 18H22z" fill="#f4f8ff" opacity=".9"/><path d="M32 15v26" stroke="#24313f" stroke-width="3"/><path d="M18 47c4 4 8 4 12 0 4 4 8 4 12 0 4 4 8 4 12 0" fill="none" stroke="#7ec6d9" stroke-width="3" stroke-linecap="round"/>'
    };
    return frameSvg(glyphs[String(kind || 'caravan')] || glyphs.caravan, Object.assign({}, opts || {}, { accent: accent }));
  }

  function getChestAccent(tier) {
    return {
      bronze: '#c98d44',
      silver: '#c5ccd6',
      gold: '#e8c050',
      platinum: '#8ce4f4'
    }[String(tier || 'bronze')] || '#c98d44';
  }

  function getRaidChestLabelHtml(tier, label, opts) {
    var accent = getChestAccent(tier);
    var text = escHtml(label || 'Chest');
    return '<span style="display:inline-flex;align-items:center;gap:.35rem;">'
      + iconChest(Object.assign({}, opts || {}, { size: opts && opts.size || 22, accent: accent, title: text }))
      + '<span>' + text + '</span></span>';
  }

  function getRaidMedalStripHtml(count, opts) {
    var label = escHtml(opts && opts.label || 'Raid Medals');
    var total = Math.max(0, Number(count || 0));
    return '<span style="display:inline-flex;align-items:center;gap:.38rem;">'
      + iconMedal({ size: opts && opts.size || 20, accent: opts && opts.accent || '#e8c050', title: label })
      + '<span style="color:var(--gold2);">' + label + ': ' + total + '</span></span>';
  }

  function getTrophyEntryHtml(name, opts) {
    var trophyName = String(name || 'Unknown Trophy');
    return '<div style="display:flex;align-items:center;gap:.42rem;padding:.08rem 0;border-bottom:1px solid rgba(255,255,255,.06);">'
      + iconTrophy({ size: opts && opts.size || 22, accent: resolveAccent(trophyName), title: trophyName })
      + '<span>' + escHtml(trophyName) + '</span></div>';
  }

  function getBestiaryEntryIconHtml(region, entry, opts) {
    var title = entry && entry.name ? entry.name : 'Bestiary Entry';
    return iconMonster(region, Object.assign({}, opts || {}, { title: title }));
  }

  function getWayfarerPortraitHtml(state, opts) {
    var safeState = state || {};
    var name = safeState.name || 'Unnamed Wayfarer';
    var career = safeState.career || 'Wanderer';
    var background = safeState.background || 'Unwritten origin';
    var omen = safeState.omen || 'No omen chosen';
    var accent = resolveAccent([name, career, background, omen].join('|'));
    var portrait = iconWayfarer([name, career].join('|'), { size: opts && opts.size || 92, accent: accent, title: name });
    return '<div style="display:grid;grid-template-columns:auto 1fr;gap:.65rem;align-items:center;padding:.58rem .62rem;border:1px solid ' + accent + '55;background:linear-gradient(155deg, ' + accent + '16, rgba(9,13,18,.92));">'
      + portrait
      + '<div>'
      + '<div style="font-size:.8rem;color:var(--text2);font-family:Cinzel,serif;line-height:1.2;">' + escHtml(name) + '</div>'
      + '<div style="font-size:.7rem;color:' + accent + ';text-transform:uppercase;letter-spacing:.1em;margin-top:.08rem;">' + escHtml(career) + '</div>'
      + '<div style="font-size:.66rem;color:var(--muted2);line-height:1.45;margin-top:.18rem;">' + escHtml(background) + '</div>'
      + '<div style="display:flex;gap:.2rem;flex-wrap:wrap;margin-top:.2rem;">'
      + '<span style="font-size:.58rem;padding:.08rem .22rem;border:1px solid ' + accent + '44;color:' + accent + ';text-transform:uppercase;letter-spacing:.08em;">Omen</span>'
      + '<span style="font-size:.6rem;color:var(--muted2);">' + escHtml(omen) + '</span>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderWayfarerSheetPanel(targetId, state) {
    if (typeof document === 'undefined') return false;
    var el = typeof targetId === 'string' ? document.getElementById(targetId) : targetId;
    if (!el) return false;
    el.innerHTML = getWayfarerPortraitHtml(state || {}, { size: 92 });
    return true;
  }

  window.SharedIconSystem = {
    iconMedal: iconMedal,
    iconChest: iconChest,
    iconMonster: iconMonster,
    iconWayfarer: iconWayfarer,
    iconTrophy: iconTrophy,
    iconVehicle: iconVehicle,
    getRaidChestLabelHtml: getRaidChestLabelHtml,
    getRaidMedalStripHtml: getRaidMedalStripHtml,
    getTrophyEntryHtml: getTrophyEntryHtml,
    getBestiaryEntryIconHtml: getBestiaryEntryIconHtml,
    getWayfarerPortraitHtml: getWayfarerPortraitHtml,
    renderWayfarerSheetPanel: renderWayfarerSheetPanel,
    resolveAccent: resolveAccent
  };
})();