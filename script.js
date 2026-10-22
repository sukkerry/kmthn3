'use strict';
/* KM Tahun 3 - 3.2.1 & 3.2.2 Pengamatan Penglihatan
   5 aktiviti x 3 aras kesukaran */

const $ = (s, r = document) => r.querySelector(s);
const shuf = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const LV = ['Mudah', 'Sederhana', 'Sukar'];

/* ---------- bunyi, suara, confetti ---------- */
let ac;
function tone(f, d = .15, t = 0) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(), s = ac.currentTime + t;
    o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(.2, s); g.gain.exponentialRampToValueAtTime(.001, s + d);
    o.start(s); o.stop(s + d);
  } catch (e) { }
}
const sfx = {
  ok: () => { tone(660); tone(880, .2, .12); },
  no: () => tone(220, .25),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, .25, i * .14))
};
function speak(t) {
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'ms-MY'; u.rate = .85; speechSynthesis.speak(u); } catch (e) { }
}
function confetti() {
  const c = $('#confetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#ff6b6b', '#ffc93c', '#2ec4a6', '#3ba7ff', '#8d6bff'];
  const p = Array.from({ length: 130 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, r: 6 + Math.random() * 8, vx: Math.random() * 4 - 2, vy: 2 + Math.random() * 4, c: cols[Math.random() * 5 | 0], a: Math.random() * 6 }));
  let n = 0;
  (function f() {
    x.clearRect(0, 0, c.width, c.height);
    p.forEach(q => { q.x += q.vx; q.y += q.vy; q.a += .1; x.fillStyle = q.c; x.save(); x.translate(q.x, q.y); x.rotate(q.a); x.fillRect(-q.r / 2, -q.r / 2, q.r, q.r * .6); x.restore(); });
    if (++n < 190) requestAnimationFrame(f); else x.clearRect(0, 0, c.width, c.height);
  })();
}

/* ---------- keadaan aplikasi ---------- */
let level = 1, stars = 0, cur = null, mistakes = 0;
const best = {};

function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); scrollTo(0, 0); }

const api = {
  prog(d, t) { $('#progress').style.width = (d / t * 100) + '%'; },
  good() { sfx.ok(); },
  bad(m) { mistakes++; sfx.no(); toast(m || 'Cuba lagi, awak boleh! 💪'); },
  finish(override) {
    const m = override === undefined ? mistakes : override;
    const n = m === 0 ? 3 : m <= 2 ? 2 : 1;
    stars += n; best[cur.id + level] = Math.max(best[cur.id + level] || 0, n);
    $('#totalStars').textContent = stars;
    $('#mStars').innerHTML = [1, 2, 3].map(i => `<span style="animation-delay:${i * .25}s">${i <= n ? '⭐' : '☆'}</span>`).join('');
    $('#next').hidden = level >= 3;
    $('#modal').hidden = false; sfx.win(); confetti(); speak('Hebat! Tahniah!');
  }
};

function start(a) {
  cur = a; mistakes = 0;
  $('#modal').hidden = true;
  const S = $('#stage'); S.innerHTML = '';
  $('#instr').textContent = a.ins;
  $('#actTitle').textContent = `${a.icon} ${a.name} - Aras ${level} (${LV[level - 1]})`;
  $('#progress').style.width = '0';
  show('play');
  a.fn(level, S, api);
}

/* ---------- enjin seret & lepas (sentuh, tetikus + ketik-pilih) ---------- */
const chip = (id, icon, label) => `<div class="chip" data-id="${id}" role="button" tabindex="0"><b>${icon}</b>${label}</div>`;

