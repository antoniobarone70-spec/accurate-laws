import { useState } from 'react';
import { useProperty } from '@/contexts/PropertyContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { calculateIMU, calculateCedolareSeccaLogic } from '@/types/property';
import { ChevronLeft, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export default function Finanze() {
  const { property, monthlyRecords, fiscalPayments, toggleFiscalPaymentPaid } = useProperty();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showYtdDetail, setShowYtdDetail] = useState(false);
  
  // === CALCOLI BASE (usati ovunque) - CON PROTEZIONE NaN ===
  const monthlyRent = property.monthlyRent || 0;
  const annualRent = monthlyRent * 12;
  const condominiumFees = property.condominiumFees || 0;
  
  const imuTotal = calculateIMU(
    property.mainRendita || 0, 
    property.pertinenzaRendita || 0, 
    property.imuAliquota || 0
  ) || 0;
  const imuAcconto = Math.round(imuTotal / 2 * 100) / 100;
  const imuSaldo = imuTotal - imuAcconto;
  const imuMonthly = imuTotal / 12;
  
  // Fix per date vuote
  const startDateValid = property.startDate && !isNaN(new Date(property.startDate).getTime());
  const contractStartYear = startDateValid 
    ? new Date(property.startDate).getFullYear() 
    : currentYear;
  
  const cedolareResult = calculateCedolareSeccaLogic(
    contractStartYear,
    currentYear,
    annualRent,
    21
  ) || { fiscalPayments: [], explanation: '', taxDueThisYear: 0 };
  
  const taxDueThisYear = cedolareResult.taxDueThisYear || 0;
  const cedolareMonthly = taxDueThisYear / 12;
  
  const isFirstYear = property.cedolareSeccaYear === 'primo';
  
  // Totale imposte mensili e annuali
  const totalTaxesMonthly = (imuMonthly || 0) + (cedolareMonthly || 0);
  const totalTaxesAnnual = isFirstYear ? (imuTotal || 0) : (imuTotal || 0) + (taxDueThisYear || 0);
  
  // === CALCOLO NETTO MENSILE (formula unica) ===
  const calculateMonthlyNet = (month: number, year: number): { 
    income: number; 
    condoFees: number; 
    extraOrdinary: number;
    extraStraordinary: number; 
    taxes: number; 
    net: number;
    hasData: boolean;
  } => {
    const record = monthlyRecords.find(r => r.month === month && r.year === year);
    
    const hasRegisteredIncome = record && record.status === 'registrato' && record.rentReceived > 0;
    const hasExpenses = record && record.extraExpenses && record.extraExpenses.length > 0;
    const hasData = hasRegisteredIncome || hasExpenses;

    if (!hasData) {
      return { income: 0, condoFees: 0, extraOrdinary: 0, extraStraordinary: 0, taxes: 0, net: 0, hasData: false };
    }

    const income = hasRegisteredIncome ? (record.rentReceived || 0) : 0;
    const condoFeesValue = hasRegisteredIncome ? condominiumFees : 0;
    
    const extraOrdinary = (record?.extraExpenses || [])
      .filter(e => e.category === 'ordinaria')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const extraStraordinary = (record?.extraExpenses || [])
      .filter(e => (e.category || 'straordinaria') === 'straordinaria')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const taxes = hasRegisteredIncome ? totalTaxesMonthly : 0;
    const net = income - condoFeesValue - extraOrdinary - extraStraordinary - taxes;

    return { 
      income, 
      condoFees: condoFeesValue, 
      extraOrdinary, 
      extraStraordinary, 
      taxes, 
      net: isNaN(net) ? 0 : net, 
      hasData 
    };
  };

  const currentMonthData = calculateMonthlyNet(selectedMonth + 1, selectedYear);

  // === CALCOLO YTD ===
  const calculateYtdData = () => {
    const monthlyDetails: { month: string; net: number; hasData: boolean }[] = [];
    let totalYtd = 0;

    for (let m = 1; m <= selectedMonth + 1; m++) {
      const data = calculateMonthlyNet(m, selectedYear);
      monthlyDetails.push({
        month: MONTHS[m - 1],
        net: data.net,
        hasData: data.hasData
      });
      totalYtd += data.net;
    }

    return { monthlyDetails, totalYtd: isNaN(totalYtd) ? 0 : totalYtd };
  };

  const ytdData = calculateYtdData();

  // === ANALISI DI BILANCIO ANNUALE ===
  const calculateAnnualBilancio = () => {
    let totalIncome = 0;
    let totalCondoFees = 0;
    let totalExtraOrdinary = 0;
    let totalExtraStraordinary = 0;

    monthlyRecords
      .filter(r => r.year === selectedYear)
      .forEach(record => {
        if (record.status === 'registrato' && record.rentReceived > 0) {
          totalIncome += record.rentReceived || 0;
          totalCondoFees += condominiumFees;
        }
        (record.extraExpenses || []).forEach(e => {
          if (e.category === 'ordinaria') {
            totalExtraOrdinary += e.amount || 0;
          } else {
            totalExtraStraordinary += e.amount || 0;
          }
        });
      });

    const totalOrdinaryExpenses = totalCondoFees + totalExtraOrdinary;
    const netAnnual = totalIncome - totalOrdinaryExpenses - totalExtraStraordinary - totalTaxesAnnual;

    return {
      income: totalIncome,
      condoFees: totalCondoFees,
      extraOrdinary: totalExtraOrdinary,
      extraStraordinary: totalExtraStraordinary,
      totalOrdinaryExpenses,
      taxes: totalTaxesAnnual,
      net: isNaN(netAnnual) ? 0 : netAnnual
    };
  };

  const annualBilancio = calculateAnnualBilancio();

  // === SCADENZARIO FISCALE ===
  const annoCompetenzaCedolare = currentYear - 1;
  
  const getFiscalPaid = (id: string) => {
    const payment = fiscalPayments.find(p => p.id === id);
    return payment?.paid || false;
  };
  
  const fiscalSchedule = [
    {
      id: `imu_acconto_${currentYear}`,
      label: `IMU - Acconto anno ${currentYear} (pagamento ${currentYear})`,
      amount: imuAcconto,
      dueDate: `${currentYear}-06-16`,
      paid: getFiscalPaid(`imu_acconto_${currentYear}`)
    },
    ...(!isFirstYear && annoCompetenzaCedolare >= contractStartYear ? [{
      id: `cedolare_saldo_${annoCompetenzaCedolare}`,
      label: `Cedolare Secca - Saldo anno ${annoCompetenzaCedolare} (pagamento ${currentYear})`,
      amount: taxDueThisYear,
      dueDate: `${currentYear}-06-30`,
      paid: getFiscalPaid(`cedolare_saldo_${annoCompetenzaCedolare}`)
    }] : []),
    {
      id: `imu_saldo_${currentYear}`,
      label: `IMU - Saldo anno ${currentYear} (pagamento ${currentYear})`,
      amount: imuSaldo,
      dueDate: `${currentYear}-12-16`,
      paid: getFiscalPaid(`imu_saldo_${currentYear}`)
    }
  ];
  
  const futureCedolare = isFirstYear ? (annualRent * 0.21) : 0;
  
  const totalToPay = fiscalSchedule.filter(f => !f.paid).reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fiscalSchedule.filter(f => f.paid).reduce((sum, f) => sum + (f.amount || 0), 0);
  
  const handleTogglePaid = (id: string, currentPaid: boolean) => {
    toggleFiscalPaymentPaid(id, !currentPaid);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: it });
    } catch {
      return dateString;
    }
  };
  
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };
  
  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Funzione helper per formattare numeri in modo sicuro
  const safeFormat = (value: number): string => {
    if (isNaN(value) || value === null || value === undefined) {
      return '0.00';
    }
    return value.toFixed(2);
  };

  return (
    <PageLayout title="Finanze" subtitle="BILANCIO NETTO">
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Financial Summary Header */}
        <div className="finance-header">
          <h2 className="text-lg font-display font-semibold">Riepilogo Finanziario</h2>
          <p className="text-xs uppercase tracking-wider opacity-80">ESERCIZIO {selectedYear} • PRINCIPIO DI CASSA</p>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xs uppercase tracking-wider opacity-80">LORDO MENSILE</p>
              <p className="text-2xl font-display font-bold italic">
                {currentMonthData.hasData ? `${safeFormat(currentMonthData.income)} €` : '—'}
              </p>
              <p className="text-[10px] opacity-70">{MONTHS[selectedMonth]}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xs uppercase tracking-wider opacity-80">NETTO MENSILE</p>
              <p className={`text-2xl font-display font-bold italic ${currentMonthData.net < 0 ? 'text-red-300' : ''}`}>
                {currentMonthData.hasData ? `${safeFormat(currentMonthData.net)} €` : '—'}
              </p>
              <p className="text-[10px] opacity-70">{MONTHS[selectedMonth]}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xs uppercase tracking-wider opacity-80">IMPOSTE ANNO</p>
              <p className="text-xl font-display font-bold italic">{safeFormat(totalTaxesAnnual)} €</p>
              <p className="text-[10px] opacity-70">
                {isFirstYear 
                  ? `Pagate: IMU | Accantonate: Cedolare ${currentYear + 1}`
                  : 'IMU + Cedolare'
                }
              </p>
            </div>
            <div 
              className="bg-white/20 rounded-xl p-3 text-center border-2 border-white/30 cursor-pointer hover:bg-white/25 transition-colors"
              onClick={() => setShowYtdDetail(true)}
            >
              <p className="text-xs uppercase tracking-wider opacity-80 flex items-center justify-center gap-1">
                NETTO REALE AD OGGI <Info className="w-3 h-3" />
              </p>
              <p className="text-[9px] opacity-60 mt-0.5">Somma dei netti mensili</p>
              <p className={`text-2xl font-display font-bold italic ${ytdData.totalYtd < 0 ? 'text-red-300' : ''}`}>
                {safeFormat(ytdData.totalYtd)} €
              </p>
              <p className="text-[10px] opacity-70">Gen - {MONTHS[selectedMonth]}</p>
            </div>
          </div>
        </div>

        {/* Analisi di Bilancio */}
        <div className="section-card">
          <h2 className="section-title">Analisi di Bilancio</h2>
          <p className="section-subtitle">RIEPILOGO ANNUALE {selectedYear} • PRINCIPIO DI CASSA</p>
          
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-success font-medium">Entrate Registrate</p>
                <p className="text-xs text-muted-foreground">Bonifici ricevuti</p>
              </div>
              <p className="text-xl font-display font-bold italic">{safeFormat(annualBilancio.income)} €</p>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-destructive font-medium">Spese Condominiali</p>
                <p className="text-xs text-muted-foreground">Quote mensili</p>
              </div>
              <p className="text-xl font-display font-bold italic">-{safeFormat(annualBilancio.condoFees)} €</p>
            </div>
            
            {annualBilancio.extraOrdinary > 0 && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-destructive font-medium">Spese Ordinarie Extra</p>
                  <p className="text-xs text-muted-foreground">Manutenzione ordinaria</p>
                </div>
                <p className="text-xl font-display font-bold italic">-{safeFormat(annualBilancio.extraOrdinary)} €</p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-destructive font-medium">Spese Straordinarie</p>
                <p className="text-xs text-muted-foreground">Lavori straordinari</p>
              </div>
              <p className="text-xl font-display font-bold italic">-{safeFormat(annualBilancio.extraStraordinary)} €</p>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-destructive font-medium">Imposte</p>
                <p className="text-xs text-muted-foreground">
                  {isFirstYear ? 'Solo IMU (Cedolare a saldo anno successivo)' : 'IMU + Cedolare Secca'}
                </p>
              </div>
              <p className="text-xl font-display font-bold italic">-{safeFormat(totalTaxesAnnual)} €</p>
            </div>
            
            <div className="border-t border-border pt-4 flex justify-between items-center">
              <p className="text-success font-bold uppercase">UTILE NETTO ANNUALE</p>
              <p className={`text-2xl font-display font-bold italic ${annualBilancio.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                {safeFormat(annualBilancio.net)} €
              </p>
            </div>
          </div>
          
          {isFirstYear && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Primo anno di locazione</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Per legge, nel primo anno di locazione non sono dovuti acconti sulla cedolare secca. 
                    L'imposta (€{safeFormat(futureCedolare)}) verrà versata a SALDO nell'anno {currentYear + 1}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Extract */}
        <div className="section-card">
          <h2 className="section-title font-display italic">Estratto Mensile</h2>
          <p className="section-subtitle">PRINCIPIO DI CASSA</p>
          
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-xl font-bold uppercase">{MONTHS[selectedMonth]}</p>
              <p className="text-sm text-muted-foreground">{selectedYear}</p>
            </div>
            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 space-y-3">
            {currentMonthData.hasData ? (
              <>
                <p className="text-xs uppercase tracking-wider text-success font-medium">ENTRATE</p>
                
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Bonifico Ricevuto</span>
                  <span className="text-success font-semibold">+{safeFormat(currentMonthData.income)} €</span>
                </div>
                
                {currentMonthData.condoFees > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Spese Condominiali</span>
                    <span className="text-destructive">-{safeFormat(currentMonthData.condoFees)} €</span>
                  </div>
                )}
                
                {currentMonthData.extraOrdinary > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Spese Ordinarie Extra</span>
                    <span className="text-destructive">-{safeFormat(currentMonthData.extraOrdinary)} €</span>
                  </div>
                )}
                
                {currentMonthData.extraStraordinary > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Spese Straordinarie</span>
                    <span className="text-destructive">-{safeFormat(currentMonthData.extraStraordinary)} €</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Imposte (quota mensile)</span>
                  <span className="text-destructive">-{safeFormat(currentMonthData.taxes)} €</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs uppercase tracking-wider text-success font-medium">UTILE NETTO MENSILE</span>
                  <span className={`text-2xl font-display font-bold italic ${currentMonthData.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {safeFormat(currentMonthData.net)} €
                  </span>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Nessun movimento registrato</p>
                <p className="text-xs text-muted-foreground mt-1">Vai in Registro per inserire gli incassi</p>
              </div>
            )}
          </div>
        </div>

        {/* Fiscal Schedule */}
        <div className="section-card">
          <h2 className="section-title font-display italic">Scadenzario Fiscale</h2>
          <p className="section-subtitle">SCADENZE {currentYear}</p>
          
          <div className="mt-4 space-y-3">
            {fiscalSchedule.map(item => (
              <div key={item.id} className="fiscal-item">
                <button
                  onClick={() => handleTogglePaid(item.id, item.paid)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors flex items-center justify-center cursor-pointer ${
                    item.paid 
                      ? 'bg-success border-success hover:bg-success/80' 
                      : 'border-muted-foreground hover:border-primary hover:bg-primary/10'
                  }`}
                >
                  {item.paid && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold italic">{safeFormat(item.amount)} €</p>
                  <p className={`text-[10px] uppercase ${item.paid ? 'text-success' : 'text-destructive'}`}>
                    {item.paid ? 'PAGATO' : 'DA PAGARE'}
                  </p>
                </div>
              </div>
            ))}
            
            {isFirstYear && (
              <div className="fiscal-item bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-blue-900 dark:text-blue-200">Cedolare Secca - Saldo anno {contractStartYear} (pagamento {currentYear + 1})</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Da versare nel {currentYear + 1}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold italic text-blue-900 dark:text-blue-200">{safeFormat(futureCedolare)} €</p>
                  <p className="text-[10px] uppercase text-blue-600 dark:text-blue-400">FUTURO</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Totale da pagare</span>
              <span className="text-lg font-bold text-destructive">{safeFormat(totalToPay)} €</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-success">Già pagato</span>
              <span className="text-lg font-bold text-success">{safeFormat(totalPaid)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* YTD Detail Modal */}
      <Dialog open={showYtdDetail} onOpenChange={setShowYtdDetail}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Netto Reale ad Oggi</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Somma dei netti mensili da Gennaio a {MONTHS[selectedMonth]} {selectedYear}
            </p>
            {ytdData.monthlyDetails.map((item, index) => (
              <div 
                key={index}
                className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                  item.hasData ? 'bg-muted/50' : 'bg-transparent'
                }`}
              >
                <span className={item.hasData ? 'font-medium' : 'text-muted-foreground'}>
                  {item.month}
                </span>
                <span className={`font-semibold ${
                  !item.hasData ? 'text-muted-foreground' : 
                  item.net >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {item.hasData ? `€${safeFormat(item.net)}` : '—'}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 px-3 mt-4 bg-primary/10 rounded-lg border border-primary/20">
              <span className="font-bold">Totale</span>
              <span className={`font-bold text-lg ${ytdData.totalYtd >= 0 ? 'text-success' : 'text-destructive'}`}>
                €{safeFormat(ytdData.totalYtd)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}