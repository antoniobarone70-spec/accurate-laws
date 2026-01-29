import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PropertyData, MonthlyRecord, FiscalPayment, ScheduledItem, InventoryRoom, ExtraExpense } from '@/types/property';
import { supabase } from '@/Integrations/Supabase/client';

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

// Funzione di conversione DB -> App per property
const dbToAppProperty = (db: any, scheduledItems: ScheduledItem[], inventory: InventoryRoom[]): PropertyData => {
  return {
    id: db.id,
    condominiumName: db.condominium_name || '',
    address: db.address || '',
    fiscalCode: db.fiscal_code || '',
    comuneName: db.comune_name || 'Milano',
    adminName: db.admin_name || '',
    adminPhone: db.admin_phone || '',
    adminMobile: db.admin_mobile || '',
    adminEmail: db.admin_email || '',
    adminPec: db.admin_pec || '',
    adminFiscalCode: db.admin_fiscal_code || '',
    adminVat: db.admin_vat || '',
    adminRea: db.admin_rea || '',
    adminAddress: db.admin_address || '',
    bankName: db.bank_name || '',
    bankIban: db.bank_iban || '',
    tenantName: db.tenant_name || '',
    rentalType: db.rental_type || 'Transitorio',
    startDate: db.start_date || '',
    endDate: db.end_date || '',
    monthlyRent: Number(db.monthly_rent) || 0,
    condominiumFees: Number(db.condominium_fees) || 0,
    cedolareSeccaYear: db.cedolare_secca_year || 'primo',
    registrationNumber: db.registration_number || '',
    registrationDate: db.registration_date || '',
    depositoCauzionale: db.deposito_cauzionale || '',
    mainCategory: db.main_category || 'A/2',
    mainRendita: Number(db.main_rendita) || 0,
    mainMq: Number(db.main_mq) || 0,
    mainSezioneUrbana: db.main_sezione_urbana || '',
    mainFoglio: db.main_foglio || '',
    mainParticella: db.main_particella || '',
    mainSubalterno: db.main_subalterno || '',
    pertinenzaCategory: db.pertinenza_category || 'C/6',
    pertinenzaRendita: Number(db.pertinenza_rendita) || 0,
    pertinenzaMq: Number(db.pertinenza_mq) || 0,
    pertinenzaSezioneUrbana: db.pertinenza_sezione_urbana || '',
    pertinenzaFoglio: db.pertinenza_foglio || '',
    pertinenzaParticella: db.pertinenza_particella || '',
    pertinenzaSubalterno: db.pertinenza_subalterno || '',
    imuAliquota: Number(db.imu_aliquota) || 10.6,
    contatoreGas: db.contatore_gas || '',
    contatoreLuce: db.contatore_luce || '',
    contatoreAcqua: db.contatore_acqua || '',
    scheduledItems: scheduledItems,
    inventory: inventory
  };
};