function dnd(R, A, fn) {
  let d = null, sel = null;
  const zoneAt = (x, y) => document.elementsFromPoint(x, y).find(e => e.classList && e.classList.contains('zone'));
  const hot = z => { R.querySelectorAll('.zone.hot').forEach(e => e !== z && e.classList.remove('hot')); if (z) z.classList.add('hot'); };
  const attempt = (c, z) => {
    if (!z || z.classList.contains('ok')) return;
    const ok = fn(c.dataset.id, z.dataset.key, c, z);
    c.classList.remove('sel', 'shake');
    if (ok) { c.classList.add('done'); A.good(); }
    else { A.bad(); void c.offsetWidth; c.classList.add('shake'); }
    sel = null;
  };
  R.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('pointerdown', e => {
      if (c.classList.contains('done')) return;
      e.preventDefault(); c.setPointerCapture(e.pointerId);
      d = { c, sx: e.clientX, sy: e.clientY, moved: false }; c.classList.add('lift');
    });
    c.addEventListener('pointermove', e => {
      if (!d || d.c !== c) return;
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (Math.abs(dx) + Math.abs(dy) > 8) d.moved = true;
      c.style.transform = `translate(${dx}px,${dy}px) scale(1.1)`;
      hot(zoneAt(e.clientX, e.clientY));
    });
    const end = e => {
      if (!d || d.c !== c) return;
      c.classList.remove('lift'); c.style.transform = ''; hot(null);
      if (d.moved) { attempt(c, zoneAt(e.clientX, e.clientY)); }
      else {
        const was = c.classList.contains('sel');
        R.querySelectorAll('.chip.sel').forEach(x => x.classList.remove('sel'));
        sel = was ? null : c; if (!was) { c.classList.add('sel'); sfx.ok(); }
      }
      d = null;
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', () => { if (d) { c.classList.remove('lift'); c.style.transform = ''; hot(null); d = null; } });
  });
  R.querySelectorAll('.zone').forEach(z => z.addEventListener('click', () => { if (sel) attempt(sel, z); }));
}

/* ======================================================
   AKTIVITI 1: MENGECAM (Aras 3 = mengingat kembali)
   ====================================================== */
const Q1 = {
  1: [['🔴', 'Apakah bentuk ini?', ['Bulatan', 'Segi tiga'], 'Bulatan'],
      ['🔺', 'Apakah bentuk ini?', ['Segi empat sama', 'Segi tiga'], 'Segi tiga'],
      ['🟦', 'Apakah bentuk ini?', ['Segi empat sama', 'Bulatan'], 'Segi empat sama'],
      ['A', 'Apakah huruf ini?', ['A', 'B'], 'A'],
      ['3', 'Apakah nombor ini?', ['3', '5'], '3']],
  2: [['M', 'Cari huruf yang sama.', ['N', 'M', 'W'], 'M'],
      ['b', 'Cari huruf yang sama.', ['d', 'p', 'b'], 'b'],
      ['6', 'Cari nombor yang sama.', ['9', '6', '8'], '6'],
      ['🔶', 'Cari bentuk yang sama.', ['🔷', '🔶', '🟥'], '🔶'],
      ['BOLA', 'Cari perkataan yang sama.', ['BULA', 'BOLA', 'BALO'], 'BOLA']],
  3: [['RUMAH', '', ['RUAH', 'RUMAH', 'RAMUH', 'RUMA'], 'RUMAH'],
      ['2580', '', ['2850', '2580', '5280', '2508'], '2580'],
      ['🔶', '', ['🔸', '🟧', '🔶', '🔷'], '🔶'],
      ['Ali makan nasi', '', ['Ali makan roti', 'Abu makan nasi', 'Ali makan nasi', 'Ali minum nasi'], 'Ali makan nasi'],
      ['KUCING', '', ['KUCIN', 'KUCING', 'KUCNIG', 'KACING'], 'KUCING']]
};
function kenal(L, S, A) {
  const qs = shuf(Q1[L]), mem = L === 3; let i = 0;
  (async function next() {
    const [ic, t, o, a] = qs[i]; A.prog(i, qs.length);
    S.innerHTML = `<div class="qcard"><div class="big${[...ic].length > 2 ? ' word' : ''}" id="tgt">${ic}</div>
      <h2 id="qt">${mem ? 'Lihat dan ingat!' : t}</h2>
      <div class="opts" id="opts"${mem ? ' hidden' : ''}>${shuf(o).map(k => `<button class="opt${L > 1 ? ' glyph' : ''}" data-k="${k}">${k}</button>`).join('')}</div></div>`;
    $('#instr').textContent = L === 1 ? 'Lihat gambar. Tekan jawapan yang betul.' : L === 2 ? 'Lihat dengan teliti. Tekan yang sama.' : 'Lihat dan ingat. Selepas itu, tekan yang tadi.';
    if (mem) { await wait(2800); $('#tgt').textContent = '❓'; $('#tgt').classList.remove('word'); $('#qt').textContent = 'Yang mana tadi?'; $('#opts').hidden = false; }
    S.querySelectorAll('.opt').forEach(b => b.onclick = async () => {
      if (b.dataset.k === a) {
        A.good(); b.classList.add('right'); S.querySelectorAll('.opt').forEach(x => x.disabled = true);
        if (mem) $('#tgt').textContent = ic;
        await wait(1000);
        if (++i < qs.length) next(); else { A.prog(1, 1); A.finish(); }
      } else { A.bad(); b.classList.add('wrong'); b.disabled = true; }
    });
  })();
}

