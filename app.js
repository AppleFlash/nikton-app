/* Никтон — трекер кальяна. Без зависимостей. */
(function () {
'use strict';
var MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
var MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
var MON_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
var WD = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
var WD_FULL = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
var STORE_KEY = 'nikton.marks.v1';
function pad(n) { return (n < 10 ? '0' : '') + n; }
function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function today0() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
function wdIdx(d) { return (d.getDay() + 6) % 7; }
function plural(n, a, b, c) { var m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return a; if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return b; return c; }
function dWord(n) { return plural(n, 'день', 'дня', 'дней'); }
function streakAt(marks, d) { var n = 0, x = d; while (marks[keyOf(x)] === 'clean') { n++; x = addDays(x, -1); } return n; }
function tier(n) { return n >= 7 ? ' t3' : n >= 3 ? ' t2' : ''; }
function phaseInfo(n) {
  if (n >= 7) return { title: 'От Никтона остался пепел', sub: 'Неделя и больше без кальяна. Держи его в пепле.' };
  if (n === 6) return { title: 'Никтон распадается', sub: 'Ещё день — и от него останется только пепел.' };
  if (n === 5) return { title: 'Никтон трескается', sub: 'Он теряет форму. Не давай ему передышки.' };
  if (n === 4) return { title: 'По Никтону пошли трещины', sub: 'Четыре дня — он заметно слабее.' };
  if (n >= 2) return { title: 'Никтон растерян', sub: 'Он не понимает, куда делась его подпитка.' };
  return { title: 'Никтон ещё тянет к себе', sub: 'Первый день — самый трудный. Ты справился.' };
}
function loadMarks() { try { var s = window.localStorage.getItem(STORE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function saveMarks(m) {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(m)); return true; }
  catch (e) {
    S.dataOpen = true; S.dataError = true;
    S.dataMsg = 'Не удалось сохранить историю на устройстве. Проверьте свободное место и настройки браузера.';
    renderData(); return false;
  }
}
function stats(marks) {
  var keys = Object.keys(marks).sort(), clean = 0, smoked = 0, best = 0, run = 0, prev = null;
  keys.forEach(function (k) {
    if (marks[k] === 'smoked') { smoked++; run = 0; prev = null; return; }
    if (marks[k] !== 'clean') return;
    clean++;
    var p = k.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    run = (prev && keyOf(addDays(prev, 1)) === k) ? run + 1 : 1;
    prev = d; if (run > best) best = run;
  });
  return { clean: clean, smoked: smoked, best: best };
}
function currentState(marks) {
  var t = today0(), k = keyOf(t);
  if (marks[k] === 'smoked') return { smoked: true, n: 0, today: true };
  if (marks[k] === 'clean') return { smoked: false, n: streakAt(marks, t), today: true };
  return { smoked: false, n: streakAt(marks, addDays(t, -1)), today: false };
}
var specSeq = 1;

/* ================= App ================= */
var ASSETS_PATH = 'assets/';
var SMOKE_SVG = '<svg class="smk" viewBox="0 0 52 52" aria-hidden="true"><g filter="url(#smkBlur)"><circle class="p1" cx="20" cy="29" r="11" fill="url(#smkG)"></circle><circle class="p2" cx="31" cy="27" r="12" fill="url(#smkG)"></circle><circle class="p1" cx="26" cy="20" r="10" fill="url(#smkG)" opacity=".85"></circle><circle class="p2" cx="25" cy="32" r="9" fill="#5E5764" opacity=".6"></circle></g><path class="w" d="M30 12c-3-3 3-5 0-8" stroke="#B9B2BF" stroke-width="1.6" fill="none" stroke-linecap="round" filter="url(#smkBlur)"></path></svg>';
var ICON_CLOSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F4EEE8" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>';
var ICON_CHEV = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7E7186" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg>';

function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function parseKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

// ---------- state ----------
var params = new URLSearchParams(location.search);
var stored = loadMarks();
var S = {
  marks: stored || {},
  view: 'month', cursor: today0(), slide: 'zm', slideN: 0, statsOpen: false,
  sheet: null,      // { date, stage: 'choose'|'anim', spec }
  dataOpen: false, dataMsg: '', dataError: false, importing: false,
  splash: params.get('splash') !== '0'
};
var swiped = false, px = null, py = null;

// ---------- monster ----------
var mon = null;
function mountMonster(el, spec) {
  if (mon) { try { mon.destroy(); } catch (e) {} mon = null; }
  if (!el || !window.Nikton) return;
  var N = window.Nikton, base = { assets: ASSETS_PATH };
  var once = function (phase, next) {
    var m = N.mount(el, Object.assign({ phase: phase, loop: false, onEnd: function () { m.setPhase(next); m.play(); } }, base));
    return m;
  };
  if (spec.smoked) mon = once('smoked', 'phase-1');
  else if (spec.n >= 7) mon = N.mount(el, Object.assign({ phase: 'ash' }, base));
  else if (spec.n === 6) mon = once('phase-6', 'ash');
  else mon = N.mount(el, Object.assign({ phase: spec.n <= 1 ? 'phase-1' : spec.n <= 3 ? 'phase-2-3' : spec.n === 4 ? 'phase-4' : 'phase-5' }, base));
}
function stopMonster() { if (mon) { try { mon.destroy(); } catch (e) {} mon = null; } }

// ---------- actions ----------
function firstMonth() {
  var first = Object.keys(S.marks).sort()[0], d = first ? parseKey(first) : today0();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function periodStart(d, view) {
  if (view === 'week') return addDays(d, -wdIdx(d));
  return new Date(d.getFullYear(), view === 'year' ? 0 : d.getMonth(), 1);
}
function move(dir) {
  var c = S.cursor, next;
  if (S.view === 'month') next = new Date(c.getFullYear(), c.getMonth() + dir, 1);
  else if (S.view === 'week') next = addDays(c, 7 * dir);
  else next = new Date(c.getFullYear() + dir, c.getMonth(), 1);
  if (periodStart(next, S.view) < periodStart(firstMonth(), S.view)) return;
  S.cursor = next;
  S.slide = dir > 0 ? 'nx' : 'pv'; S.slideN++; renderMain();
}
function setView(v) {
  if (v === S.view) return;
  var c = S.cursor, t = today0();
  if (v === 'week' && c.getMonth() === t.getMonth() && c.getFullYear() === t.getFullYear()) S.cursor = t;
  S.view = v; S.slide = 'zm'; S.slideN++; renderMain();
}
function goToday() { if (S.view === 'year') S.view = 'month'; S.cursor = today0(); S.slide = 'zm'; S.slideN++; renderMain(); }
function openDay(k) {
  if (swiped) return;
  var d = parseKey(k); if (d < firstMonth() || d > today0()) return;
  S.sheet = { date: d, stage: 'choose', spec: null }; renderSheet();
}
function mark(kind) {
  var sh = S.sheet; if (!sh) return;
  var marks = Object.assign({}, S.marks); marks[keyOf(sh.date)] = kind;
  if (!saveMarks(marks)) return;
  S.marks = marks;
  sh.stage = 'anim';
  sh.spec = kind === 'smoked' ? { smoked: true, n: 0 } : { smoked: false, n: streakAt(S.marks, sh.date) };
  renderMain(); renderSheet();
}
function clearMark() {
  var m = Object.assign({}, S.marks); delete m[keyOf(S.sheet.date)];
  if (!saveMarks(m)) return;
  S.marks = m;
  S.sheet = null; renderMain(); renderSheet();
}
function closeSheet() { S.sheet = null; renderSheet(); }

function exportJson() {
  var url, link;
  S.dataError = false;
  try {
    var blob = new Blob([JSON.stringify({ version: 1, marks: S.marks }, null, 2)], { type: 'application/json' });
    url = URL.createObjectURL(blob);
    link = document.createElement('a'); link.href = url; link.download = 'nikton-history.json';
    document.body.appendChild(link); link.click();
    S.dataMsg = 'Скачивание nikton-history.json началось.';
  } catch (e) {
    S.dataError = true; S.dataMsg = 'Не удалось выгрузить историю. Попробуйте ещё раз.';
  } finally {
    if (link) link.remove();
    if (url) setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    renderData();
  }
}
async function importJson(file) {
  if (!file || S.importing) return;
  S.importing = true; S.dataError = false; S.dataMsg = 'Читаем файл…'; renderData();
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Файл слишком большой. Максимальный размер — 5 МБ.');
    var text, data;
    try { text = await file.text(); }
    catch (e) { throw new Error('Не удалось прочитать файл. Выберите его ещё раз.'); }
    try { data = JSON.parse(text.replace(/^\uFEFF/, '')); }
    catch (e) { throw new Error('Файл содержит некорректный JSON.'); }
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.version !== 1 || !data.marks || typeof data.marks !== 'object' || Array.isArray(data.marks)) {
      throw new Error('Неверный формат истории. Выберите JSON-файл, выгруженный из Никтона.');
    }
    var keys = Object.keys(data.marks), today = today0();
    keys.forEach(function (k) {
      var d = parseKey(k);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || keyOf(d) !== k) throw new Error('В истории есть некорректные даты. Используйте формат ГГГГ-ММ-ДД.');
      if (d > today) throw new Error('История содержит отметки за будущие дни.');
      if (data.marks[k] !== 'clean' && data.marks[k] !== 'smoked') throw new Error('В истории есть неизвестный тип отметки.');
    });
    if (!S.dataOpen) return;
    var cnt = keys.length, current = Object.keys(S.marks).length;
    if (!window.confirm('Загрузить историю из файла «' + file.name + '» (' + cnt + ' ' + plural(cnt, 'отметка', 'отметки', 'отметок') + ')?\n\nТекущая история (' + current + ' ' + plural(current, 'отметка', 'отметки', 'отметок') + ') будет полностью заменена.')) {
      S.dataMsg = 'Загрузка отменена. История не изменена.'; return;
    }
    if (!saveMarks(data.marks)) return;
    S.marks = data.marks; S.sheet = null; S.splash = false;
    renderMain(); renderSheet(); renderSplash();
    S.dataMsg = 'Загружено: ' + cnt + ' ' + plural(cnt, 'отметка', 'отметки', 'отметок') + '.';
  } catch (e) {
    S.dataError = true; S.dataMsg = e.message;
  } finally {
    S.importing = false; renderData();
  }
}

// ---------- render: main ----------
function cellOf(d, inMonth, marks, t, tk) {
  var k = keyOf(d), mk = marks[k], fut = d > t, n = mk === 'clean' ? streakAt(marks, d) : 0;
  return {
    k: k, mk: mk, n: n, fut: fut, label: d.getDate(), disabled: fut || !inMonth,
    cls: 'cell' + (mk ? ' ' + mk : ' none') + (mk === 'clean' ? tier(n) : '') + (inMonth ? '' : ' out') + (fut ? ' fut' : '') + (k === tk ? ' today' : ''),
    aria: d.getDate() + ' ' + MONTHS_GEN[d.getMonth()] + ', ' + (mk === 'clean' ? 'без курения, ' + n + '-й день' : mk === 'smoked' ? 'курил' : 'нет отметки')
  };
}

function renderMain() {
  var previousIndicator = document.querySelector('.seg-indicator');
  var previousLeft = previousIndicator && previousIndicator.dataset.period !== S.view ? previousIndicator.getBoundingClientRect().left : null;
  var periodFocused = document.activeElement && document.activeElement.matches('.seg button');
  var marks = S.marks, t = today0(), tk = keyOf(t), minMonth = firstMonth(), minCursor = periodStart(minMonth, S.view);
  if (periodStart(S.cursor, S.view) < minCursor) S.cursor = minCursor;
  var c = S.cursor, canPrev = periodStart(c, S.view) > minCursor;
  var st = stats(marks), cs = currentState(marks);

  // hero
  var hero = cs.smoked
    ? { label: 'Сегодня', num: '0', unit: 'дней подряд', sub: 'Сегодня был кальян. Завтра — новый отсчёт.', color: '#B9B2BF' }
    : { label: cs.today ? 'Без кальяна подряд' : 'Без кальяна подряд · до вчера', num: cs.n, unit: dWord(cs.n), sub: cs.n ? phaseInfo(cs.n).title : 'Отметь первый день — и начнётся отсчёт', color: '#4FE3A1' };

  // nav + pane
  var navTitle, navSub, pane = '';
  if (S.view === 'month') {
    var first = new Date(c.getFullYear(), c.getMonth(), 1), start = addDays(first, -wdIdx(first));
    var last = new Date(c.getFullYear(), c.getMonth() + 1, 0), n = Math.ceil((wdIdx(first) + last.getDate()) / 7) * 7, mc = 0, ms = 0;
    for (var q = 1; q <= last.getDate(); q++) { var v = marks[keyOf(new Date(c.getFullYear(), c.getMonth(), q))]; if (v === 'clean') mc++; if (v === 'smoked') ms++; }
    navTitle = MONTHS[c.getMonth()] + ' ' + c.getFullYear();
    navSub = mc + ' без курения · ' + ms + ' ' + plural(ms, 'раз', 'раза', 'раз') + ' курил';
    pane += '<div class="grid7" style="margin-bottom:6px">' + WD.map(function (w) { return '<span style="text-align:center;font-size:11px;font-weight:800;color:#7E7186;letter-spacing:.06em">' + w + '</span>'; }).join('') + '</div><div class="grid7" style="row-gap:4px">';
    for (var i = 0; i < n; i++) {
      var d = addDays(start, i), cc = cellOf(d, d.getMonth() === c.getMonth(), marks, t, tk);
      pane += '<button class="' + cc.cls + '" data-day="' + cc.k + '"' + (cc.disabled ? ' disabled' : '') + ' aria-label="' + esc(cc.aria) + '"><span class="mk"></span>' + (cc.mk === 'smoked' ? SMOKE_SVG : '') + '<span class="num">' + cc.label + '</span></button>';
    }
    pane += '</div>';
  } else if (S.view === 'week') {
    var ws = addDays(c, -wdIdx(c)), we = addDays(ws, 6);
    navTitle = ws.getDate() + ' ' + (ws.getMonth() !== we.getMonth() ? MONTHS_GEN[ws.getMonth()].slice(0, 3) + ' ' : '') + '– ' + we.getDate() + ' ' + MONTHS_GEN[we.getMonth()].slice(0, 3);
    navSub = 'Неделя';
    pane += '<div style="display:flex;flex-direction:column;gap:8px">';
    for (var j = 0; j < 7; j++) {
      var wd = addDays(ws, j), w = cellOf(wd, true, marks, t, tk), beforeStart = wd < minMonth;
      var status = w.fut ? 'Ещё впереди' : beforeStart ? 'До начала истории' : w.mk === 'clean' ? 'Без курения · ' + w.n + ' ' + dWord(w.n) + ' подряд' : w.mk === 'smoked' ? 'Курил' : 'Нет отметки — нажми, чтобы отметить';
      var col = w.mk === 'clean' ? '#4FE3A1' : w.mk === 'smoked' ? '#B9B2BF' : '#A99CB2';
      pane += '<button class="wrow" data-day="' + w.k + '"' + (w.fut || beforeStart ? ' disabled' : '') + '><span class="' + w.cls + '" style="width:52px;flex:none"><span class="mk"></span>' + (w.mk === 'smoked' ? SMOKE_SVG : '') + '<span class="num">' + w.label + '</span></span>'
        + '<span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1"><span style="font-size:15px;font-weight:800;color:#F4EEE8">' + WD_FULL[j] + (w.k === tk ? ' · сегодня' : '') + '</span><span style="font-size:13px;font-weight:600;color:' + col + '">' + status + '</span></span>' + ICON_CHEV + '</button>';
    }
    pane += '</div>';
  } else {
    var y = c.getFullYear(), yc = 0;
    Object.keys(marks).forEach(function (k) { if (+k.slice(0, 4) === y && marks[k] === 'clean') yc++; });
    navTitle = '' + y; navSub = yc + ' ' + dWord(yc) + ' без курения за год';
    pane += '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">';
    for (var mi = 0; mi < 12; mi++) {
      var f = new Date(y, mi, 1), L = new Date(y, mi + 1, 0).getDate(), dots = '', cl = 0;
      for (var e = 0; e < wdIdx(f); e++) dots += '<span class="dot e"></span>';
      for (var dd = 1; dd <= L; dd++) {
        var dt = new Date(y, mi, dd), kk = keyOf(dt), mm = marks[kk]; if (mm === 'clean') cl++;
        dots += '<span class="dot' + (dt > t ? ' fut' : mm ? ' ' + mm : '') + (kk === tk ? ' today' : '') + '"></span>';
      }
      var isCur = mi === t.getMonth() && y === t.getFullYear();
      pane += '<button class="ym' + (isCur ? ' cur' : '') + '" data-month="' + mi + '"' + (f < minMonth ? ' disabled' : '') + ' aria-label="' + MONTHS[mi] + ': дней без курения ' + cl + '"><span style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:12px;font-weight:800;color:#F4EEE8">' + MON_SHORT[mi] + '</span><span style="font-size:10px;font-weight:800;color:#4FE3A1">' + (cl ? cl + ' ✓' : '') + '</span></span><span class="dots">' + dots + '</span></button>';
    }
    pane += '</div>';
  }

  var pill = '<button class="pill" data-act="toggleStats" aria-controls="statsDetails" aria-expanded="' + !!S.statsOpen + '" aria-label="Серия: ' + hero.num + ' ' + hero.unit + '. ' + (S.statsOpen ? 'Скрыть' : 'Показать') + ' статистику" style="border-color:' + (cs.smoked ? 'rgba(185,178,191,.3)' : 'rgba(79,227,161,.35)') + ';background:' + (cs.smoked ? 'rgba(185,178,191,.08)' : 'rgba(79,227,161,.08)') + '">'
    + '<span class="disp" style="font-size:18px;font-weight:700;color:' + hero.color + '">' + hero.num + '</span>'
    + '<span style="display:flex;flex-direction:column;align-items:flex-start;line-height:1.15"><span style="font-size:13px;font-weight:800;color:#F4EEE8">' + (cs.smoked ? 'сегодня курил' : dWord(cs.n) + ' без кальяна') + '</span><span style="font-size:11px;font-weight:600;color:#A99CB2">' + (cs.smoked ? 'новый отсчёт завтра' : cs.today ? 'текущая серия' : 'серия до вчера') + '</span></span>'
    + '<svg class="chev' + (S.statsOpen ? ' up' : '') + '" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A99CB2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg></button>';
  var seg = function (v, label) { return '<button class="' + (S.view === v ? 'on' : '') + '" data-view="' + v + '" role="tab" aria-selected="' + (S.view === v) + '">' + label + '</button>'; };
  var tile = function (label, val, unit, color) { return '<div class="tile"><span style="font-size:11px;font-weight:700;color:#A99CB2">' + label + '</span><span class="disp" style="font-size:22px;font-weight:700;color:' + color + '">' + val + '</span><span style="font-size:11px;color:#A99CB2">' + unit + '</span></div>'; };

  document.getElementById('main').innerHTML =
    '<div class="inner">'
    + '<header style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div style="display:flex;align-items:center;gap:10px">'
    + '<div style="width:34px;height:34px;border-radius:11px;background:linear-gradient(145deg,#F5A623,#B8487A);display:grid;place-items:center;box-shadow:0 6px 18px rgba(245,166,35,.25)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A0D1F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20c2-6 12-6 14 0"></path><circle cx="9" cy="10" r="1.6"></circle><circle cx="15" cy="10" r="1.6"></circle><path d="M6 6l2 2M18 6l-2 2"></path></svg></div>'
    + pill + '</div>'
    + '<button class="icb" data-act="openData" aria-label="Данные: выгрузка и загрузка истории"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CFC4D6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"></ellipse><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"></path><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path></svg></button></header>'
    + '<div id="stats" class="stats ' + (S.statsOpen ? 'open' : 'closed') + '">'
    + '<div class="clp sl-wrap" aria-hidden="' + !!S.statsOpen + '"' + (S.statsOpen ? ' inert' : '') + '><div><button class="statline" data-act="toggleStats" aria-label="Показать статистику" aria-controls="statsDetails" aria-expanded="false"><span><b style="color:#4FE3A1">' + st.clean + '</b> без курения</span><span class="sep"></span><span><b style="color:#C9C2CF">' + st.smoked + '</b> курил</span><span class="sep"></span><span>рекорд <b style="color:#F5A623">' + st.best + '</b></span></button></div></div>'
    + '<div id="statsDetails" class="clp det-wrap" aria-hidden="' + !S.statsOpen + '"' + (S.statsOpen ? '' : ' inert') + '><div><section class="det" style="border-radius:20px;padding:14px;background:radial-gradient(120% 140% at 100% 0%,rgba(79,227,161,.14),rgba(79,227,161,0) 55%),linear-gradient(180deg,#1F1526,#170F1C);border:1px solid rgba(255,255,255,.07)">'
    + '<div style="font-size:13px;color:#CFC4D6;font-weight:600">' + hero.sub + '</div>'
    + '<div style="margin-top:12px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7E7186">За всё время</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px">'
    + tile('Без курения', st.clean, dWord(st.clean), '#4FE3A1') + tile('Курил', st.smoked, dWord(st.smoked), '#C9C2CF') + tile('Самый долгий', st.best, dWord(st.best) + ' подряд', '#F5A623')
    + '</div></section></div></div></div>'
    + '<div class="seg" role="tablist" aria-label="Масштаб календаря" style="--period:' + ['week', 'month', 'year'].indexOf(S.view) + '"><span class="seg-indicator" data-period="' + S.view + '" aria-hidden="true"></span>' + seg('week', 'Неделя') + seg('month', 'Месяц') + seg('year', 'Год') + '</div>'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'
    + '<button class="icb" data-act="prev"' + (canPrev ? '' : ' disabled') + ' aria-label="Назад"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4EEE8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></button>'
    + '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0"><span class="disp" style="font-size:18px;font-weight:700">' + navTitle + '</span><span style="font-size:12px;color:#A99CB2;font-weight:600">' + navSub + '</span>'
    + '<button class="chip" data-act="today" style="margin-top:4px;height:24px;padding:0 10px;font-size:11px;font-weight:600;color:#A99CB2;border-color:rgba(255,255,255,.08);background:transparent">Сегодня · ' + (S.view === 'week' ? 'К этой неделе' : 'К этому месяцу') + '</button></div>'
    + '<button class="icb" data-act="next" aria-label="Вперёд"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4EEE8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg></button></div>'
    + '<div class="pane" id="pane"><div class="sl-' + S.slide + (S.slideN % 2) + '">' + pane + '</div></div>'
    + '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 18px;font-size:12px;font-weight:700;color:#A99CB2">'
    + '<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:14px;height:14px;border-radius:50%;border:1.5px solid #4FE3A1;background:rgba(79,227,161,.25);box-shadow:0 0 8px rgba(79,227,161,.4)"></span>без курения</span>'
    + '<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#B9B2BF,rgba(110,103,116,.2) 70%);filter:blur(.6px)"></span>курил</span>'
    + '<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:14px;height:3px;border-radius:2px;background:#F5A623"></span>сегодня</span></div>'
    + '</div>';
  if (periodFocused) document.querySelector('.seg .on').focus({ preventScroll: true });
  if (previousLeft !== null && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var indicator = document.querySelector('.seg-indicator');
    if (indicator.animate) indicator.animate([
      { transform: 'translateX(' + (previousLeft - indicator.getBoundingClientRect().left) + 'px)' },
      { transform: 'translateX(0px)' }
    ], { duration: 200, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  }
}

// ---------- render: day sheet ----------
function renderSheet() {
  var root = document.getElementById('sheet'), sh = S.sheet;
  if (!sh) { if (!S.splash) stopMonster(); root.innerHTML = ''; return; }
  var k = keyOf(sh.date), mk = S.marks[k], tk = keyOf(today0());
  var head = '<div class="grab"></div><div class="sheet-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><div style="display:flex;flex-direction:column;gap:4px">'
    + '<span style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#A99CB2">' + (k === tk ? 'Сегодня · ' : '') + WD_FULL[wdIdx(sh.date)] + '</span>'
    + '<span class="disp" style="font-size:24px;font-weight:700">' + sh.date.getDate() + ' ' + MONTHS_GEN[sh.date.getMonth()] + '</span></div>'
    + '<button class="icb" data-act="closeSheet" aria-label="Закрыть">' + ICON_CLOSE + '</button></div>';
  var body;
  if (sh.stage === 'choose') {
    var hint = mk === 'clean' ? 'Сейчас отмечено: без курения. Можно изменить.' : mk === 'smoked' ? 'Сейчас отмечено: курил. Можно изменить.' : 'Как прошёл этот день?';
    body = '<div style="display:flex;flex-direction:column;gap:12px;margin-top:18px"><div style="font-size:14px;color:#CFC4D6;font-weight:600;line-height:1.45">' + hint + '</div>'
      + '<button class="btn-clean" data-act="markClean"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#062417" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>Не курил</button>'
      + '<button class="btn-smoked" data-act="markSmoked"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9A9D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 20h8M10 20v-5h4v5M9 15h6l-1-4h-4z"></path><path d="M12 8c-2-1.5 1-3 0-5M15 8c-1.5-1 .5-2 0-3.5"></path></svg>Покурил</button>'
      + (mk ? '<button class="btn-ghost" data-act="clearMark">Снять отметку</button>' : '') + '</div>';
  } else {
    var title, sub, color = '#4FE3A1';
    if (sh.spec.smoked) { title = 'Никтон набрался сил'; sub = 'Ничего страшного — отметь завтрашний день зелёным, и он снова начнёт слабеть.'; color = '#FF9A9D'; }
    else { var pi = phaseInfo(sh.spec.n); title = pi.title; sub = sh.spec.n + ' ' + dWord(sh.spec.n) + ' без кальяна. ' + pi.sub; }
    body = '<div style="display:flex;flex-direction:column;gap:14px;margin-top:10px"><div class="stage' + (sh.spec.smoked ? ' smk-bg' : '') + '"><div class="host" id="sheetHost"></div></div>'
      + '<div style="display:flex;flex-direction:column;gap:6px;text-align:center;animation:rise .5s .2s both"><span class="disp" style="font-size:20px;font-weight:700;color:' + color + '">' + title + '</span><span style="font-size:14px;color:#CFC4D6;font-weight:600;line-height:1.45">' + sub + '</span></div>'
      + '<button class="btn-main" data-act="closeSheet">Готово</button></div>';
  }
  var reopen = !root.firstChild;
  root.innerHTML = '<div class="ovl"><button class="scrim" data-act="closeSheet" aria-label="Закрыть"' + (reopen ? '' : ' style="animation:none"') + '></button><div class="sheet" role="dialog" aria-modal="true">' + head + body + '</div></div>';
  if (sh.stage === 'anim') mountMonster(document.getElementById('sheetHost'), sh.spec);
}

// ---------- render: data sheet ----------
function renderData() {
  var root = document.getElementById('data');
  if (!S.dataOpen) { root.innerHTML = ''; return; }
  var cnt = Object.keys(S.marks).length, reopen = !root.firstChild, na = reopen ? '' : ' style="animation:none"';
  var tone = S.dataError ? '229,72,77' : '79,227,161';
  root.innerHTML = '<div class="ovl"><button class="scrim" data-act="closeData" aria-label="Закрыть"' + na + '></button><div class="sheet" role="dialog" aria-modal="true" aria-label="Данные">'
    + '<div class="grab"></div><div class="sheet-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><div style="display:flex;flex-direction:column;gap:4px"><span style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#A99CB2">Сервис</span><span class="disp" style="font-size:24px;font-weight:700">Данные</span></div>'
    + '<button class="icb" data-act="closeData" aria-label="Закрыть">' + ICON_CLOSE + '</button></div>'
    + '<div style="margin-top:8px;font-size:14px;color:#CFC4D6;font-weight:600;line-height:1.45">История хранится на этом устройстве. Сохрани копию или перенеси отметки с другого телефона.</div>'
    + '<div style="display:flex;flex-direction:column;gap:10px;margin-top:18px">'
    + '<button class="wrow" data-act="export"' + (S.importing ? ' disabled' : '') + ' style="padding:12px 14px"><span style="width:44px;height:44px;flex:none;border-radius:14px;display:grid;place-items:center;background:rgba(79,227,161,.12);border:1px solid rgba(79,227,161,.3)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4FE3A1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5"></path><path d="M5 20h14"></path></svg></span>'
    + '<span style="display:flex;flex-direction:column;gap:2px;flex:1;min-width:0"><span style="font-size:15px;font-weight:800;color:#F4EEE8">Выгрузить историю</span><span style="font-size:12px;font-weight:600;color:#A99CB2">' + cnt + ' ' + plural(cnt, 'отметка', 'отметки', 'отметок') + ' · файл .json</span></span></button>'
    + '<label class="wrow" style="padding:12px 14px"><input type="file" id="importInput" class="hidden-input" accept="application/json,.json"' + (S.importing ? ' disabled' : '') + '><span style="width:44px;height:44px;flex:none;border-radius:14px;display:grid;place-items:center;background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.3)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M7 9l5-5 5 5"></path><path d="M5 20h14"></path></svg></span>'
    + '<span style="display:flex;flex-direction:column;gap:2px;flex:1;min-width:0"><span style="font-size:15px;font-weight:800;color:#F4EEE8">Загрузить из JSON</span><span style="font-size:12px;font-weight:600;color:#A99CB2">Заменит текущие отметки</span></span></label>'
    + (S.dataMsg ? '<div role="' + (S.dataError ? 'alert' : 'status') + '" style="padding:10px 14px;border-radius:14px;background:rgba(' + tone + ',.10);border:1px solid rgba(' + tone + ',.3);color:' + (S.dataError ? '#FF9A9D' : '#8AF0C2') + ';font-size:13px;font-weight:700">' + esc(S.dataMsg) + '</div>' : '')
    + '<div style="font-size:11px;color:#7E7186;font-weight:600;line-height:1.5;font-family:ui-monospace,monospace">{ "version": 1, "marks": { "2026-10-16": "clean", "2026-10-12": "smoked" } }</div>'
    + '</div></div></div>';
  document.getElementById('importInput').addEventListener('change', function (e) { importJson(e.target.files && e.target.files[0]); });
}

// ---------- render: splash ----------
function renderSplash() {
  var root = document.getElementById('splash');
  if (!S.splash) { root.innerHTML = ''; return; }
  var cs = currentState(S.marks), kicker, title, sub, cta, warn = false;
  if (cs.smoked) { kicker = 'Сегодня был кальян'; title = 'Никтон сыт и доволен'; sub = 'Это не конец серии — это повод начать новую уже завтра.'; cta = 'Изменить отметку за сегодня'; }
  else if (cs.n >= 1) { kicker = cs.n + ' ' + dWord(cs.n) + ' без кальяна'; title = phaseInfo(cs.n).title; sub = cs.today ? 'Сегодня уже отмечен. Так держать.' : 'Отметь сегодняшний день, когда он закончится.'; warn = true; cta = cs.today ? 'Посмотреть сегодняшний день' : 'Отметить сегодня'; }
  else { kicker = 'Никтон в полной силе'; title = 'Он ждёт, когда ты сорвёшься'; sub = 'Отмечай каждый день без кальяна — и смотри, как он слабеет.'; cta = 'Отметить сегодня'; }
  root.innerHTML = '<div class="splash" id="splashEl">'
    + '<div style="display:flex;justify-content:center"><span class="disp" style="font-size:13px;font-weight:700;letter-spacing:.3em;color:#F5A623">НИКТОН</span></div>'
    + '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px">'
    + '<div class="stage big' + (cs.smoked ? ' smk-bg' : '') + '" style="margin:0 -20px"><div class="host" id="splashHost"></div></div>'
    + '<div class="rise1" style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px"><span style="font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#A99CB2">' + kicker + '</span><span class="disp" style="font-size:30px;line-height:1.15;font-weight:700">' + title + '</span></div>'
    + (warn ? '<div class="rise2" style="display:flex;justify-content:center"><span class="warn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC768" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 16H3z"></path><path d="M12 10v4M12 17h.01"></path></svg>Не дай ему набрать силы!</span></div>' : '')
    + '<div class="rise2" style="text-align:center;font-size:15px;color:#CFC4D6;font-weight:600;line-height:1.5;padding:0 12px">' + sub + '</div></div>'
    + '<div class="rise3" style="display:flex;flex-direction:column;gap:10px"><button class="btn-main" data-act="closeSplash">Открыть календарь</button>'
    + '<button class="btn-ghost" data-act="splashToday" style="text-decoration:none;color:#4FE3A1">' + cta + '</button></div></div>';
  mountMonster(document.getElementById('splashHost'), { smoked: cs.smoked, n: Math.max(cs.n, 1) });
}

// ---------- events (delegation) ----------
var app = document.getElementById('app');
app.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act],[data-day],[data-view],[data-month]');
  if (!b || b.disabled) return;
  if (b.dataset.day) return openDay(b.dataset.day);
  if (b.dataset.view) return setView(b.dataset.view);
  if (b.dataset.month != null) { S.view = 'month'; S.cursor = new Date(S.cursor.getFullYear(), +b.dataset.month, 1); S.slide = 'zm'; S.slideN++; return renderMain(); }
  switch (b.dataset.act) {
    case 'prev': return move(-1);
    case 'next': return move(1);
    case 'today': return goToday();
    case 'toggleStats':
      S.statsOpen = !S.statsOpen;
      var box = document.getElementById('stats'), pl = document.querySelector('.pill');
      box.classList.toggle('open', S.statsOpen); box.classList.toggle('closed', !S.statsOpen);
      pl.setAttribute('aria-expanded', S.statsOpen);
      pl.setAttribute('aria-label', pl.getAttribute('aria-label').replace(S.statsOpen ? 'Показать' : 'Скрыть', S.statsOpen ? 'Скрыть' : 'Показать'));
      pl.querySelector('.chev').classList.toggle('up', S.statsOpen);
      var summary = box.querySelector('.sl-wrap'), details = box.querySelector('.det-wrap');
      if (summary.contains(document.activeElement)) pl.focus();
      summary.inert = S.statsOpen; summary.setAttribute('aria-hidden', S.statsOpen);
      details.inert = !S.statsOpen; details.setAttribute('aria-hidden', !S.statsOpen);
      return;
    case 'markClean': return mark('clean');
    case 'markSmoked': return mark('smoked');
    case 'clearMark': return clearMark();
    case 'closeSheet': return closeSheet();
    case 'openData': S.dataOpen = true; S.dataMsg = ''; return renderData();
    case 'closeData': S.dataOpen = false; S.dataMsg = ''; return renderData();
    case 'export': return exportJson();
    case 'closeSplash':
      document.getElementById('splashEl').classList.add('out');
      setTimeout(function () { S.splash = false; stopMonster(); renderSplash(); }, 420); return;
    case 'splashToday':
      S.splash = false; stopMonster(); renderSplash();
      S.sheet = { date: today0(), stage: 'choose', spec: null }; return renderSheet();
  }
});
// swipe on calendar
app.addEventListener('pointerdown', function (e) { if (!e.target.closest('#pane')) return; swiped = false; px = e.clientX; py = e.clientY; });
app.addEventListener('pointerup', function (e) {
  if (px == null) return;
  var dx = e.clientX - px, dy = e.clientY - py; px = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped = true; move(dx < 0 ? 1 : -1); setTimeout(function () { swiped = false; }, 80); }
});
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (S.dataOpen) { S.dataOpen = false; renderData(); } else if (S.sheet) closeSheet();
});

renderMain(); renderSheet(); renderData(); renderSplash();
})();
