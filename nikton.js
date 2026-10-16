/*! Nikton monster animation — standalone player, no dependencies.
 *  Usage:  const p = Nikton.mount(element, { phase: 'phase-1', assets: 'assets/' });
 *          p.setPhase('phase-4'); p.pause(); p.play(); p.seek(2.5); p.destroy();
 *  Phases: phase-1, phase-2-3, phase-4, phase-5, phase-6, smoked, or 'all' (whole sequence).
 */
(function (root) {
  'use strict';
  const FRAMES_JSON = "{\"a01\":[1087,883,499.0,875.0],\"a02\":[949,961,405.5,953.0],\"a03\":[1086,882,497.6,874.3],\"a04\":[944,958,404.5,951.5],\"a05\":[771,789,399.5,779.0],\"a07\":[722,810,457.5,800.0],\"a08\":[534,764,346.0,754.0],\"a10\":[940,958,402.5,948.0],\"b01\":[1098,899,525.0,896.8],\"b02\":[823,904,405.1,896.7],\"b03\":[824,904,405.1,897.4],\"b04\":[827,903,404.5,896.0],\"b05\":[827,903,405.5,895.5],\"b06\":[818,904,398.9,896.9],\"c01\":[794,905,386.5,898.0],\"c02\":[768,905,370.4,897.7],\"c03\":[756,906,367.3,902.6],\"c04\":[741,905,359.9,901.3],\"c05\":[721,905,353.5,901.2],\"d01\":[709,905,345.0,898.0],\"d02\":[690,904,335.4,896.2],\"d03\":[682,905,327.1,897.5],\"d04\":[677,906,319.1,898.2],\"d05\":[666,905,303.4,896.9],\"d06\":[675,905,304.3,896.4],\"d07\":[684,904,308.4,898.0],\"e01\":[828,908,407.5,901.0],\"e02\":[759,926,363.0,889.7],\"e03\":[635,950,334.8,900.3],\"e04\":[552,949,328.3,870.9],\"e05\":[599,948,333.8,898.5],\"e06\":[570,950,285.8,900.6],\"e07\":[574,423,286.5,416.0],\"e08\":[558,319,278.5,311.0],\"e10\":[275,246,137.0,239.0],\"e11\":[111,94,55.0,87.0],\"f01\":[678,906,309.2,896.7],\"f02\":[681,907,312.3,898.5],\"f03\":[669,906,302.0,897.6],\"f04\":[767,905,374.5,897.0],\"f05\":[1113,893,557.1,885.6],\"f06\":[1115,879,544.1,871.8],\"f07\":[1057,892,522.8,884.3],\"f08\":[1081,893,550.4,884.9],\"f09\":[1130,892,562.5,883.7],\"f10\":[834,896,419.2,888.0],\"f11\":[835,900,423.3,892.0],\"a09\":[1600,897,0,0],\"_ears\":{\"b\":{\"L\":[175,155,-279.5,-420.0,156.5,84.0],\"R\":[208,147,122.5,-420.0,19.9,84.0]},\"c\":{\"L\":[178,158,-282.5,-420.0,159.5,84.0],\"R\":[213,153,122.5,-421.0,19.9,85.0]},\"d\":{\"L\":[186,173,-290.0,-422.0,167.0,86.0],\"R\":[219,172,122.0,-422.0,20.4,86.0]}}}";
  const CSS = ".nikton-stage { --ground:#2A0F2E; --main:#9AA3AD; --second:#F2D58A; --accent:#F5A623; color:var(--second); overflow:hidden }\n.ground { position:absolute; inset:0 }\n.mon-layer { position:absolute; inset:0; overflow:hidden }\n.mon-rig { position:absolute; left:0; top:0; width:0; height:0; transform-origin:0 0; will-change:transform }\n.mon-f, .mon-e { position:absolute; display:none; max-width:none; user-select:none; pointer-events:none; -webkit-user-drag:none }\n.mon-e { display:block }\n.mon-sh { position:absolute; left:-260px; top:-26px; width:520px; height:52px; transform-origin:260px 26px; background:radial-gradient(closest-side, rgba(0,0,0,.34), rgba(0,0,0,.14) 60%, rgba(0,0,0,0)) }\n.mon-cover { position:absolute; left:0; top:0; width:1920px; height:1080px; max-width:none; transform-origin:960px 540px; display:none; pointer-events:none }\n.mon-glow { position:absolute; left:-300px; top:-300px; width:600px; height:600px; border-radius:50%; pointer-events:none; background:radial-gradient(closest-side, rgba(245,166,35,.34), rgba(245,166,35,.12) 55%, rgba(245,166,35,0)); mix-blend-mode:screen }\n.mon-vig { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse at 50% 55%, rgba(42,15,46,0) 45%, rgba(42,15,46,.55) 100%) }\n.mon-tint { position:absolute; inset:0; pointer-events:none; background:#2A0F2E; opacity:0 }\n.nikton-root{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden}.nikton-stage{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;overflow:hidden}.nikton-stage>.nikton-scene{position:absolute;inset:0}.nikton-fx{position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none}";
  const META = [{"id": "phase-1", "name": "1 Тяга", "dur": 12}, {"id": "phase-2-3", "name": "2-3 Растерян", "dur": 10}, {"id": "phase-4", "name": "4 Трещины", "dur": 9}, {"id": "phase-5", "name": "5 Трескается", "dur": 10}, {"id": "phase-6", "name": "6 Распад", "dur": 15}, {"id": "ash", "name": "7+ Пепел", "dur": 8}, {"id": "smoked", "name": "Покурил", "dur": 13}];
  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x, lerp = (a, b, x) => a + (b - a) * x;
  const H = {
    clamp01, lerp, seg: (t, a, b) => clamp01((t - a) / (b - a)),
    eo: x => 1 - Math.pow(1 - clamp01(x), 3), ei: x => Math.pow(clamp01(x), 3),
    eio: x => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  };
  const DEFS = {};
  const REG = Object.assign({ scene(id, def) { DEFS[id] = def; } }, H);
  // ---- shared helpers (window.MON)
(function () {
  const SC = 0.83, GY = 940, TAU = Math.PI * 2;
  const cl1 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lerp = (a, b, x) => a + (b - a) * x;
  const eio = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eo = x => 1 - Math.pow(1 - x, 3);
  const ei = x => x * x * x;
  const EZ = { lin: x => x, eio, eo, ei };
  const sm = (a, b, x) => { const u = cl1((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const h = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  function k(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t < b[0]) return lerp(a[1], b[1], EZ[a[2] || 'lin']((t - a[0]) / (b[0] - a[0])));
    }
    return keys[keys.length - 1][1];
  }
  function pick(t, seq) { let f = seq[0][1]; for (const s of seq) if (t >= s[0]) f = s[1]; return f; }
  function shake(t, amp, seed, fps) { const i = Math.floor(t * (fps || 14)); return [(h(i, seed) - 0.5) * 2 * amp, (h(i, seed + 5) - 0.5) * 2 * amp]; }
  function rig(kit, names, o) {
    o = o || {};
    const M = kit.json('frames.json');
    const E = o.ears ? M._ears[o.ears] : null;
    const box = kit.h('<div class="mon-layer"></div>');
    const sh = kit.h('<div class="mon-sh"></div>');
    const root = kit.h('<div class="mon-rig"></div>');
    box.append(sh, root);
    const imgs = {}, cur = {};
    for (const n of names) {
      const m = M[n];
      const el = kit.h('<img class="mon-f" src="' + kit.assets.url(n + '.webp') + '" style="left:' + (-m[2] * SC) + 'px;top:' + (-m[3] * SC) + 'px;width:' + (m[0] * SC) + 'px;height:' + (m[1] * SC) + 'px">');
      root.append(el); imgs[n] = el;
    }
    const ear = {};
    if (E) for (const s of ['L', 'R']) {
      const e = E[s];
      const el = kit.h('<img class="mon-e" src="' + kit.assets.url('e' + o.ears + '-' + s.toLowerCase() + '.webp') + '" style="left:' + (e[2] * SC) + 'px;top:' + (e[3] * SC) + 'px;width:' + (e[0] * SC) + 'px;height:' + (e[1] * SC) + 'px;transform-origin:' + (e[4] * SC) + 'px ' + (e[5] * SC) + 'px">');
      root.append(el); ear[s] = el;
    }
    function setf(n, op) {
      if (cur[n] === op) return; cur[n] = op;
      const st = imgs[n].style; st.display = op > 0.004 ? 'block' : 'none'; st.opacity = op;
    }
    return {
      el: box,
      pose(p) {
        const x = p.x == null ? 960 : p.x, y = p.y == null ? GY : p.y, m = p.m || 0;
        for (const n in imgs) setf(n, n === p.f ? (p.f2 ? 1 - m : 1) : (n === p.f2 ? m : 0));
        const s = p.s == null ? 1 : p.s, sx = s * (p.sx || 1) * (p.flip ? -1 : 1), sy = s * (p.sy || 1);
        root.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + (p.r || 0) + 'deg) scale(' + sx + ',' + sy + ')';
        root.style.opacity = p.o == null ? 1 : p.o;
        const eo2 = p.eo == null ? 1 : p.eo;
        if (ear.L) {
          ear.L.style.opacity = eo2; ear.R.style.opacity = eo2;
          ear.L.style.transform = 'rotate(' + (p.el || 0) + 'deg) scale(' + (p.es || 1) + ')';
          ear.R.style.transform = 'rotate(' + (p.er || 0) + 'deg) scale(' + (p.es || 1) + ')';
        }
        sh.style.transform = 'translate(' + x + 'px,' + (p.gy || GY) + 'px) scale(' + ((p.sw == null ? 1 : p.sw) * s) + ',1)';
        sh.style.opacity = (p.so == null ? 1 : p.so) * (p.o == null ? 1 : p.o);
      },
    };
  }
  function ash(ctx, t, o) {
    const win = o.win == null ? 1 : o.win; if (win <= 0.002) return;
    const n = o.n || 30, L = o.life || [3, 6], b = o.box, a0 = o.a == null ? 0.8 : o.a;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const life = lerp(L[0], L[1], h(i, 1)), u = t / life + h(i, 2), c = Math.floor(u), age = (u - c) * life, s = i * 977 + c * 13;
      const f = age / life, al = a0 * win * sm(0, 0.12, f) * (1 - sm(0.55, 1, f));
      if (al < 0.01) continue;
      const x = lerp(b[0], b[2], h(s, 5)) + lerp(o.vx[0], o.vx[1], h(s, 3)) * age + Math.sin(age * 2.2 + s) * (o.wob == null ? 10 : o.wob);
      const y = lerp(b[1], b[3], h(s, 6)) + lerp(o.vy[0], o.vy[1], h(s, 4)) * age + 0.5 * (o.g || 0) * age * age;
      const sz = lerp(o.size[0], o.size[1], h(s, 7)), r = h(s, 8) * TAU + age * (h(s, 9) - 0.5) * 4;
      ctx.fillStyle = 'rgba(' + (o.col || '150,146,158') + ',' + al.toFixed(3) + ')';
      ctx.beginPath();
      for (let j = 0; j < 4; j++) {
        const an = r + j * TAU / 4 + (h(s, 10 + j) - 0.5) * 0.8, rd = sz * (0.6 + 0.7 * h(s, 14 + j));
        const px = x + Math.cos(an) * rd, py = y + Math.sin(an) * rd;
        if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function smoke(ctx, t, o) {
    const kk = o.k == null ? 1 : o.k; if (kk <= 0.002) return;
    const n = o.n || 14, rgb = o.rgb || '206,198,214';
    ctx.save();
    for (let i = 0; i < n; i++) {
      const th = h(i, 1) * TAU + (h(i, 2) - 0.5) * (o.spin || 0.7) * t, rr = lerp(0.55, 1, h(i, 3));
      const x = o.cx + Math.cos(th) * o.rx * rr + Math.sin(t * 0.5 + i) * 30, y = o.cy + Math.sin(th) * o.ry * rr + Math.cos(t * 0.4 + i * 2) * 24;
      const R = lerp(o.rad[0], o.rad[1], h(i, 4)) * (1 + 0.12 * Math.sin(t * 0.8 + i));
      const al = (o.a || 0.2) * kk * (0.65 + 0.35 * Math.sin(t * 0.9 + i * 1.7));
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, 'rgba(' + rgb + ',' + al.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
    }
    ctx.restore();
  }
  function chips(ctx, t, o) {
    const g = o.g || 1800;
    ctx.save(); ctx.lineWidth = 3; ctx.lineJoin = 'round';
    o.list.forEach((c, i) => {
      const a = t - c[0]; if (a < 0) return;
      let y = c[2] + c[4] * a + 0.5 * g * a * a, x = c[1] + c[3] * a, tf = a;
      const gy = (o.gy || GY) - h(i, 2) * (o.pile || 40);
      if (y > gy) { const D = c[4] * c[4] + 2 * g * (gy - c[2]); tf = (-c[4] + Math.sqrt(D)) / g; y = gy; x = c[1] + c[3] * tf; }
      const fade = o.fade ? 1 - sm(o.fade[0], o.fade[1], t) : 1; if (fade <= 0.01) return;
      const sz = c[5], rot = h(i, 3) * TAU + tf * (h(i, 4) - 0.5) * 10;
      ctx.globalAlpha = fade; ctx.fillStyle = '#9aa3ad'; ctx.strokeStyle = '#17151c';
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const an = rot + j * TAU / 5 + (h(i, 5 + j) - 0.5) * 0.7, rd = sz * (0.65 + 0.7 * h(i, 10 + j));
        const px = x + Math.cos(an) * rd, py = y + Math.sin(an) * rd * 0.8;
        if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    ctx.restore();
  }
  window.MON = { SC, GY, TAU, k, pick, h, sm, lerp, eio, eo, ei, cl1, shake, rig, ash, smoke, chips };
})();


  // ---- scene phase-1
  (function (kit) {
const { seg, lerp, eo, eio } = kit;
const M = window.MON, K = M.k, H = M.h;
const SEG = [[0, 'st'], [1.25, 'rd'], [1.45, 'ru'], [2.2, 'st'], [3.05, 'rd'], [3.25, 'ru'], [4.3, 'lg'], [5.1, 'sl'], [6.4, 'ru'], [7.1, 'dash'], [7.75, 'cu'], [9.3, 'back'], [9.85, 'ru'], [11.3, 'st']];
const X = [[0, 960], [1.45, 960], [2.2, 500, 'eio'], [3.25, 500], [4.3, 1420, 'eio'], [5.1, 1230, 'eio'], [6.3, 1160, 'eio'], [6.4, 1160], [7.1, 760, 'eio'], [7.75, 960, 'eio'], [9.85, 960], [10.3, 700, 'eio'], [10.8, 1180, 'eio'], [11.3, 960, 'eio']];
kit.scene('phase-1', {
  init(kit) {
    this.m = M.rig(kit, ['a01', 'a03', 'a02', 'a04', 'a10', 'a05', 'a07', 'a08']);
    this.cv = kit.h('<img class="mon-cover phase-1-cover" src="' + kit.assets.url('a09.webp') + '">');
    kit.stage.append(this.m.el, this.cv);
  },
  render(t, kit) {
    const md = M.pick(t, SEG), x = K(t, X), v = K(t + 0.03, X) - K(t - 0.03, X), dir = v >= 0 ? 1 : -1;
    const p = { x, y: M.GY, f: 'a01' };
    let cvo = 0, wn = 1 - seg(t, 7.3, 7.7) + seg(t, 9.4, 9.9);
    if (md === 'st') {
      const i = Math.floor(t * 8), j = M.shake(t, 3.5, 2, 14);
      p.f = H(i, 1) > 0.45 ? 'a01' : 'a03'; p.x += j[0]; p.y += Math.sin(t * 9) * -4;
      p.s = 1 + 0.014 * Math.sin(t * 13); p.r = 1.4 * Math.sin(t * 6);
    } else if (md === 'rd') {
      p.f = 'a02'; p.sy = 0.93; p.sx = 1.05; p.r = -4 * (K(t + 0.4, X) >= K(t, X) ? 1 : -1);
    } else if (md === 'ru') {
      const hp = Math.abs(Math.sin(t * Math.PI * 5)), sp = Math.min(1, Math.abs(v) / 700);
      p.f = ['a02', 'a04', 'a10'][Math.floor(t * 10) % 3]; p.flip = v > 0;
      p.y -= hp * 34 * sp; p.r = dir * 6 * sp; p.sy = 1 + 0.07 * hp * sp; p.sx = 1 - 0.04 * hp * sp;
      p.sw = 1 - 0.25 * hp * sp; p.so = 1 - 0.5 * hp * sp;
    } else if (md === 'lg') {
      const u = seg(t, 4.3, 5.1);
      p.f = Math.floor(t * 8) % 2 ? 'a07' : 'a08'; p.r = -5 * eo(u); p.sx = 1 + 0.07 * eo(u); p.y -= Math.abs(Math.sin(t * 17)) * 7;
    } else if (md === 'sl') {
      p.f = 'a05'; p.r = 2.6 * Math.sin(t * 5); p.s = 1 + 0.02 * Math.sin(t * 3.1); p.x += 14 * Math.sin(t * 1.7);
    } else if (md === 'dash') {
      const u = M.ei(seg(t, 7.1, 7.75)), j = M.shake(t, 6 * u, 4, 16);
      p.f = 'a01'; p.s = lerp(1, 1.8, u); p.y = lerp(M.GY, 1277, u) + j[1]; p.x += j[0];
      p.o = 1 - seg(t, 7.55, 7.8); cvo = seg(t, 7.45, 7.78); p.so = 1 - seg(t, 7.1, 7.5);
    } else if (md === 'cu') {
      p.o = 0; cvo = 1; p.so = 0;
    } else if (md === 'back') {
      const u = eo(seg(t, 9.3, 9.85));
      p.f = 'a01'; p.s = lerp(1.8, 1, u); p.y = lerp(1277, M.GY, u); p.o = seg(t, 9.28, 9.45); cvo = 1 - seg(t, 9.3, 9.5); p.so = seg(t, 9.5, 9.85);
    }
    this.m.pose(p);
    const cs = this.cv.style, j = M.shake(t, 9 * (1 - seg(t, 7.75, 8.5)) + 2.5, 3, 16);
    cs.display = cvo > 0.004 ? 'block' : 'none'; cs.opacity = cvo;
    cs.transform = 'translate(' + j[0] + 'px,' + j[1] + 'px) scale(' + (1.02 + 0.05 * seg(t, 7.75, 9.3) + 0.012 * Math.sin(t * 9)) + ') rotate(' + (H(Math.floor(t * 16), 4) - 0.5) * 1.1 + 'deg)';
    M.ash(kit.fx, t, { n: 26, box: [160, 330, 1760, 900], vx: [-22, 22], vy: [-170, -90], size: [3, 7], life: [1.6, 3], a: 0.85, col: '245,166,35', wob: 14, win: wn });
  },
});
  })(REG);

  // ---- scene phase-2-3
  (function (kit) {
const { seg, lerp, eo, eio } = kit;
const M = window.MON, H = M.h;
const EYES = [[0, 'b01'], [1.2, 'b02'], [1.6, 'b03'], [2.2, 'b06'], [2.6, 'b04'], [3.5, 'b05'], [3.62, 'b04'], [4.4, 'b03'], [4.9, 'b02'], [5.4, 'b06'], [6.3, 'b05'], [6.42, 'b02'], [7.2, 'b04'], [7.8, 'b03'], [8.5, 'b05'], [8.62, 'b06'], [9.2, 'b02'], [9.7, 'b04']];
kit.scene('phase-2-3', {
  init(kit) {
    this.m = M.rig(kit, ['b01', 'b02', 'b03', 'b04', 'b05', 'b06'], { ears: 'b' });
    kit.stage.append(this.m.el);
  },
  render(t, kit) {
    const f = M.pick(t, EYES), i = Math.floor(t * 7), a = M.sm(0.5, 1, t);
    const shrug = M.sm(5.3, 5.8, t) * (1 - M.sm(6.3, 6.9, t)) + 0.7 * M.sm(8.8, 9.2, t) * (1 - M.sm(9.5, 9.9, t));
    const sigh = M.sm(3.9, 4.6, t) * (1 - M.sm(4.6, 5.4, t));
    const p = { x: 960, y: M.GY, f, s: 1 + 0.013 * Math.sin(t * 2.1) };
    if (t < 1.2) { p.f = 'b01'; p.f2 = 'b02'; p.m = eo(seg(t, 0.6, 1.2)); }
    p.eo = M.sm(0.7, 1.1, t);
    p.el = a * ((H(i, 1) - 0.5) * 9 + 9 * shrug); p.er = a * ((H(i, 2) - 0.5) * 9 - 9 * shrug);
    p.es = 1 + 0.03 * Math.sin(t * 5);
    p.r = 1.6 * Math.sin(t * 0.9) - 2.5 * sigh + 1.2 * shrug; p.y += 7 * sigh - 3 * Math.sin(t * 2.1);
    p.sy = 1 - 0.02 * sigh;
    this.m.pose(p);
    M.ash(kit.fx, t, { n: 20, box: [700, 330, 1220, 720], vx: [-34, 34], vy: [14, 55], g: 6, size: [3, 7], life: [3.2, 6], a: 0.75, col: '168,164,176', wob: 16 });
  },
});
  })(REG);

  // ---- scene phase-4
  (function (kit) {
const { seg, lerp, eo, eio } = kit;
const M = window.MON, H = M.h;
const EV = [[0, 'c01'], [1.3, 'c02'], [2.55, 'c03'], [2.7, 'c02'], [3.9, 'c05'], [5.1, 'c04'], [5.25, 'c05'], [7.2, 'c04'], [7.35, 'c05']];
const CH = [[4.8, 925, 690, -50, -110, 9], [5.7, 1000, 705, 60, -90, 8], [6.4, 905, 720, -70, -80, 10], [7.1, 985, 700, 40, -130, 9], [7.7, 950, 735, 10, -150, 11], [8.3, 1010, 690, 50, -70, 8], [8.7, 900, 700, -30, -100, 9]];
kit.scene('phase-4', {
  init(kit) {
    this.m = M.rig(kit, ['c01', 'c02', 'c03', 'c04', 'c05'], { ears: 'c' });
    kit.stage.append(this.m.el);
  },
  render(t, kit) {
    const i = Math.floor(t * 6), u = seg(t, 0, 9), f = M.pick(t, EV);
    const p = { x: 960, y: M.GY, f, s: lerp(1, 0.945, eio(u)) };
    if (t >= 1.3 && t < 1.8) { p.f = 'c01'; p.f2 = 'c02'; p.m = eo(seg(t, 1.3, 1.8)); }
    if (t >= 3.9 && t < 4.5) { p.f = 'c02'; p.f2 = 'c05'; p.m = eo(seg(t, 3.9, 4.5)); }
    const sh = M.shake(t, 2.4 * M.sm(4, 8.5, t), 7, 18);
    p.x += sh[0]; p.y += sh[1];
    p.el = (H(i, 1) - 0.5) * 6; p.er = (H(i, 2) - 0.5) * 6;
    p.sy = 0.985 + 0.012 * Math.sin(t * 1.6) - 0.02 * M.sm(3, 8, t); p.r = 1.2 * Math.sin(t * 0.8) * (1 - M.sm(4, 8, t));
    this.m.pose(p);
    M.chips(kit.fx, t, { list: CH, gy: M.GY + 6, pile: 26 });
    M.ash(kit.fx, t, { n: 12, box: [780, 420, 1140, 700], vx: [-20, 20], vy: [20, 50], g: 6, size: [2.5, 5.5], life: [3, 5], a: 0.5 * M.sm(2, 5, t), col: '168,164,176', wob: 10 });
  },
});
  })(REG);

  // ---- scene phase-5
  (function (kit) {
const { seg, lerp, eo, eio } = kit;
const M = window.MON, H = M.h;
const F = [[0, 'd01'], [1.3, 'd02'], [2.5, 'd03'], [3.6, 'd04'], [4.5, 'd05'], [5.4, 'd06'], [6.3, 'd07'], [7.2, 'd05'], [8.1, 'd04'], [9, 'd07']];
const XF = { d02: 0.4, d03: 0.4, d04: 0.4 };
const JOLT = [1.3, 2.5, 3.6, 5.2, 6.8, 8.3];
const SC = t => lerp(0.945, 0.78, eio(seg(t, 0, 10)));
const CH = [];
for (let k = 0; k < 26; k++) {
  const t0 = 1.4 + k * 0.33, s = SC(t0);
  CH.push([t0, 960 + (H(k, 1) - 0.5) * 230 * s, M.GY - (190 + H(k, 2) * 260) * s, (H(k, 3) - 0.5) * 220, -50 - H(k, 4) * 130, 6 + H(k, 5) * 8]);
}
kit.scene('phase-5', {
  init(kit) {
    this.m = M.rig(kit, ['d01', 'd02', 'd03', 'd04', 'd05', 'd06', 'd07'], { ears: 'd' });
    kit.stage.append(this.m.el);
  },
  render(t, kit) {
    const i = Math.floor(t * 12);
    let n = 0; for (let k = 0; k < F.length; k++) if (t >= F[k][0]) n = k;
    const p = { x: 960, y: M.GY, f: F[n][1], s: SC(t) };
    const xf = XF[p.f];
    if (n > 0 && xf && t < F[n][0] + xf) { p.f2 = p.f; p.f = F[n - 1][1]; p.m = eo(seg(t, F[n][0], F[n][0] + xf)); }
    let jo = 0; for (const T of JOLT) if (t > T) jo += Math.exp(-(t - T) * 9);
    const sh = M.shake(t, 1.5 + 5 * M.sm(2, 9, t), 9, 20);
    p.x += sh[0]; p.y += sh[1] - 12 * jo; p.sy = 1 + 0.035 * jo; p.sx = 1 - 0.02 * jo;
    p.r = (H(Math.floor(t * 10), 3) - 0.5) * 3 * M.sm(2, 8, t);
    const fr = 6 + 8 * M.sm(1, 8, t);
    p.el = (H(i, 1) - 0.5) * fr * 2; p.er = (H(i, 2) - 0.5) * fr * 2; p.es = 1 + 0.04 * Math.sin(t * 17);
    this.m.pose(p);
    M.chips(kit.fx, t, { list: CH, gy: M.GY + 6, pile: 30 });
    M.ash(kit.fx, t, { n: 22, box: [760, 360, 1160, 720], vx: [-40, 40], vy: [-10, 40], g: 20, size: [3, 7], life: [2.2, 4], a: 0.2 + 0.5 * M.sm(1, 6, t), col: '168,164,176', wob: 12 });
  },
});
  })(REG);

  // ---- scene phase-6
  (function (kit) {
const { seg, lerp, eo, eio } = kit;
const M = window.MON, K = M.k, H = M.h;
const E = [[0, 'e01', 0], [0.9, 'e02', 0.14], [1.7, 'e03', 0.14], [2.5, 'e04', 0.14], [3.3, 'e05', 0.14], [4, 'e06', 0.14], [4.8, 'e07', 0.3], [6.4, 'e08', 0.6], [8.2, 'e10', 1], [11, 'e11', 1.2]];
const S = [[0, 0.78], [8.2, 0.8, 'eio'], [11, 0.62, 'eio'], [15, 0.32]];
const HW = [[4.8, 170], [8.2, 150], [8.9, 85], [11, 48], [15, 18]];
const HT = [[4.8, 250], [8.2, 200], [8.9, 130], [11, 70], [15, 30]];
const IMP = [1.7, 2.5, 3.3, 4, 4.8];
const CH = [];
for (let k = 0; k < 16; k++) CH.push([0.5 + k * 0.2, 960 + (H(k, 1) - 0.5) * 170, M.GY - 300 - H(k, 2) * 160, (H(k, 3) - 0.5) * 240, -40 - H(k, 4) * 120, 9 + H(k, 5) * 9]);
kit.scene('phase-6', {
  init(kit) {
    this.m = M.rig(kit, ['e01', 'e02', 'e03', 'e04', 'e05', 'e06', 'e07', 'e08', 'e10', 'e11']);
    kit.stage.append(this.m.el);
  },
  render(t, kit) {
    let n = 0; for (let k = 0; k < E.length; k++) if (t >= E[k][0]) n = k;
    const cur = E[n], fd = cur[2], p = { x: 960, y: M.GY, f: cur[1], s: K(t, S) };
    if (n > 0 && t < cur[0] + fd) { p.f2 = cur[1]; p.f = E[n - 1][1]; p.m = eo(seg(t, cur[0], cur[0] + fd)); }
    let jo = 0; for (const T of IMP) if (t > T) jo += Math.exp(-(t - T) * 8);
    const sh = M.shake(t, 4 * (1 - M.sm(0.9, 4.8, t)) + 0.8, 5, 22);
    p.x += sh[0]; p.y += sh[1] - 9 * jo; p.sy = 1 + 0.04 * jo; p.sx = 1 - 0.025 * jo;
    p.o = 1 - 0.75 * M.sm(12, 15, t); p.so = 1 - M.sm(8.2, 11, t);
    this.m.pose(p);
    M.chips(kit.fx, t, { list: CH, gy: M.GY + 4, pile: 24, fade: [4.2, 5.4] });
    let dz = 0; for (const T of IMP) if (t > T) dz += Math.exp(-(t - T) * 2.6);
    M.ash(kit.fx, t, { n: 18, box: [800, M.GY - 60, 1120, M.GY - 10], vx: [-110, 110], vy: [-90, -20], size: [10, 22], life: [1, 1.8], a: 0.3 * Math.min(1, dz), col: '176,172,184', wob: 6 });
    const w = M.sm(4.8, 7, t), hw = K(t, HW), ht = K(t, HT);
    M.ash(kit.fx, t, { n: 40, box: [960 - hw, M.GY - ht, 960 + hw, M.GY - 14], vx: [50, 170], vy: [-80, -15], g: -4, size: [2.5, 6.5], life: [2, 4.2], a: 0.9 * (1 - 0.8 * M.sm(11, 15, t)), win: w, col: '170,166,178', wob: 9 });
  },
});
  })(REG);

  // ---- scene ash
  (function (kit) {
const { lerp } = kit;
const M = window.MON, H = M.h, L = 8;
kit.scene('ash', {
  init(kit) {
    this.m = M.rig(kit, ['e11']);
    kit.stage.append(this.m.el);
  },
  render(t, kit) {
    t = ((t % L) + L) % L;
    const b = Math.sin(t / L * M.TAU * 2);
    this.m.pose({ f: 'e11', x: 960, y: M.GY, s: 0.32 * (1 + 0.03 * b), o: 0.25, so: 0 });
    const g = kit.fx; g.save();
    for (let i = 0; i < 36; i++) {
      const n = 2 + (i % 3), per = L / n, v = t / per + H(i, 1), c = Math.floor(v), u = v - c, s = i * 97 + (c % n) * 13;
      const al = 0.8 * M.sm(0, 0.15, u) * (1 - M.sm(0.5, 1, u)); if (al < 0.01) continue;
      const a = u * per;
      const x = 960 + (H(s, 3) - 0.5) * 34 + lerp(35, 120, H(s, 4)) * a + Math.sin(a * 2 + s) * 9;
      const y = M.GY - 12 - lerp(25, 75, H(s, 5)) * a + Math.cos(a * 1.7 + s) * 6;
      const sz = lerp(2.5, 6, H(s, 6)), r = H(s, 7) * M.TAU + a * (H(s, 8) - 0.5) * 3;
      g.fillStyle = 'rgba(170,166,178,' + al.toFixed(3) + ')'; g.beginPath();
      for (let j = 0; j < 4; j++) {
        const an = r + j * M.TAU / 4 + (H(s, 10 + j) - 0.5) * 0.8, rd = sz * (0.6 + 0.7 * H(s, 14 + j));
        const px = x + Math.cos(an) * rd, py = y + Math.sin(an) * rd;
        if (j) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.closePath(); g.fill();
    }
    for (let i = 0; i < 3; i++) {
      const u = (t / L + i / 3) % 1, R = lerp(20, 70, u), x = 960 + 90 * u * L / 2, y = M.GY - 20 - 140 * u;
      const al = 0.14 * Math.sin(Math.PI * u), gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, 'rgba(176,172,184,' + al.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(176,172,184,0)');
      g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R);
    }
    g.restore();
  },
});
  })(REG);

  // ---- scene smoked
  (function (kit) {
const { seg, lerp, eo, eio } = kit;
const M = window.MON, K = M.k, H = M.h;
const SEQ = [[0, 'e11', 0], [1.4, 'e10', 0.6], [2.4, 'e08', 0.5], [3.2, 'e07', 0.3], [3.8, 'e06', 0.12], [4.1, 'e05', 0.12], [4.4, 'e04', 0.12], [4.7, 'e03', 0.12], [5, 'e02', 0.12], [5.3, 'e01', 0.15], [5.8, 'f01', 0.2], [6.1, 'f02', 0], [6.4, 'f03', 0], [6.9, 'f04', 0.6], [7.6, 'A', 0.4], [9, 'C', 0.3], [10.6, 'A', 0.5]];
const S = [[0, 0.32], [1.4, 0.45, 'eo'], [2.4, 0.62, 'eo'], [3.2, 0.74], [3.8, 0.78], [5.8, 0.78], [7.2, 1, 'eio']];
const JO = [3.2, 3.8, 4.1, 4.4, 4.7, 5, 5.3, 5.8, 6.1];
const AR = ['f05', 'f08', 'f07', 'f09', 'f08', 'f06'];
const nm = (n, t) => n === 'A' ? AR[Math.floor(H(Math.floor(t * (t > 11 ? 5 : 8)), 5) * 6) % 6] : n === 'C' ? (Math.floor(t * 7) % 2 ? 'f10' : 'f11') : n;
kit.scene('smoked', {
  init(kit) {
    this.m = M.rig(kit, ['e11', 'e10', 'e08', 'e07', 'e06', 'e05', 'e04', 'e03', 'e02', 'e01', 'f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08', 'f09', 'f10', 'f11']);
    kit.stage.append(this.m.el);
  },
  render(t, kit) {
    let n = 0; for (let k = 0; k < SEQ.length; k++) if (t >= SEQ[k][0]) n = k;
    const c = SEQ[n], p = { x: 960, y: M.GY, f: nm(c[1], t), s: K(t, S) };
    if (n > 0 && t < c[0] + c[2]) { p.f2 = p.f; p.f = nm(SEQ[n - 1][1], t); p.m = eo(seg(t, c[0], c[0] + c[2])); }
    let jo = 0; for (const T of JO) if (t > T) jo += Math.exp(-(t - T) * 9);
    const an = M.sm(7.4, 8, t), rage = an * (1 - 0.5 * M.sm(10.6, 11.2, t));
    const sh = M.shake(t, 0.8 + 5 * rage, 6, 16);
    p.x += sh[0] + 120 * K(t, [[7.6, 0], [8.2, -1, 'eio'], [8.8, 1, 'eio'], [9.3, 0, 'eio']]);
    p.y += sh[1] - 10 * jo - 14 * Math.abs(Math.sin(t * 9)) * M.sm(7.6, 8, t) * (1 - M.sm(8.9, 9.3, t));
    p.r = 2.2 * rage * Math.sin(t * 11); p.sy = 1 + 0.04 * jo;
    p.s *= 1 + 0.08 * M.sm(9, 10.2, t) * (1 - M.sm(10.4, 10.9, t));
    p.o = lerp(0.25, 1, M.sm(0, 1.4, t)); p.so = M.sm(2, 4, t);
    this.m.pose(p);
    const g = kit.fx, hx = 960, hy = M.GY - 70, ek = 1 - M.sm(5.4, 7, t);
    if (ek > 0.01) {
      g.save(); g.lineCap = 'round'; g.lineWidth = 3.5;
      for (let i = 0; i < 30; i++) {
        const u = (t * 0.42 + H(i, 1)) % 1, r = lerp(640, 14, M.ei(u)), a = H(i, 2) * M.TAU + u * 1.6;
        const x = hx + Math.cos(a) * r, y = hy + Math.sin(a) * r * 0.55, r2 = r + 34, a2 = a - 0.07;
        g.strokeStyle = 'rgba(245,166,35,' + (ek * Math.sin(Math.PI * u) * 0.9).toFixed(3) + ')';
        g.beginPath(); g.moveTo(x, y); g.lineTo(hx + Math.cos(a2) * r2, hy + Math.sin(a2) * r2 * 0.55); g.stroke();
      }
      g.restore();
    }
    M.smoke(g, t, { cx: 960, cy: 640, rx: 560, ry: 290, n: 16, rad: [120, 250], a: 0.24, k: M.sm(0.2, 2.5, t) * (1 - 0.6 * M.sm(11, 13, t)), rgb: '196,188,206' });
    M.ash(g, t, { n: 26, box: [160, 330, 1760, 900], vx: [-22, 22], vy: [-170, -90], size: [3, 7], life: [1.6, 3], a: 0.85, col: '245,166,35', wob: 14, win: M.sm(10.4, 12, t) });
  },
});
  })(REG);

  let cssDone = false;
  function mount(el, opt) {
    opt = Object.assign({ phase: 'phase-1', assets: 'assets/', autoplay: true, loop: true, speed: 1, background: 'transparent', onEnd: null }, opt || {});
    if (!cssDone) { const s = document.createElement('style'); s.textContent = CSS; document.head.append(s); cssDone = true; }
    const base = opt.assets.endsWith('/') ? opt.assets : opt.assets + '/';
    const rootEl = document.createElement('div'); rootEl.className = 'nikton-root'; rootEl.style.background = opt.background;
    const stage = document.createElement('div'); stage.className = 'nikton-stage';
    const cv = document.createElement('canvas'); cv.className = 'nikton-fx'; cv.width = 1920; cv.height = 1080;
    stage.append(cv); rootEl.append(stage); el.append(rootEl);
    const ctx = cv.getContext('2d');
    const fit = () => { stage.style.transform = 'scale(' + (rootEl.clientWidth / 1920) + ')'; };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null; if (ro) ro.observe(rootEl); fit();
    const inst = {};
    function scene(id) {
      if (inst[id]) return inst[id];
      const box = document.createElement('div'); box.className = 'nikton-scene'; box.style.display = 'none'; stage.insertBefore(box, cv);
      const m = META.find(s => s.id === id);
      const kit = Object.assign({}, H, {
        W: 1920, H: 1080, stage: box, fx: ctx, dur: m.dur, start: 0,
        h(s) { const d = document.createElement('div'); d.innerHTML = s.trim(); return d.firstElementChild; },
        css(t) { const s = document.createElement('style'); s.textContent = t; box.append(s); },
        json(n) { return n === 'frames.json' ? JSON.parse(FRAMES_JSON) : null; },
        assets: { url: n => (opt.assetMap && opt.assetMap[n]) || (base + n) },
      });
      const o = Object.create(DEFS[id]); if (o.init) o.init(kit);
      return (inst[id] = { o, kit, box, dur: m.dur });
    }
    let phase = opt.phase, t0 = performance.now(), held = 0, playing = false, raf = 0, shown = null;
    const total = META.reduce((a, s) => a + s.dur, 0);
    function locate(t) {
      if (phase !== 'all') return [phase, t];
      for (const s of META) { if (t < s.dur) return [s.id, t]; t -= s.dur; }
      return [META[META.length - 1].id, META[META.length - 1].dur];
    }
    function length() { return phase === 'all' ? total : META.find(s => s.id === phase).dur; }
    function draw(t) {
      const [id, lt] = locate(t), sc = scene(id);
      if (shown !== sc) { if (shown) shown.box.style.display = 'none'; sc.box.style.display = 'block'; shown = sc; }
      ctx.clearRect(0, 0, 1920, 1080); sc.o.render(lt, sc.kit);
    }
    function now() { return playing ? (performance.now() - t0) / 1000 * opt.speed : held; }
    function frame() {
      let t = now(); const L = length();
      if (t >= L) { if (opt.loop) { t = t % L; } else { t = L - 1e-3; api.pause(); held = t; if (opt.onEnd) opt.onEnd(phase); } }
      draw(t); if (playing) raf = requestAnimationFrame(frame);
    }
    const api = {
      phases: META.map(s => s.id),
      play() { if (playing) return; t0 = performance.now() - held * 1000 / opt.speed; playing = true; raf = requestAnimationFrame(frame); },
      pause() { if (!playing) return; held = now(); playing = false; cancelAnimationFrame(raf); },
      seek(t) { held = Math.max(0, t); t0 = performance.now() - held * 1000 / opt.speed; if (!playing) draw(held); },
      setPhase(id, restart) { phase = id; if (restart !== false) api.seek(0); },
      get phase() { return phase; }, get time() { return now(); }, get duration() { return length(); },
      destroy() { api.pause(); if (ro) ro.disconnect(); rootEl.remove(); },
    };
    draw(0); if (opt.autoplay) api.play();
    return api;
  }
  root.Nikton = { mount, phases: META };
})(typeof window !== 'undefined' ? window : this);
