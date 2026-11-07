// Sustituto de node:sqlite para el navegador, sobre sql.js (SQLite compilado a WebAssembly).
let SQL = null;
let initialBytes = null;
export let currentDb = null;

export function configure(sqlModule, bytes) {
  SQL = sqlModule;
  initialBytes = bytes ?? null;
}

const clean = (params) => params.map((v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v));

class Statement {
  constructor(raw, sql) {
    this.raw = raw;
    this.sql = sql;
  }
  run(...params) {
    const s = this.raw.prepare(this.sql);
    try { s.run(clean(params)); } finally { s.free(); }
    const changes = this.raw.getRowsModified();
    const id = this.raw.exec('SELECT last_insert_rowid()')[0].values[0][0];
    return { changes, lastInsertRowid: id };
  }
  get(...params) {
    const s = this.raw.prepare(this.sql);
    try {
      s.bind(clean(params));
      return s.step() ? s.getAsObject() : undefined;
    } finally { s.free(); }
  }
  all(...params) {
    const s = this.raw.prepare(this.sql);
    const out = [];
    try {
      s.bind(clean(params));
      while (s.step()) out.push(s.getAsObject());
    } finally { s.free(); }
    return out;
  }
}

export class DatabaseSync {
  constructor() {
    this.raw = initialBytes ? new SQL.Database(initialBytes) : new SQL.Database();
    currentDb = this;
  }
  exec(sql) { this.raw.exec(sql); }
  prepare(sql) { return new Statement(this.raw, sql); }
  export() { return this.raw.export(); }
}
