import { PropertyData, MonthlyRecord, FiscalPayment } from '@/types/property';

const APP_DB_KEY = 'APP_DB';

type AppDb = {
  properties: PropertyData[];
  monthlyRecords: MonthlyRecord[];
  fiscalPayments: FiscalPayment[];
};

function createEmptyDb(): AppDb {
  return {
    properties: [],
    monthlyRecords: [],
    fiscalPayments: [],
  };
}

function readLegacyAndMerge(db: AppDb): AppDb {
  try {
    const legacyProperty = localStorage.getItem('propertyData');
    const legacyMonthly = localStorage.getItem('monthlyRecords');
    const legacyFiscal = localStorage.getItem('fiscalPayments');

    const merged: AppDb = { ...db };

    if (legacyProperty) {
      const p: PropertyData = JSON.parse(legacyProperty);
      const exists = merged.properties.findIndex(x => x.id === p.id);
      if (exists >= 0) merged.properties[exists] = p;
      else merged.properties.push(p);
    }

    if (legacyMonthly) {
      const records: MonthlyRecord[] = JSON.parse(legacyMonthly);
      merged.monthlyRecords = records;
    }

    if (legacyFiscal) {
      const payments: FiscalPayment[] = JSON.parse(legacyFiscal);
      merged.fiscalPayments = payments;
    }

    return merged;
  } catch {
    return db;
  }
}

export function getDb(): AppDb {
  try {
    const raw = localStorage.getItem(APP_DB_KEY);
    if (!raw) {
      const initial = readLegacyAndMerge(createEmptyDb());
      localStorage.setItem(APP_DB_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as AppDb;
  } catch {
    const fallback = createEmptyDb();
    localStorage.setItem(APP_DB_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

export function setDb(db: AppDb): void {
  localStorage.setItem(APP_DB_KEY, JSON.stringify(db));
}

export function getProperty(): PropertyData | null {
  const db = getDb();
  return db.properties.length > 0 ? db.properties[0] : null;
}

export function saveProperty(property: PropertyData): void {
  const db = getDb();
  if (!property.id) property.id = 'local_' + Date.now().toString();
  if (db.properties.length === 0) {
    db.properties.push(property);
  } else {
    db.properties[0] = property;
  }
  setDb(db);
}

export function getMonthlyRecords(): MonthlyRecord[] {
  return getDb().monthlyRecords || [];
}

export function setMonthlyRecords(records: MonthlyRecord[]): void {
  const db = getDb();
  db.monthlyRecords = records;
  setDb(db);
}

export function getFiscalPayments(): FiscalPayment[] {
  return getDb().fiscalPayments || [];
}

export function setFiscalPayments(payments: FiscalPayment[]): void {
  const db = getDb();
  db.fiscalPayments = payments;
  setDb(db);
}

export function exportJson(): string {
  return JSON.stringify(getDb(), null, 2);
}

export function importJson(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as AppDb;
    if (!parsed || typeof parsed !== 'object') return false;
    const normalized: AppDb = {
      properties: parsed.properties || [],
      monthlyRecords: parsed.monthlyRecords || [],
      fiscalPayments: parsed.fiscalPayments || [],
    };
    setDb(normalized);
    return true;
  } catch {
    return false;
  }
}

export function clearAll(): void {
  setDb(createEmptyDb());
}
