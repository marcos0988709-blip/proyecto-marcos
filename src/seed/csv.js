import { readFileSync } from 'node:fs';
import { POSITIONS } from '../config/formations.js';

/** Parser CSV con soporte de comillas, comas y saltos de línea dentro de campos. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === ';') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  const [header, ...data] = rows;
  const keys = header.map((h) => h.trim().toLowerCase().replace(/^﻿/, ''));
  return data.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

// Alias de columnas: acepta el formato propio y los formatos típicos de datasets públicos (estilo sofifa/Kaggle).
const ALIASES = {
  name: ['name', 'short_name', 'player_name', 'known_as', 'long_name', 'full_name'],
  nation: ['nation', 'nationality', 'nationality_name', 'country'],
  league: ['league', 'league_name'],
  club: ['club', 'club_name', 'team'],
  position: ['position', 'best_position', 'player_positions', 'positions'],
  alt_positions: ['alt_positions', 'alternative_positions'],
  rating: ['rating', 'overall', 'ovr'],
  age: ['age'],
  pac: ['pac', 'pace'],
  sho: ['sho', 'shooting'],
  pas: ['pas', 'passing'],
  dri: ['dri', 'dribbling'],
  def: ['def', 'defending', 'defence'],
  phy: ['phy', 'physical', 'physicality', 'physic'],
  is_legend: ['is_legend', 'legend', 'icon'],
};

// Mapear posiciones detalladas a las 12 que usa el juego.
const POSITION_MAP = { LWB: 'LB', RWB: 'RB', CF: 'ST', LF: 'LW', RF: 'RW', LS: 'ST', RS: 'ST', LCB: 'CB', RCB: 'CB', LCM: 'CM', RCM: 'CM', LDM: 'CDM', RDM: 'CDM', LAM: 'CAM', RAM: 'CAM', SW: 'CB', GK: 'GK' };
const normPos = (p) => {
  const up = p.trim().toUpperCase();
  const mapped = POSITION_MAP[up] ?? up;
  return POSITIONS.includes(mapped) ? mapped : null;
};

const get = (row, key) => {
  for (const alias of ALIASES[key]) if (row[alias] !== undefined && row[alias] !== '') return row[alias];
  return undefined;
};
const num = (v) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Math.round(Number(v)));

export function normalizePlayer(row) {
  const name = get(row, 'name');
  const rating = num(get(row, 'rating'));
  const posRaw = (get(row, 'position') ?? '').split(/[|,/ ]+/).map(normPos).filter(Boolean);
  if (!name || !rating || posRaw.length === 0) return null;
  const altExtra = (get(row, 'alt_positions') ?? '').split(/[|,/ ]+/).map(normPos).filter(Boolean);
  const legendRaw = String(get(row, 'is_legend') ?? '').toLowerCase();
  return {
    name,
    nation: get(row, 'nation') ?? 'Desconocida',
    league: get(row, 'league') ?? 'Sin liga',
    club: get(row, 'club') ?? 'Libre',
    position: posRaw[0],
    alt_positions: [...new Set([...posRaw.slice(1), ...altExtra])].filter((p) => p !== posRaw[0]).join('|'),
    age: num(get(row, 'age')),
    rating,
    pac: num(get(row, 'pac')), sho: num(get(row, 'sho')), pas: num(get(row, 'pas')),
    dri: num(get(row, 'dri')), def: num(get(row, 'def')), phy: num(get(row, 'phy')),
    is_legend: ['1', 'true', 'yes', 'si', 'sí'].includes(legendRaw) ? 1 : 0,
  };
}

export function loadPlayersFromCsv(path) {
  const rows = parseCsv(readFileSync(path, 'utf8'));
  const players = rows.map(normalizePlayer).filter(Boolean);
  return { players, skipped: rows.length - players.length };
}