/* ======================================================
   AKTIVITI 2: SERET & LEPAS - MEMADANKAN
   ====================================================== */
const PD = {
  1: [['🔴', '', '🔴'], ['🔺', '', '🔺'], ['🟦', '', '🟦']],
  2: [['A', '', 'a'], ['B', '', 'b'], ['D', '', 'd'], ['G', '', 'g']],
  3: [['', 'BOLA', '⚽'], ['', 'BUNGA', '🌸'], ['', 'RUMAH', '🏠'], ['', 'BUS', '🚌'], ['', 'IKAN', '🐟']]
};
function padan(L, S, A) {
  const P = PD[L], idx = P.map((_, i) => i);
  $('#instr').textContent = L === 1 ? 'Seret bentuk ke bentuk yang sama.' : L === 2 ? 'Seret huruf besar ke huruf kecil yang sama.' : 'Seret perkataan ke gambar yang betul.';
  S.innerHTML = `<div class="chips">${shuf(idx).map(i => chip(i, P[i][0], P[i][1])).join('')}</div>
    <div class="zones">${shuf(idx).map(i => `<div class="zone" data-key="${i}"><span class="zt${L === 1 ? ' ghost' : ''}">${P[i][2]}</span><div class="slot"></div></div>`).join('')}</div>`;
  let n = 0;
  dnd(S, A, (id, key, c, z) => {
    if (id !== key) return false;
    z.querySelector('.slot').appendChild(c); z.classList.add('ok'); z.querySelector('.zt').classList.remove('ghost'); A.prog(++n, P.length);
    if (n === P.length) setTimeout(() => A.finish(), 800);
    return true;
  });
}

/* ======================================================
   AKTIVITI 3: JIGSAW (tekan dua kepingan untuk tukar)
   ====================================================== */
function jigsaw(L, S, A) {
  const [cols, rows, em, lab, c1, c2, sz] = {
    1: [2, 2, '⭐', 'BINTANG', '#ff9f43', '#fff0c9', .5],
    2: [3, 2, 'Aa', 'HURUF A', '#3ba7ff', '#d6efff', .5],
    3: [3, 3, '123', 'NOMBOR', '#8d6bff', '#e6deff', .4]
  }[L];
  const W = cols * 200, H = rows * 200, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) { x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.arc((i * 97) % W, (i * 61) % H, 16 + (i % 4) * 10, 0, 7); x.fill(); }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#2b2d42';
  x.font = `800 ${Math.min(W, H) * sz}px sans-serif`; x.fillText(em, W / 2, H * .42, W * .9);
  x.font = `800 ${Math.min(W, H) * .14}px sans-serif`; x.fillText(lab, W / 2, H * .82, W * .9);
  const url = cv.toDataURL(), n = cols * rows;
  let order; do { order = shuf([...Array(n).keys()]); } while (order.every((v, i) => v === i));
  let sel = null, miss = 0;
  S.innerHTML = `<div class="jig"><img class="ref" src="${url}" alt="Gambar contoh"><div class="board" id="board" style="grid-template-columns:repeat(${cols},1fr);aspect-ratio:${W}/${H}"></div></div>`;
  const B = $('#board', S);
  function draw() {
    B.innerHTML = order.map((p, pos) => `<button class="piece${order[pos] === pos ? ' lock' : ''}${sel === pos ? ' sel' : ''}" data-pos="${pos}" aria-label="Kepingan ${pos + 1}"
      style="background-image:url(${url});background-size:${cols * 100}% ${rows * 100}%;background-position:${(p % cols) / (cols - 1) * 100}% ${Math.floor(p / cols) / (rows - 1) * 100}%"></button>`).join('');
    const ok = order.filter((p, i) => p === i).length; A.prog(ok, n);
    if (ok === n) setTimeout(() => A.finish(Math.max(0, miss - n)), 700);
  }
  B.addEventListener('click', e => {
    const b = e.target.closest('.piece'); if (!b) return;
    const pos = +b.dataset.pos; if (order[pos] === pos) return;
    if (sel === null) { sel = pos; sfx.ok(); }
    else if (sel === pos) sel = null;
    else {
      [order[sel], order[pos]] = [order[pos], order[sel]];
      if (order[sel] === sel || order[pos] === pos) A.good(); else { sfx.no(); miss++; }
      sel = null;
    }
    draw();
  });
  draw();
}

