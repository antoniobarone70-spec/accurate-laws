import { useState } from 'react';
import { useProperty } from '@/contexts/PropertyContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { EditIncomeModal } from '@/components/modals/EditIncomeModal';
import { AddExpenseModal } from '@/components/modals/AddExpenseModal';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MonthlyRecord, ExtraExpense } from '@/types/property';

const MONTHS = [
  { key: 1, short: 'GEN', long: 'Gennaio' },
  { key: 2, short: 'FEB', long: 'Febbraio' },
  { key: 3, short: 'MAR', long: 'Marzo' },
  { key: 4, short: 'APR', long: 'Aprile' },
  { key: 5, short: 'MAG', long: 'Maggio' },
  { key: 6, short: 'GIU', long: 'Giugno' },
  { key: 7, short: 'LUG', long: 'Luglio' },
  { key: 8, short: 'AGO', long: 'Agosto' },
  { key: 9, short: 'SET', long: 'Settembre' },
  { key: 10, short: 'OTT', long: 'Ottobre' },
  { key: 11, short: 'NOV', long: 'Novembre' },
  { key: 12, short: 'DIC', long: 'Dicembre' },
];

export default function Registro() {
  const { property, monthlyRecords, updateMonthlyRecord, addExpenseToMonth, removeExpenseFromMonth } = useProperty();
  const currentYear = new Date().getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1;
  });
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  
  const selectedRecord = monthlyRecords.find(
    r => r.month === selectedMonth && r.year === currentYear
  );
  
  const monthName = MONTHS.find(m => m.key === selectedMonth)?.long || '';
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registrato': return 'text-success font-semibold';
      case 'atteso': return 'text-warning font-semibold';
      case 'ritardo': return 'text-destructive font-semibold';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string, rentReceived: number) => {
    if (status === 'registrato' && rentReceived > 0) return 'REGISTRATO';
    if (status === 'atteso') return 'ATTESO';
    if (status === 'ritardo') return 'IN RITARDO';
    return 'NON REGISTRATO';
  };

  const handleSaveIncome = (updates: Partial<MonthlyRecord>) => {
    if (selectedRecord) {
      updateMonthlyRecord(selectedMonth, currentYear, updates);
    }
  };

  const handleAddExpense = (expense: Omit<ExtraExpense, 'id'>) => {
    addExpenseToMonth(selectedMonth, currentYear, expense);
  };

  const handleRemoveExpense = (expenseId: string) => {
    removeExpenseFromMonth(selectedMonth, currentYear, expenseId);
  };

  return (
    <PageLayout title="Registro" subtitle="INCASSI CORRENTI">
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Month Selector */}
        <div className="section-card">
          <h2 className="section-title">Mese</h2>
          <p className="section-subtitle">SELEZIONA PERIODO</p>
          
          <div className="mt-4 grid grid-cols-4 gap-2">
            {MONTHS.map(month => {
              const hasRecord = monthlyRecords.some(
                r => r.month === month.key && r.year === currentYear
              );
              const record = monthlyRecords.find(
                r => r.month === month.key && r.year === currentYear
              );
              const isRegistered = record && record.status === 'registrato' && record.rentReceived > 0;
              
              return (
                <button
                  key={month.key}
                  onClick={() => setSelectedMonth(month.key)}
                  disabled={!hasRecord}
                  className={`month-btn ${
                    selectedMonth === month.key
                      ? 'month-btn-active'
                      : hasRecord
                        ? isRegistered 
                          ? 'month-btn-inactive bg-success/20 border-success/50'
                          : 'month-btn-inactive'
                        : 'month-btn-inactive opacity-50 cursor-not-allowed'
                  }`}
                >
                  {month.short}
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly Income Card */}
        {selectedRecord ? (
          <div className="section-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Incasso {monthName}</h2>
                <p className="section-subtitle">RIEPILOGO BONIFICO</p>
              </div>
              <button 
                onClick={() => setEditModalOpen(true)}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-primary" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Affitto + Spese</span>
                <span className={`text-xl font-bold ${selectedRecord.rentReceived > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                  {selectedRecord.rentReceived > 0 ? `€${selectedRecord.rentReceived.toFixed(2)}` : 'Non registrato'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Stato</span>
                <span className={getStatusColor(selectedRecord.status)}>
                  {getStatusLabel(selectedRecord.status, selectedRecord.rentReceived)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Ricevuto il</span>
                <span className="font-semibold">{formatDate(selectedRecord.receivedDate)}</span>
              </div>

              {selectedRecord.rentReceived === 0 && (
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-center">
                  <p className="text-sm text-warning-foreground">
                    Clicca sul pulsante <Edit3 className="w-3 h-3 inline" /> per registrare l'incasso
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="section-card">
            <p className="text-center text-muted-foreground py-8">
              Nessun record per questo mese
            </p>
          </div>
        )}

        {/* Extra Expenses */}
        <div className="section-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">Spese Extra</h2>
              <p className="section-subtitle">MANUTENZIONI</p>
            </div>
            <button 
              onClick={() => setExpenseModalOpen(true)}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-5 h-5 text-primary" />
            </button>
          </div>

          <div className="mt-4">
            {selectedRecord?.extraExpenses && selectedRecord.extraExpenses.length > 0 ? (
              <div className="space-y-2">
                {selectedRecord.extraExpenses.map(expense => (
                  <div key={expense.id} className="flex justify-between items-center p-3 bg-muted rounded-xl">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-destructive font-semibold">-€{expense.amount.toFixed(2)}</span>
                      <button 
                        onClick={() => handleRemoveExpense(expense.id)}
                        className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nessuna spesa extra registrata
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditIncomeModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        record={selectedRecord || null}
        monthName={monthName}
        onSave={handleSaveIncome}
      />

      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleAddExpense}
      />
    </PageLayout>
  );
}