// Funzione di conversione App -> DB per property
const appToDbProperty = (app: PropertyData): any => {
  return {
    condominium_name: app.condominiumName,
    address: app.address,
    fiscal_code: app.fiscalCode,
    comune_name: app.comuneName,
    admin_name: app.adminName,
    admin_phone: app.adminPhone,
    admin_mobile: app.adminMobile,
    admin_email: app.adminEmail,
    admin_pec: app.adminPec,
    admin_fiscal_code: app.adminFiscalCode,
    admin_vat: app.adminVat,
    admin_rea: app.adminRea,
    admin_address: app.adminAddress,
    bank_name: app.bankName,
    bank_iban: app.bankIban,
    tenant_name: app.tenantName,
    rental_type: app.rentalType,
    start_date: app.startDate || null,
    end_date: app.endDate || null,
    monthly_rent: app.monthlyRent,
    condominium_fees: app.condominiumFees,
    cedolare_secca_year: app.cedolareSeccaYear,
    registration_number: app.registrationNumber,
    registration_date: app.registrationDate || null,
    deposito_cauzionale: app.depositoCauzionale,
    main_category: app.mainCategory,
    main_rendita: app.mainRendita,
    main_mq: app.mainMq,
    main_sezione_urbana: app.mainSezioneUrbana,
    main_foglio: app.mainFoglio,
    main_particella: app.mainParticella,
    main_subalterno: app.mainSubalterno,
    pertinenza_category: app.pertinenzaCategory,
    pertinenza_rendita: app.pertinenzaRendita,
    pertinenza_mq: app.pertinenzaMq,
    pertinenza_sezione_urbana: app.pertinenzaSezioneUrbana,
    pertinenza_foglio: app.pertinenzaFoglio,
    pertinenza_particella: app.pertinenzaParticella,
    pertinenza_subalterno: app.pertinenzaSubalterno,
    imu_aliquota: app.imuAliquota,
    contatore_gas: app.contatoreGas,
    contatore_luce: app.contatoreLuce,
    contatore_acqua: app.contatoreAcqua,
    updated_at: new Date().toISOString()
  };
};

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [property, setProperty] = useState<PropertyData>(defaultProperty);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [fiscalPayments, setFiscalPayments] = useState<FiscalPayment[]>([]);

  // Carica dati da Supabase all'avvio
  useEffect(() => {
    loadFromSupabase();
  }, []);

  const loadFromSupabase = async () => {
    try {
      // Prova a caricare da Supabase
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (properties && properties.length > 0) {
        const dbProperty = properties[0];
        setPropertyId(dbProperty.id);

        // Carica scheduled items
        const { data: scheduledItemsDb } = await supabase
          .from('scheduled_items')
          .select('*')
          .eq('property_id', dbProperty.id);

        // Carica inventory
        const { data: inventoryDb } = await supabase
          .from('inventory_rooms')
          .select('*')
          .eq('property_id', dbProperty.id);

        // Carica monthly records
        const { data: dbMonthlyRecords } = await supabase
          .from('monthly_records')
          .select('*')
          .eq('property_id', dbProperty.id);

        // Carica fiscal payments
        const { data: dbFiscalPayments } = await supabase
          .from('fiscal_payments')
          .select('*')
          .eq('property_id', dbProperty.id);

        // Converti scheduled items dal formato DB al formato App
        // DB usa: task, next_date, status
        // App usa: title, date, completed
        const convertedScheduledItems: ScheduledItem[] = (scheduledItemsDb || []).map(item => ({
          id: item.id,
          title: item.task || '',
          date: item.next_date || '',
          type: item.type || 'altro',
          completed: item.status === 'completed',
          notes: ''
        }));

        // Converti inventory dal formato DB al formato App
        const convertedInventory: InventoryRoom[] = (inventoryDb || []).map(room => ({
          id: room.id,
          name: room.name || '',
          description: room.description || ''
        }));

        const appProperty = dbToAppProperty(
          dbProperty,
          convertedScheduledItems,
          convertedInventory
        );

        setProperty(appProperty);

        if (dbMonthlyRecords && dbMonthlyRecords.length > 0) {
          setMonthlyRecords(dbMonthlyRecords.map(r => ({
            month: r.month,
            year: r.year,
            rentReceived: Number(r.rent_received) || 0,
            condominiumFees: Number(r.condominium_fees) || 0,
            receivedDate: r.received_date,
            status: r.status || 'atteso',
            extraExpenses: r.extra_expenses || []
          })));
        } else {
          setMonthlyRecords(generateMonthlyRecords(
            appProperty.startDate,
            appProperty.endDate,
            appProperty.monthlyRent,
            appProperty.condominiumFees
          ));
        }

        if (dbFiscalPayments) {
          setFiscalPayments(dbFiscalPayments.map(p => ({
            id: p.id,
            type: p.type,
            amount: Number(p.amount),
            dueDate: p.due_date,
            paid: p.paid,
            paidDate: p.paid_date,
            notes: p.notes
          })));
        }

        console.log('✅ Dati caricati da Supabase');
        console.log('📅 Scheduled items:', convertedScheduledItems.length);
        console.log('🏠 Inventory rooms:', convertedInventory.length);
      } else {
        // Nessun dato su Supabase, prova localStorage
        const saved = localStorage.getItem('propertyData');
        if (saved) {
          const localProperty = JSON.parse(saved);
          setProperty(localProperty);
          
          const savedRecords = localStorage.getItem('monthlyRecords');
          if (savedRecords) {
            setMonthlyRecords(JSON.parse(savedRecords));
          } else {
            setMonthlyRecords(generateMonthlyRecords(
              localProperty.startDate,
              localProperty.endDate,
              localProperty.monthlyRent,
              localProperty.condominiumFees
            ));
          }

          const savedPayments = localStorage.getItem('fiscalPayments');
          if (savedPayments) {
            setFiscalPayments(JSON.parse(savedPayments));
          }

          console.log('📁 Dati caricati da localStorage');
        }
      }
    } catch (error) {
      console.error('Errore caricamento Supabase:', error);
      
      // Fallback a localStorage
      const saved = localStorage.getItem('propertyData');
      if (saved) {
        const localProperty = JSON.parse(saved);
        setProperty(localProperty);
        
        const savedRecords = localStorage.getItem('monthlyRecords');
        if (savedRecords) setMonthlyRecords(JSON.parse(savedRecords));
        
        const savedPayments = localStorage.getItem('fiscalPayments');
        if (savedPayments) setFiscalPayments(JSON.parse(savedPayments));
        
        console.log('📁 Fallback a localStorage');
      }
    } finally {
      setLoading(false);
    }
  };

  // Salva su Supabase quando cambiano i dati
  const saveToSupabase = async (newProperty: PropertyData) => {
    try {
      const dbData = appToDbProperty(newProperty);

      if (propertyId) {
        // Update
        await supabase
          .from('properties')
          .update(dbData)
          .eq('id', propertyId);
      } else {
        // Insert
        const { data, error } = await supabase
          .from('properties')
          .insert(dbData)
          .select()
          .single();

        if (data && !error) {
          setPropertyId(data.id);
        }
      }

      // Salva anche su localStorage come backup
      localStorage.setItem('propertyData', JSON.stringify(newProperty));
      
      console.log('💾 Dati salvati su Supabase');
    } catch (error) {
      console.error('Errore salvataggio Supabase:', error);
      // Salva almeno su localStorage
      localStorage.setItem('propertyData', JSON.stringify(newProperty));
    }
  };

  const updateProperty = (updates: Partial<PropertyData>) => {
    setProperty(prev => {
      const newProperty = { ...prev, ...updates };
      saveToSupabase(newProperty);
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
      localStorage.setItem('monthlyRecords', JSON.stringify(newRecords));
      
      // Salva su Supabase se abbiamo propertyId
      if (propertyId) {
        const record = newRecords.find(r => r.month === month && r.year === year);
        if (record) {
          supabase
            .from('monthly_records')
            .upsert({
              property_id: propertyId,
              month: record.month,
              year: record.year,
              rent_received: record.rentReceived,
              condominium_fees: record.condominiumFees,
              received_date: record.receivedDate,
              status: record.status,
              extra_expenses: record.extraExpenses
            }, { onConflict: 'property_id,month,year' })
            .then(() => console.log('📅 Record mensile salvato'));
        }
      }
      
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
      localStorage.setItem('monthlyRecords', JSON.stringify(newRecords));
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
      localStorage.setItem('monthlyRecords', JSON.stringify(newRecords));
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
      
      localStorage.setItem('fiscalPayments', JSON.stringify(newPayments));
      return newPayments;
    });
  };

  const updateFiscalPayment = (id: string, updates: Partial<FiscalPayment>) => {
    setFiscalPayments(prev => {
      const newPayments = prev.map(payment =>
        payment.id === id ? { ...payment, ...updates } : payment
      );
      localStorage.setItem('fiscalPayments', JSON.stringify(newPayments));
      return newPayments;
    });
  };

  const addScheduledItem = async (item: Omit<ScheduledItem, 'id'>) => {
    const newItem: ScheduledItem = {
      ...item,
      id: Date.now().toString()
    };

    // Salva su Supabase con i nomi colonne corretti
    // App usa: title, date, completed
    // DB usa: task, next_date, status
    if (propertyId) {
      try {
        const { data } = await supabase
          .from('scheduled_items')
          .insert({
            property_id: propertyId,
            task: item.title,
            next_date: item.date,
            type: item.type,
            status: item.completed ? 'completed' : 'pending',
            frequency: 'once'
          })
          .select()
          .single();

        if (data) {
          newItem.id = data.id;
        }
      } catch (error) {
        console.error('Errore salvataggio scheduled item:', error);
      }
    }

    setProperty(prev => {
      const newProperty = {
        ...prev,
        scheduledItems: [...prev.scheduledItems, newItem]
      };
      localStorage.setItem('propertyData', JSON.stringify(newProperty));
      return newProperty;
    });
  };

  const removeScheduledItem = async (id: string) => {
    // Rimuovi da Supabase
    if (propertyId) {
      try {
        await supabase
          .from('scheduled_items')
          .delete()
          .eq('id', id);
      } catch (error) {
        console.error('Errore rimozione scheduled item:', error);
      }
    }

    setProperty(prev => {
      const newProperty = {
        ...prev,
        scheduledItems: prev.scheduledItems.filter(item => item.id !== id)
      };
      localStorage.setItem('propertyData', JSON.stringify(newProperty));
      return newProperty;
    });
  };

  const toggleScheduledItem = async (id: string) => {
    const item = property.scheduledItems.find(i => i.id === id);
    if (!item) return;

    const newCompleted = !item.completed;

    // Aggiorna su Supabase con il nome colonna corretto (status invece di completed)
    if (propertyId) {
      try {
        await supabase
          .from('scheduled_items')
          .update({ status: newCompleted ? 'completed' : 'pending' })
          .eq('id', id);
      } catch (error) {
        console.error('Errore toggle scheduled item:', error);
      }
    }

    setProperty(prev => {
      const newProperty = {
        ...prev,
        scheduledItems: prev.scheduledItems.map(item =>
          item.id === id ? { ...item, completed: newCompleted } : item
        )
      };
      localStorage.setItem('propertyData', JSON.stringify(newProperty));
      return newProperty;
    });
  };

  const addInventoryRoom = async (room: Omit<InventoryRoom, 'id'>) => {
    const newRoom: InventoryRoom = {
      ...room,
      id: Date.now().toString()
    };

    // Salva su Supabase
    if (propertyId) {
      try {
        const { data } = await supabase
          .from('inventory_rooms')
          .insert({
            property_id: propertyId,
            name: room.name,
            description: room.description
          })
          .select()
          .single();

        if (data) {
          newRoom.id = data.id;
        }
      } catch (error) {
        console.error('Errore salvataggio inventory room:', error);
      }
    }

    setProperty(prev => {
      const newProperty = {
        ...prev,
        inventory: [...prev.inventory, newRoom]
      };
      localStorage.setItem('propertyData', JSON.stringify(newProperty));
      return newProperty;
    });
  };

  const removeInventoryRoom = async (id: string) => {
    // Rimuovi da Supabase
    if (propertyId) {
      try {
        await supabase
          .from('inventory_rooms')
          .delete()
          .eq('id', id);
      } catch (error) {
        console.error('Errore rimozione inventory room:', error);
      }
    }

    setProperty(prev => {
      const newProperty = {
        ...prev,
        inventory: prev.inventory.filter(room => room.id !== id)
      };
      localStorage.setItem('propertyData', JSON.stringify(newProperty));
      return newProperty;
    });
  };

  const exportData = (): string => {
    return JSON.stringify({
      property,
      monthlyRecords,
      fiscalPayments
    }, null, 2);
  };

  const importData = (data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.property) {
        setProperty(parsed.property);
        saveToSupabase(parsed.property);
      }
      if (parsed.monthlyRecords) {
        setMonthlyRecords(parsed.monthlyRecords);
        localStorage.setItem('monthlyRecords', JSON.stringify(parsed.monthlyRecords));
      }
      if (parsed.fiscalPayments) {
        setFiscalPayments(parsed.fiscalPayments);
        localStorage.setItem('fiscalPayments', JSON.stringify(parsed.fiscalPayments));
      }
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