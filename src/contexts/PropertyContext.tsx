import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PropertyData, MonthlyRecord, FiscalPayment, ScheduledItem, InventoryRoom, ExtraExpense } from '@/types/property';
import {
  getDb,
  getProperty as getLocalProperty,
  saveProperty as saveLocalProperty,
  getMonthlyRecords as getLocalMonthlyRecords,
  setMonthlyRecords as setLocalMonthlyRecords,
  getFiscalPayments as getLocalFiscalPayments,
  setFiscalPayments as setLocalFiscalPayments,
  exportJson,
  importJson,
} from '@/services/localData';

interface PropertyContextType {
  property: PropertyData;
  loading: boolean;
  updateProperty: (updates: Partial<PropertyData>) => void;
  monthlyRecords: MonthlyRecord[];
  updateMonthlyRecord: (month: number, year: number, updates: Partial<MonthlyRecord>) => void;
  addExpenseToMonth: (month: number, year: number, expense: Omit<ExtraExpense, 'id'>) => void;
  removeExpenseFromMonth: (month: number, year: number, expenseId: string) => void;
  fiscalPayments: FiscalPayment[];
  updateFiscalPayment: (id: string, updates: Partial<FiscalPayment>) => void;
  markFiscalPaymentPaid: (id: string) => void;
  toggleFiscalPaymentPaid: (id: string, paid: boolean) => void;
  addScheduledItem: (item: Omit<ScheduledItem, 'id'>) => void;
  removeScheduledItem: (id: string) => void;
  toggleScheduledItem: (id: string) => void;
  addInventoryRoom: (room: Omit<InventoryRoom, 'id'>) => void;
  removeInventoryRoom: (id: string) => void;
  exportData: () => string;
  importData: (data: string) => boolean;
  getTotalRegisteredIncome: () => number;
  getTotalExtraExpenses: () => number;
  getTotalOrdinaryExpenses: () => number;
}

