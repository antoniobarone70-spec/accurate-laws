// Types per l'applicazione Accurate Laws

export interface PropertyData {
  id?: string;
  
  // Condominio
  condominiumName: string;
  address: string;
  fiscalCode: string;
  comuneName: string;
  
  // Amministratore
  adminName: string;
  adminPhone: string;
  adminMobile: string;
  adminEmail: string;
  adminPec: string;
  adminFiscalCode: string;
  adminVat: string;
  adminRea: string;
  adminAddress: string;
  
  // Banca
  bankName: string;
  bankIban: string;
  
  // Contratto
  tenantName: string;
  rentalType: 'Transitorio' | 'Ordinario' | 'Studenti' | 'Concordato';
  startDate: string;
  endDate: string;
  monthlyRent: number;
  condominiumFees: number;
  cedolareSeccaYear: 'primo' | 'secondo' | 'terzo_plus';
  registrationNumber: string;
  registrationDate: string;
  depositoCauzionale: string;

  // Catasto Principale
  mainCategory: string;
  mainRendita: number;
  mainMq: number;  // ✅ CAMPO AGGIUNTO
  mainSezioneUrbana: string;
  mainFoglio: string;
  mainParticella: string;
  mainSubalterno: string;

  // Catasto Pertinenza
  pertinenzaCategory: string;
  pertinenzaRendita: number;
  pertinenzaMq: number;  // ✅ CAMPO AGGIUNTO
  pertinenzaSezioneUrbana: string;
  pertinenzaFoglio: string;
  pertinenzaParticella: string;
  pertinenzaSubalterno: string;

  // IMU
  imuAliquota: number;

  // Contatori
  contatoreGas: string;
  contatoreLuce: string;
  contatoreAcqua: string;

  // Relazioni
  scheduledItems: ScheduledItem[];
  inventory: InventoryRoom[];
}

// ✅ CORRETTO: Interfaccia MonthlyRecord allineata al PropertyContext
export interface MonthlyRecord {
  id?: string;
  month: number; // numero del mese (1-12)
  year: number;
  rentReceived: number; // importo ricevuto (non boolean)
  condominiumFees: number; // spese condominiali
  receivedDate: string | null; // data di ricezione del pagamento
  status: 'atteso' | 'registrato' | 'ritardo'; // stato del pagamento
  extraExpenses: ExtraExpense[]; // spese straordinarie
  notes?: string;
}

// ✅ CORRETTO: Interfaccia FiscalPayment con campi paid e paidDate
export interface FiscalPayment {
  id: string;
  date: string;
  type: 'acconto' | 'saldo';
  amount: number;
  year: number;
  notes: string;
  paid?: boolean; // ✅ AGGIUNTO
  paidDate?: string | null; // ✅ AGGIUNTO
}

// ✅ CORRETTO: Interfaccia ScheduledItem con campo notes
export interface ScheduledItem {
  id: string;
  title: string;
  date: string;
  type: 'fiscale' | 'contratto' | 'manutenzione' | 'altro';
  completed: boolean;
  notes?: string; // ✅ AGGIUNTO
}

export interface InventoryRoom {
  id: string;
  name: string;
  description: string;
}

// ✅ CORRETTO: Interfaccia ExtraExpense con campo category
export interface ExtraExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: 'ordinaria' | 'straordinaria'; // ✅ AGGIUNTO
}

