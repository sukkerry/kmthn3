'use strict';
const $ = s => document.querySelector(s);
const sh = a => [...a].sort(() => Math.random() - .5);
const shake = e => { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); };
let AC, cur = 0, lvl = 0, mist = 0;

/* ---------- Bunyi & suara ---------- */
function beep(f, d = .15, t = 'sine', w = 0) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), n = AC.currentTime + w;
    o.type = t; o.frequency.value = f; g.gain.setValueAtTime(.15, n);
    g.gain.exponentialRampToValueAtTime(.001, n + d);
    o.connect(g); g.connect(AC.destination); o.start(n); o.stop(n + d);
  } catch (e) {}
}
const ok = () => { beep(660); beep(880, .2, 'sine', .12); };
const bad = () => beep(180, .25, 'sawtooth');
function say(t) {
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'ms-MY'; u.rate = .8; speechSynthesis.speak(u); } catch (e) {}
}
const fail = el => { mist++; bad(); shake(el); };

/* ---------- Seret & lepas (tetikus + sentuhan) ---------- */
function drag(el, targets, drop) {
  el.addEventListener('pointerdown', e => {
    if (el.dataset.done) return;
    e.preventDefault();
    const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, st = el.style.cssText;
    el.style.width = r.width + 'px'; el.style.height = r.height + 'px';
    el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
    el.classList.add('drag'); el.setPointerCapture(e.pointerId);
    const mv = ev => { el.style.left = ev.clientX - ox + 'px'; el.style.top = ev.clientY - oy + 'px'; };
    const up = ev => {
      el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      el.style.pointerEvents = 'none';
      const t = document.elementFromPoint(ev.clientX, ev.clientY), tg = t && t.closest(targets);
      el.style.pointerEvents = '';
      el.classList.remove('drag'); el.style.cssText = st;
      if (tg && !drop(el, tg)) fail(el);
    };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
}
const mk = (cls, txt, tag = 'div') => { const e = document.createElement(tag); e.className = cls; if (txt != null) e.textContent = txt; return e; };

/* ---------- 1. MENGECAM ---------- */
function mengecam(L, S, A) {
  const P = [
    ['⭐', '❤️', '🔷', '🔺', '🟢', '🟨', 'A', 'B', 'C', 'D', '1', '2', '3', '4'],
    ['BOLA', 'KUCING', 'RUMAH', 'BUNGA', 'IKAN', 'BUAH', 'PINTU', 'MEJA'],
    ['Ali makan nasi.', 'Ibu masak kuih.', 'Adik minum susu.', 'Kami ke sekolah.', 'Ayah baca buku.', 'Kucing tidur lena.']
  ][L];
  const n = [3, 4, 4][L], R = 5; let i = 0;
  (function round() {
    const t = sh(P)[0], opts = sh([t, ...sh(P.filter(x => x !== t)).slice(0, n - 1)]);
    S.innerHTML = '';
    const q = mk('q', L < 2 ? '👀 Cari yang sama!' : '🧠 Tengok, ingat, kemudian cari!');
    const tg = mk('big' + (t.length > 6 ? ' sm' : ''), t), ob = mk('opts');
    const again = mk('btn small', '👀 Tengok lagi', 'button'); again.style.setProperty('--b', '#ffa62b');
    const reveal = ms => { tg.textContent = t; tg.classList.add('pop'); if (L === 2) setTimeout(() => { tg.textContent = '❓'; tg.classList.remove('pop'); }, ms); };
    tg.onclick = () => say(t.replace(/[^\p{L}\p{N} ]/gu, ''));
    opts.forEach(o => {
      const b = mk('opt', o, 'button');
      b.onclick = () => {
        if (o === t) { b.classList.add('right', 'pop'); ok(); ob.style.pointerEvents = 'none'; A.p(++i / R); setTimeout(i < R ? round : A.win, 900); }
        else fail(b);
      };
      ob.append(b);
    });
    S.append(q, tg, ob); if (L === 2) { S.append(again); again.onclick = () => reveal(2000); reveal(3000); }
  })();
}

/* ---------- 2. DRAG & DROP MEMADANKAN ---------- */
function padan(L, S, A) {
  const D = [
    [['A', 'a'], ['B', 'b'], ['C', 'c']],
    [['1', '🍎'], ['2', '🍎🍎'], ['3', '🍎🍎🍎'], ['4', '🍎🍎🍎🍎']],
    [['BOLA', '⚽'], ['KUCING', '🐱'], ['RUMAH', '🏠'], ['BUNGA', '🌸'], ['IKAN', '🐟']]
  ][L];
  S.innerHTML = '<p class="q">✋ Seret kad ke tempat yang betul!</p>';
  const pool = mk('pool'), g = mk('grid'); let n = 0;
  D.forEach((d, i) => { const p = mk('pair'), h = mk('hole'); h.dataset.k = i; p.append(mk('key', d[0], 'b'), h); g.append(p); });
  sh(D.map((_, i) => i)).forEach(i => {
    const c = mk('chip', D[i][1]); c.dataset.k = i; pool.append(c);
    drag(c, '.hole', (el, t) => {
      if (t.dataset.k !== el.dataset.k || t.children.length) return false;
      t.append(el); el.dataset.done = 1; el.classList.add('pop'); ok(); A.p(++n / D.length); if (n === D.length) A.win(); return true;
    });
  });
  S.append(pool, g);
}

/* ---------- 3. JIGSAW ---------- */
function jigsaw(L, S, A) {
  const [e, w] = [['🐘', 'GAJAH'], ['🚀', 'ROKET'], ['🌈', 'PELANGI']][L], [c, r] = [[2, 2], [3, 2], [3, 3]][L];
  const W = Math.min(330, innerWidth - 56), H = W * .8, tw = W / c, th = H / r;
  const pic = (x, y) => {
    const t = mk('tile'); t.style.cssText = `width:${tw}px;height:${th}px`;
    t.innerHTML = `<div class="pic" style="width:${W}px;height:${H}px;left:${-x * tw}px;top:${-y * th}px"><span style="font-size:${H * .55}px">${e}</span><b style="font-size:${H * .13}px">${w}</b></div>`;
    return t;
  };
  S.innerHTML = '<p class="q">🧩 Susun gambar ini!</p>';
  const board = mk('board'), pool = mk('pool'); board.style.cssText = `width:${W + 8}px;grid-template-columns:repeat(${c},1fr)`;
  let n = 0; const tot = c * r;
  for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
    const h = mk('hole'); h.dataset.k = y * c + x; h.style.cssText = `width:${tw}px;height:${th}px`;
    if (L === 0) { const gh = pic(x, y); gh.classList.add('ghost'); h.append(gh); }
    board.append(h);
  }
  const ids = []; for (let k = 0; k < tot; k++) ids.push(k);
  sh(ids).forEach(k => {
    const p = pic(k % c, Math.floor(k / c)); p.classList.add('piece'); p.dataset.k = k; pool.append(p);
    drag(p, '.hole', (el, t) => {
      if (t.dataset.k !== el.dataset.k || t.querySelector('.piece')) return false;
      t.innerHTML = ''; t.append(el); el.dataset.done = 1; ok(); A.p(++n / tot); if (n === tot) { say(w); A.win(); } return true;
    });
  });
  S.append(board, pool);
}

/* ---------- 4. MENYUSUN SUSUNAN ---------- */
function susun(L, S, A) {
  const D = [
    [['1234', 'Susun nombor kecil ke besar'], ['ABCD', 'Susun huruf ikut abjad'], ['5678', 'Susun nombor kecil ke besar']].map(x => ({ a: [...x[0]], h: '', m: x[0].split('').join(' '), q: x[1] })),
    [['KUCING', '🐱'], ['BUNGA', '🌸'], ['SEKOLAH', '🏫']].map(x => ({ a: [...x[0]], h: x[1], m: x[0], q: 'Salin dan susun huruf!' })),
    [['Ali makan nasi', '🍚'], ['Ibu masak kuih', '🍰'], ['Adik minum susu', '🥛']].map(x => ({ a: x[0].split(' '), h: x[1], m: '', q: 'Susun perkataan jadi ayat!' }))
  ][L];
  let i = 0;
  (function round() {
    const d = D[i], a = d.a, slots = a.map(() => mk('hole')), row = mk('row'), tray = mk('row'); let pos = 0;
    S.innerHTML = ''; S.append(mk('q', '🔢 ' + d.q));
    if (d.m) S.append(mk('model', d.m)); if (d.h) S.append(mk('hint', d.h));
    slots.forEach(s => row.append(s));
    let tk; do { tk = sh(a); } while (a.length > 1 && tk.join('|') === a.join('|'));
    tk.forEach(t => {
      const k = mk('chip', t, 'button');
      k.onclick = () => {
        if (k.dataset.done) return;
        if (t === a[pos]) {
          slots[pos++].append(k); k.dataset.done = 1; k.classList.add('pop'); ok();
          if (pos === a.length) { A.p(++i / D.length); setTimeout(i < D.length ? round : A.win, 900); }
        } else fail(k);
      };
      tray.append(k);
    });
    S.append(row, mk('q', '👇'), tray);
  })();
}

/* ---------- 5. MENGKATEGORIKAN ---------- */
function kategori(L, S, A) {
  const all = { Huruf: ['A', 'B', 'M', 'S'], Nombor: ['3', '5', '7', '9'], Bentuk: ['⭐', '🔷', '🔺', '🟢'], Perkataan: ['BOLA', 'IKAN', 'BUKU', 'KASUT'] };
  const ico = { Huruf: '🔤', Nombor: '🔢', Bentuk: '🔷', Perkataan: '📖' };
  const cats = [['Huruf', 'Nombor'], ['Huruf', 'Nombor', 'Bentuk'], ['Huruf', 'Nombor', 'Bentuk', 'Perkataan']][L], k = [3, 2, 2][L];
  const items = sh(cats.flatMap(c => sh(all[c]).slice(0, k).map(t => [t, c])));
  S.innerHTML = '<p class="q">📦 Seret ke kotak yang betul!</p>';
  const pool = mk('pool'), box = mk('cats'); let n = 0;
  cats.forEach(c => { const b = mk('cat'); b.dataset.k = c; b.append(mk('', ico[c] + ' ' + c, 'h3'), mk('in')); box.append(b); });
  items.forEach(([t, c]) => {
    const ch = mk('chip', t); ch.dataset.k = c; pool.append(ch);
    drag(ch, '.cat', (el, tg) => {
      if (tg.dataset.k !== el.dataset.k) return false;
      tg.querySelector('.in').append(el); el.dataset.done = 1; el.classList.add('pop'); ok(); A.p(++n / items.length); if (n === items.length) A.win(); return true;
    });
  });
  S.append(pool, box);
}

/* ---------- Menu, aras & permainan ---------- */
const ACT = [
  { n: 'Mengecam', e: '🔍', c: '#ff8a5b', d: 'Cari yang sama', f: mengecam },
  { n: 'Memadankan', e: '🎯', c: '#3aa0ff', d: 'Seret & padankan', f: padan },
  { n: 'Jigsaw', e: '🧩', c: '#2ec4a6', d: 'Susun gambar', f: jigsaw },
  { n: 'Menyusun', e: '🔢', c: '#a76bff', d: 'Susun mengikut urutan', f: susun },
  { n: 'Mengkategorikan', e: '📦', c: '#ff6b9a', d: 'Asingkan mengikut jenis', f: kategori }
];
function show(id) { document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== id); scrollTo(0, 0); }
function bar(p) { $('#bar').style.width = Math.round(p * 100) + '%'; }
function start(l) {
  lvl = l; mist = 0; bar(0); $('#stage').innerHTML = '';
  $('#gname').textContent = `${ACT[cur].e} ${ACT[cur].n} · Aras ${l + 1}`;
  show('game'); ACT[cur].f(l, $('#stage'), { p: bar, win });
}
ACT.forEach((a, i) => {
  const b = mk('card', null, 'button'); b.style.setProperty('--b', a.c);
  b.innerHTML = `<span class="em">${a.e}</span><b>${i + 1}. ${a.n}</b><small>${a.d}</small>`;
  b.onclick = () => { cur = i; $('#ltitle').textContent = `${a.e} ${a.n}`; show('levels'); };
  $('#menu').append(b);
});
document.querySelectorAll('[data-l]').forEach(b => b.onclick = () => start(+b.dataset.l));