const defaultProperty: PropertyData = {
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
  mainMq: 0,
  mainSezioneUrbana: '',
  mainFoglio: '',
  mainParticella: '',
  mainSubalterno: '',
  pertinenzaCategory: 'C/6',
  pertinenzaRendita: 0,
  pertinenzaMq: 0,
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

const generateMonthlyRecords = (startDate: string, endDate: string, monthlyRent: number, condominiumFees: number): MonthlyRecord[] => {
  const records: MonthlyRecord[] = [];
  if (!startDate || !endDate) return records;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  
  while (current <= endMonth) {
    records.push({
      month: current.getMonth() + 1,
      year: current.getFullYear(),
      rentReceived: 0,
      condominiumFees: condominiumFees,
      receivedDate: null,
      status: 'atteso',
      extraExpenses: []
    });
    current.setMonth(current.getMonth() + 1);
  }
  
  return records;
};

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [property, setProperty] = useState<PropertyData>(defaultProperty);
  const [loading, setLoading] = useState(true);
  
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [fiscalPayments, setFiscalPayments] = useState<FiscalPayment[]>([]);

  useEffect(() => {
    const loadFromLocal = () => {
      try {
        getDb();
        const p = getLocalProperty();
        if (p) {
          setProperty(p);
        } else {
          setProperty(defaultProperty);
        }
        const records = getLocalMonthlyRecords();
        if (records && records.length > 0) {
          setMonthlyRecords(records);
        } else {
          setMonthlyRecords(generateMonthlyRecords(
            (p && p.startDate) || defaultProperty.startDate,
            (p && p.endDate) || defaultProperty.endDate,
            (p && p.monthlyRent) || defaultProperty.monthlyRent,
            (p && p.condominiumFees) || defaultProperty.condominiumFees
          ));
        }
        const payments = getLocalFiscalPayments();
        if (payments) {
          setFiscalPayments(payments);
        }
      } finally {
        setLoading(false);
      }
    };
    loadFromLocal();
  }, []);

  const saveToLocal = (newProperty: PropertyData) => {
    saveLocalProperty(newProperty);
  };

  const updateProperty = (updates: Partial<PropertyData>) => {
    setProperty(prev => {
      const newProperty = { ...prev, ...updates };
      saveToLocal(newProperty);
      return newProperty;
    });
  };

  const updateMonthlyRecord = (month: number, year: number, updates: Partial<MonthlyRecord>) => {
    setMonthlyRecords(prev => {
      const newRecords = prev.map(record => 
        record.month === month && record.year === year
          ? { ...record, ...updates }
          : record
      );
      setLocalMonthlyRecords(newRecords);
      return newRecords;
    });
  };

  const addExpenseToMonth = (month: number, year: number, expense: Omit<ExtraExpense, 'id'>) => {
    const newExpense: ExtraExpense = {
      ...expense,
      id: Date.now().toString()
    };
    setMonthlyRecords(prev => {
      const newRecords = prev.map(record =>
        record.month === month && record.year === year
          ? { ...record, extraExpenses: [...(record.extraExpenses || []), newExpense] }
          : record
      );
      setLocalMonthlyRecords(newRecords);
      return newRecords;
    });
  };

  const removeExpenseFromMonth = (month: number, year: number, expenseId: string) => {
    setMonthlyRecords(prev => {
      const newRecords = prev.map(record =>
        record.month === month && record.year === year
          ? { ...record, extraExpenses: (record.extraExpenses || []).filter(e => e.id !== expenseId) }
          : record
      );
      setLocalMonthlyRecords(newRecords);
      return newRecords;
    });
  };

  const getTotalRegisteredIncome = () => {
    return monthlyRecords
      .filter(r => r.status === 'registrato' && r.rentReceived > 0)
      .reduce((sum, r) => sum + r.rentReceived, 0);
  };

  const getTotalExtraExpenses = () => {
    return monthlyRecords.reduce((sum, r) => 
      sum + (r.extraExpenses || []).filter(e => (e.category || 'straordinaria') === 'straordinaria').reduce((s, e) => s + e.amount, 0), 0
    );
  };

  const getTotalOrdinaryExpenses = () => {
    const condominiumTotal = monthlyRecords
      .filter(r => r.status === 'registrato' && r.rentReceived > 0)
      .reduce((sum, r) => sum + r.condominiumFees, 0);
    
    const extraOrdinaryTotal = monthlyRecords.reduce((sum, r) => 
      sum + (r.extraExpenses || []).filter(e => e.category === 'ordinaria').reduce((s, e) => s + e.amount, 0), 0
    );
    
    return condominiumTotal + extraOrdinaryTotal;
  };

  const markFiscalPaymentPaid = (id: string) => {
    toggleFiscalPaymentPaid(id, true);
  };

  const toggleFiscalPaymentPaid = (id: string, paid: boolean) => {
    setFiscalPayments(prev => {
      const exists = prev.find(p => p.id === id);
      let newPayments;
      
      if (exists) {
        newPayments = prev.map(p => p.id === id ? { ...p, paid, paidDate: paid ? new Date().toISOString() : null } : p);
      } else if (paid) {
        newPayments = [...prev, { id, paid: true, paidDate: new Date().toISOString() } as FiscalPayment];
      } else {
        newPayments = prev;
      }
      
      setLocalFiscalPayments(newPayments);
      return newPayments;
    });
  };

  const updateFiscalPayment = (id: string, updates: Partial<FiscalPayment>) => {
    setFiscalPayments(prev => {
      const newPayments = prev.map(payment =>
        payment.id === id ? { ...payment, ...updates } : payment
      );
      setLocalFiscalPayments(newPayments);
      return newPayments;
    });
  };

  const addScheduledItem = async (item: Omit<ScheduledItem, 'id'>) => {
    const newItem: ScheduledItem = {
      ...item,
      id: Date.now().toString()
    };

    setProperty(prev => {
      const newProperty = {
        ...prev,
        scheduledItems: [...prev.scheduledItems, newItem]
      };
      saveLocalProperty(newProperty);
      return newProperty;
    });
  };

  const removeScheduledItem = async (id: string) => {
    setProperty(prev => {
      const newProperty = {
        ...prev,
        scheduledItems: prev.scheduledItems.filter(item => item.id !== id)
      };
      saveLocalProperty(newProperty);
      return newProperty;
    });
  };

  const toggleScheduledItem = async (id: string) => {
    const item = property.scheduledItems.find(i => i.id === id);
    if (!item) return;

    const newCompleted = !item.completed;

    setProperty(prev => {
      const newProperty = {
        ...prev,
        scheduledItems: prev.scheduledItems.map(item =>
          item.id === id ? { ...item, completed: newCompleted } : item
        )
      };
      saveLocalProperty(newProperty);
      return newProperty;
    });
  };

  const addInventoryRoom = async (room: Omit<InventoryRoom, 'id'>) => {
    const newRoom: InventoryRoom = {
      ...room,
      id: Date.now().toString()
    };

    setProperty(prev => {
      const newProperty = {
        ...prev,
        inventory: [...prev.inventory, newRoom]
      };
      saveLocalProperty(newProperty);
      return newProperty;
    });
  };

  const removeInventoryRoom = async (id: string) => {
    setProperty(prev => {
      const newProperty = {
        ...prev,
        inventory: prev.inventory.filter(room => room.id !== id)
      };
      saveLocalProperty(newProperty);
      return newProperty;
    });
  };

  const exportData = (): string => {
    return exportJson();
  };

  const importData = (data: string): boolean => {
    try {
      const ok = importJson(data);
      if (!ok) return false;
      const p = getLocalProperty();
      if (p) setProperty(p);
      const records = getLocalMonthlyRecords();
      setMonthlyRecords(records);
      const payments = getLocalFiscalPayments();
      setFiscalPayments(payments);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <PropertyContext.Provider value={{
      property,
      loading,
      updateProperty,
      monthlyRecords,
      updateMonthlyRecord,
      addExpenseToMonth,
      removeExpenseFromMonth,
      fiscalPayments,
      updateFiscalPayment,
      markFiscalPaymentPaid,
      toggleFiscalPaymentPaid,
      addScheduledItem,
      removeScheduledItem,
      toggleScheduledItem,
      addInventoryRoom,
      removeInventoryRoom,
      exportData,
      importData,
      getTotalRegisteredIncome,
      getTotalExtraExpenses,
      getTotalOrdinaryExpenses
    }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
}
