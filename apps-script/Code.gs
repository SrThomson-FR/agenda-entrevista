/**
 * Agenda de entrevistas · Módulo 3 · FIMLM
 * Backend en Google Apps Script. Guarda las reservas en la hoja "Reservas"
 * del Google Sheet al que está vinculado este script.
 *
 * Reglas:
 *  - Cada reserva tiene una hora de registro en milisegundos (servidor).
 *  - El script usa un candado: si dos personas guardan la misma hora,
 *    gana la primera que entra al candado y la otra recibe "taken".
 *  - La persona se identifica por su correo: con el mismo correo puede
 *    cambiar SU hora; no puede tocar la de otros.
 *  - Nunca se devuelve quién ocupó una hora (solo cuántos cupos hay).
 *  - Cierra el viernes 30 de octubre de 2026 a las 8:00 pm (Bogotá).
 */

const ADMIN_CODE = '2026';
const SHEET_NAME = 'Reservas';
const CLOSE_MS = Date.parse('2026-10-30T20:00:00-05:00');

const TIMES = [
  { id: '1800', range: '6:00 – 6:30 pm' },
  { id: '1830', range: '6:30 – 7:00 pm' },
  { id: '1900', range: '7:00 – 7:30 pm' }
];
const DAYS = [
  { id: 'o27', label: 'Martes 27 de octubre', cap: 1 },
  { id: 'o28', label: 'Miércoles 28 de octubre', cap: 1 },
  { id: 'o29', label: 'Jueves 29 de octubre', cap: 1 },
  { id: 'o30', label: 'Viernes 30 de octubre', cap: 2 }
];

// Columnas de la hoja
const C = { DIA: 0, HORA: 1, PROF: 2, NOMBRE: 3, CORREO: 4, VAC: 5, CV: 6, SLOT: 7, REG: 8, UPD: 9 };
const HEAD = ['Día', 'Hora', 'Profesor asignado', 'Estudiante', 'Correo', 'Vacante de interés',
  '¿Envió hoja de vida?', 'Código de hora', 'Registro (ms)', 'Última actualización (ms)'];

function buildSlots_() {
  const out = [];
  DAYS.forEach(function (d) {
    TIMES.forEach(function (t) {
      out.push({ id: d.id + '_' + t.id, dayLabel: d.label, timeRange: t.range, cap: d.cap });
    });
  });
  return out;
}

/* ---------- Entradas web ---------- */

function doGet() {
  return json_({ ok: true, service: 'agenda-entrevista' });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }
  try {
    return json_(route_(sheetStore_(), body, Date.now()));
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Almacén (hoja de cálculo) ---------- */

function sheetStore_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
    sh.getRange('A:H').setNumberFormat('@');
    sh.setFrozenRows(1);
  }
  return {
    read: function () {
      const n = sh.getLastRow();
      if (n < 2) return [];
      return sh.getRange(2, 1, n - 1, HEAD.length).getValues();
    },
    append: function (row) { sh.appendRow(row); },
    write: function (i, row) { sh.getRange(i + 2, 1, 1, HEAD.length).setValues([row]); }
  };
}

/* ---------- Lógica (no depende de Google, se puede probar aparte) ---------- */

function route_(store, req, now) {
  switch (req.action) {
    case 'state': return state_(store, req.email, now);
    case 'book': return book_(store, req, now);
    case 'admin': return admin_(store, req.code);
    default: return { ok: false, error: 'bad_request' };
  }
}

function clean_(s, max) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evita fórmulas en la hoja
  return s;
}
function normEmail_(s) { return String(s || '').trim().toLowerCase(); }
function validEmail_(s) { return s.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }

function takenMap_(rows) {
  const m = {};
  rows.forEach(function (r) { const id = String(r[C.SLOT]); m[id] = (m[id] || 0) + 1; });
  return m;
}
function findMine_(rows, email) {
  if (!email) return -1;
  for (let i = 0; i < rows.length; i++) {
    if (normEmail_(rows[i][C.CORREO]) === email) return i;
  }
  return -1;
}

function state_(store, rawEmail, now) {
  const rows = store.read();
  const taken = takenMap_(rows);
  const email = normEmail_(rawEmail);
  const i = validEmail_(email) ? findMine_(rows, email) : -1;
  return {
    ok: true,
    closed: now >= CLOSE_MS,
    slots: buildSlots_().map(function (s) { return { id: s.id, cap: s.cap, taken: taken[s.id] || 0 }; }),
    mine: i < 0 ? null : {
      slotId: String(rows[i][C.SLOT]),
      name: String(rows[i][C.NOMBRE]),
      vacante: String(rows[i][C.VAC])
    }
  };
}

function book_(store, req, now) {
  if (now >= CLOSE_MS) return { ok: false, error: 'closed' };
  const slot = buildSlots_().filter(function (s) { return s.id === req.slotId; })[0];
  if (!slot) return { ok: false, error: 'invalid' };
  const email = normEmail_(req.email);
  const name = clean_(req.name, 80);
  if (name.length < 2 || !validEmail_(email)) return { ok: false, error: 'invalid' };
  const vacante = clean_(req.vacante, 120);

  const rows = store.read();
  const taken = takenMap_(rows);
  const i = findMine_(rows, email);

  // Misma hora que ya tenía: solo actualiza nombre y vacante.
  if (i >= 0 && String(rows[i][C.SLOT]) === slot.id) {
    const row = rows[i].slice();
    row[C.NOMBRE] = name; row[C.VAC] = vacante; row[C.UPD] = now;
    store.write(i, row);
    return { ok: true, status: 'updated', slotId: slot.id, dayLabel: slot.dayLabel, timeRange: slot.timeRange };
  }
  if ((taken[slot.id] || 0) >= slot.cap) return { ok: false, error: 'taken' };

  const dia = slot.dayLabel, hora = slot.timeRange;
  if (i >= 0) { // cambia SU reserva a otra hora (la anterior queda libre)
    const row = rows[i].slice();
    row[C.DIA] = dia; row[C.HORA] = hora; row[C.PROF] = '';
    row[C.NOMBRE] = name; row[C.VAC] = vacante; row[C.SLOT] = slot.id; row[C.UPD] = now;
    store.write(i, row);
    return { ok: true, status: 'moved', slotId: slot.id, dayLabel: dia, timeRange: hora };
  }
  store.append([dia, hora, '', name, email, vacante, '', slot.id, now, now]);
  return { ok: true, status: 'created', slotId: slot.id, dayLabel: dia, timeRange: hora };
}

function admin_(store, code) {
  if (String(code) !== ADMIN_CODE) return { ok: false, error: 'forbidden' };
  const rows = store.read();
  const agenda = [];
  buildSlots_().forEach(function (s) {
    const here = rows.filter(function (r) { return String(r[C.SLOT]) === s.id; })
      .sort(function (a, b) { return Number(a[C.REG]) - Number(b[C.REG]); });
    for (let k = 0; k < s.cap; k++) {
      const r = here[k];
      agenda.push({
        dia: s.dayLabel, hora: s.timeRange,
        profesor: r ? String(r[C.PROF]) : '',
        estudiante: r ? String(r[C.NOMBRE]) : '',
        correo: r ? String(r[C.CORREO]) : '',
        vacante: r ? String(r[C.VAC]) : '',
        hoja: r ? String(r[C.CV]) : ''
      });
    }
  });
  return { ok: true, agenda: agenda, total: rows.length, cupos: agenda.length };
}