/* ======================================================
   AKTIVITI 4: MENYUSUN SUSUNAN (menyalin huruf / perkataan)
   Aras 1-2: model kelihatan. Aras 3: model disembunyikan.
   ====================================================== */
const SEQ = {
  1: [['🚌', 'BUS'], ['🎂', 'KEK']],
  2: [['⚽', 'BOLA'], ['🌸', 'BUNGA']],
  3: [['🍚', 'ALI MAKAN NASI'], ['📚', 'SAYA BACA BUKU']]
};
function susun(L, S, A) {
  const R = SEQ[L]; let r = 0;
  $('#instr').textContent = L < 3 ? 'Salin perkataan di atas. Tekan huruf mengikut susunan yang betul.' : 'Ingat ayat itu. Tekan perkataan mengikut susunan yang betul. Tekan 👀 jika terlupa.';
  (function round() {
    const [pic, txt] = R[r], u = L < 3 ? [...txt] : txt.split(' '), n = u.length;
    A.prog(r, R.length);
    S.innerHTML = `<div class="model"><span class="pic">${pic}</span><b id="mt">${txt}</b>${L === 3 ? '<button class="btn sun" id="peek">👀 Tengok</button>' : ''}</div>
      <div class="lslots">${u.map(() => '<div class="ls"></div>').join('')}</div>
      <div class="lpool" id="pool">${shuf(u.map((_, i) => i)).map(i => `<button class="tile" data-t="${u[i]}">${u[i]}</button>`).join('')}</div>
      <button class="btn go" id="chk" disabled>✅ Semak</button>`;
    const pool = $('#pool', S), slots = [...S.querySelectorAll('.ls')], chk = $('#chk', S), mt = $('#mt', S);
    if (L === 3) {
      setTimeout(() => mt.classList.add('hide'), 4000);
      $('#peek', S).onclick = () => { mt.classList.remove('hide'); setTimeout(() => mt.classList.add('hide'), 2000); };
    }
    const upd = () => { chk.disabled = pool.querySelector('.tile') !== null; A.prog(r + S.querySelectorAll('.tile.ok').length / n, R.length); };
    S.onclick = e => {
      const b = e.target.closest('.tile'); if (!b || b.classList.contains('ok')) return;
      if (b.parentElement === pool) { const s = slots.find(z => !z.querySelector('.tile')); if (s) { s.appendChild(b); sfx.ok(); } }
      else pool.appendChild(b);
      upd();
    };
    chk.onclick = async () => {
      let bad = 0;
      slots.forEach((s, i) => { const b = s.querySelector('.tile'); if (!b || b.classList.contains('ok')) return; if (b.dataset.t === u[i]) b.classList.add('ok'); else { bad++; b.classList.add('no'); } });
      if (!bad) {
        A.good(); A.prog(r + 1, R.length); await wait(900);
        if (++r < R.length) round(); else A.finish();
        return;
      }
      A.bad('Ada yang belum betul. Cuba lagi! 😊');
      await wait(600);
      S.querySelectorAll('.tile.no').forEach(b => { b.classList.remove('no'); pool.appendChild(b); });
      upd();
    };
  })();
}