// Valori di default per PropertyData
export const defaultPropertyData: PropertyData = {
  condominiumName: '',
  address: '',
  fiscalCode: '',
  comuneName: 'Milano',
  
  adminName: '',
  adminPhone: '',
  adminMobile: '',
  adminEmail: '',
  adminPec: '',
  adminFiscalCode: '',
  adminVat: '',
  adminRea: '',
  adminAddress: '',

  bankName: '',
  bankIban: '',

  tenantName: '',
  rentalType: 'Transitorio',
  startDate: '',
  endDate: '',
  monthlyRent: 0,
  condominiumFees: 0,
  cedolareSeccaYear: 'primo',
  registrationNumber: '',
  registrationDate: '',
  depositoCauzionale: '',

  mainCategory: 'A/2',
  mainRendita: 0,
  mainMq: 0,  // ✅ DEFAULT AGGIUNTO
  mainSezioneUrbana: '',
  mainFoglio: '',
  mainParticella: '',
  mainSubalterno: '',

  pertinenzaCategory: 'C/6',
  pertinenzaRendita: 0,
  pertinenzaMq: 0,  // ✅ DEFAULT AGGIUNTO
  pertinenzaSezioneUrbana: '',
  pertinenzaFoglio: '',
  pertinenzaParticella: '',
  pertinenzaSubalterno: '',

  imuAliquota: 10.6,

  contatoreGas: '',
  contatoreLuce: '',
  contatoreAcqua: '',

  scheduledItems: [],
  inventory: []
};

// ===== FUNZIONI DI CALCOLO =====

// Funzione calcolo IMU
export function calculateIMU(
  mainRendita: number,
  pertinenzaRendita: number = 0,
  aliquota: number = 10.6
): number {
  const totaleRendita = (mainRendita || 0) + (pertinenzaRendita || 0);
  if (totaleRendita <= 0) return 0;

  const baseImponibile = totaleRendita * 1.05 * 160;
  return Math.round(baseImponibile * (aliquota / 1000) * 100) / 100;
}

// Calcola giorni rimanenti alla scadenza contratto
export function calculateRemainingDays(endDate: string): number {
  if (!endDate) return 0;

  try {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
}

// Calcola progresso contratto (percentuale)
export function calculateProgress(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    const totalDays = end.getTime() - start.getTime();
    const elapsedDays = today.getTime() - start.getTime();

    if (totalDays <= 0) return 0;

    const progress = (elapsedDays / totalDays) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  } catch {
    return 0;
  }
}

// Logica Cedolare Secca
export interface CedolareSeccaResult {
  acconto1: { amount: number; dueDate: string; description: string } | null;
  acconto2: { amount: number; dueDate: string; description: string } | null;
  saldo: { amount: number; dueDate: string; description: string };
  totalYear: number;
}

export function calculateCedolareSeccaLogic(
  monthlyRent: number,
  cedolareSeccaYear: 'primo' | 'secondo' | 'terzo_plus',
  startDate?: string
): CedolareSeccaResult {
  const annualRent = monthlyRent * 12;
  const taxRate = 0.21;
  const totalTax = Math.round(annualRent * taxRate * 100) / 100;

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  switch (cedolareSeccaYear) {
    case 'primo':
      return {
        acconto1: null,
        acconto2: null,
        saldo: {
          amount: totalTax,
          dueDate: `${nextYear}-06-30`,
          description: `Saldo cedolare secca ${currentYear} (primo anno)`
        },
        totalYear: totalTax
      };

    case 'secondo':
      return {
        acconto1: null,
        acconto2: null,
        saldo: {
          amount: totalTax,
          dueDate: `${currentYear}-06-30`,
          description: `Saldo cedolare secca ${currentYear - 1}`
        },
        totalYear: totalTax
      };

    case 'terzo_plus':
    default:
      const acconto1Amount = Math.round(totalTax * 0.4 * 100) / 100;
      const acconto2Amount = Math.round(totalTax * 0.6 * 100) / 100;

      return {
        acconto1: {
          amount: acconto1Amount,
          dueDate: `${currentYear}-06-30`,
          description: `1° Acconto cedolare secca ${currentYear} (40%)`
        },
        acconto2: {
          amount: acconto2Amount,
          dueDate: `${currentYear}-11-30`,
          description: `2° Acconto cedolare secca ${currentYear} (60%)`
        },
        saldo: {
          amount: 0,
          dueDate: `${nextYear}-06-30`,
          description: `Eventuale saldo cedolare secca ${currentYear}`
        },
        totalYear: acconto1Amount + acconto2Amount
      };
  }
}