/* ---------- Kemenangan: piala & bunga api ---------- */
const cv = $('#fw'), cx = cv.getContext('2d'); let ps = [], raf, tm;
function burst(x, y) {
  const h = Math.random() * 360;
  for (let i = 0; i < 70; i++) { const a = Math.random() * 6.283, s = Math.random() * 6 + 2; ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, c: `hsl(${h + Math.random() * 50},100%,60%)` }); }
  beep(200 + Math.random() * 200, .3, 'triangle');
}
function loop() {
  cx.clearRect(0, 0, cv.width, cv.height);
  ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .07; p.vx *= .985; p.l -= .011; cx.globalAlpha = Math.max(p.l, 0); cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, 3.5, 0, 6.283); cx.fill(); });
  ps = ps.filter(p => p.l > 0); raf = requestAnimationFrame(loop);
}
function win() {
  bar(1);
  setTimeout(() => {
    const s = mist <= 1 ? 3 : mist <= 3 ? 2 : 1;
    $('#stars').innerHTML = [1, 2, 3].map(i => `<span style="animation-delay:${i * .25}s;opacity:${i <= s ? 1 : .25}">⭐</span>`).join('');
    $('#win').hidden = false; cv.width = innerWidth; cv.height = innerHeight;
    [523, 659, 784, 1047].forEach((f, i) => beep(f, .25, 'triangle', i * .15));
    burst(cv.width / 2, cv.height / 3); loop();
    tm = setInterval(() => burst(Math.random() * cv.width, Math.random() * cv.height * .6), 500);
    say('Tahniah! Hebat!');
  }, 600);
}
function closeWin() { $('#win').hidden = true; clearInterval(tm); cancelAnimationFrame(raf); ps = []; }
$('#again').onclick = () => { closeWin(); start(lvl); };
$('#tomenu').onclick = () => { closeWin(); show('home'); };