/* ======================================================
   AKTIVITI 5: MENGKATEGORIKAN (bentuk, huruf, nombor, perkataan)
   ====================================================== */
function kategori(L, S, A) {
  let B, I;
  if (L === 1) {
    B = [['h', 'Huruf', '🔤'], ['n', 'Nombor', '🔢']];
    I = [['A', 'h'], ['B', 'h'], ['3', 'n'], ['5', 'n']];
  } else {
    B = [['b', 'Bentuk', '🔷'], ['h', 'Huruf', '🔤'], ['n', 'Nombor', '🔢']];
    I = [['🔺', 'b'], ['🟦', 'b'], ['M', 'h'], ['K', 'h'], ['7', 'n'], ['2', 'n']];
    if (L === 3) {
      B.push(['p', 'Perkataan', '📖']);
      I = [['🔶', 'b'], ['⭕', 'b'], ['R', 'h'], ['d', 'h'], ['9', 'n'], ['4', 'n'], ['BUKU', 'p'], ['AYAM', 'p']];
    }
  }
  S.innerHTML = `<div class="chips">${shuf(I.map((_, i) => i)).map(i => chip(i, I[i][0], '')).join('')}</div>
    <div class="zones">${B.map(b => `<div class="zone bucket" data-key="${b[0]}"><h3>${b[2]} ${b[1]}</h3><div class="pile"></div></div>`).join('')}</div>`;
  let n = 0;
  dnd(S, A, (id, key, c, z) => {
    if (I[id][1] !== key) return false;
    z.querySelector('.pile').appendChild(c); A.prog(++n, I.length);
    if (n === I.length) setTimeout(() => A.finish(), 800);
    return true;
  });
}

/* ---------- menu utama ---------- */
const ACTS = [
  { id: 'kenal', name: 'Mengecam', icon: '🔍', col: '#3ba7ff', fn: kenal, ins: 'Lihat gambar. Tekan jawapan yang betul.' },
  { id: 'padan', name: 'Seret & Padankan', icon: '🧲', col: '#2ec4a6', fn: padan, ins: 'Seret kad ke pasangan yang betul. Atau tekan kad, kemudian tekan pasangannya.' },
  { id: 'jig', name: 'Jigsaw', icon: '🧩', col: '#ff9f43', fn: jigsaw, ins: 'Tekan dua kepingan untuk menukar tempat. Susun sehingga gambar lengkap.' },
  { id: 'susun', name: 'Menyalin & Menyusun', icon: '🔢', col: '#8d6bff', fn: susun, ins: 'Salin huruf atau perkataan dengan menyusunnya.' },
  { id: 'kat', name: 'Mengkategorikan', icon: '🗂️', col: '#ff6b6b', fn: kategori, ins: 'Seret setiap kad ke kumpulan yang betul.' }
];
function renderHome() {
  document.querySelectorAll('.lvl').forEach(b => b.setAttribute('aria-pressed', +b.dataset.l === level));
  $('#activityGrid').innerHTML = ACTS.map(a => {
    const s = best[a.id + level] || 0;
    return `<button class="card" data-id="${a.id}" style="background:${a.col}"><span class="ic">${a.icon}</span>${a.name}<span class="st">${s ? '⭐'.repeat(s) : 'Jom main!'}</span></button>`;
  }).join('');
}
$('#levels').addEventListener('click', e => { const b = e.target.closest('.lvl'); if (b) { level = +b.dataset.l; sfx.ok(); renderHome(); } });
$('#activityGrid').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) start(ACTS.find(a => a.id === c.dataset.id)); });
$('#homeBtn').onclick = () => { $('#modal').hidden = true; speechSynthesis && speechSynthesis.cancel(); renderHome(); show('home'); };
$('#menu').onclick = $('#homeBtn').onclick;
$('#again').onclick = () => start(cur);
$('#next').onclick = () => { level = Math.min(3, level + 1); start(cur); };
$('#speak').onclick = () => speak($('#instr').textContent);
renderHome();
