import { useProperty } from '@/contexts/PropertyContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { calculateRemainingDays, calculateProgress } from '@/types/property';
import { Building2, Calendar, Euro, User, MapPin, Phone, Clock, FileText, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { property } = useProperty();

  if (!property) {
    return (
      <PageLayout title="Dashboard" subtitle="STATO">
        <div className="p-10 text-center">
          <button 
            onClick={() => window.location.href='/dati'} 
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
          >
            Configura Immobile
          </button>
        </div>
      </PageLayout>
    );
  }

  const daysLeft = calculateRemainingDays(property.endDate);
  const progress = calculateProgress(property.startDate, property.endDate);
  const monthlyRent = property.monthlyRent || 0;
  const contractProgress = Math.round(progress);

  return (
    <PageLayout title="Dashboard" subtitle="STATO IMMOBILIARE">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        
        {/* Card Riepilogo Finanziario */}
        <div className="finance-header">
          <div className="flex items-center gap-2 mb-3 opacity-90">
            <TrendingUp className="w-4 h-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Riepilogo Finanziario
            </p>
          </div>
          <h2 className="text-sm uppercase tracking-wide mb-4 opacity-80">
            ESERCIZIO {new Date().getFullYear()}
          </h2>
          
          {/* Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tempo Rimanente */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Clock className="w-3 h-3" />
                <p className="text-[9px] uppercase tracking-wider">Tempo Rimanente</p>
              </div>
              <p className="text-2xl font-bold">{daysLeft} GG</p>
              <p className="text-[10px] opacity-70 mt-1">Al termine contratto</p>
            </div>

            {/* Stato Incasso */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <FileText className="w-3 h-3" />
                <p className="text-[9px] uppercase tracking-wider">Stato Incasso</p>
              </div>
              <p className="text-lg font-bold italic">In attesa</p>
              <p className="text-[10px] opacity-70 mt-1">Mese corrente</p>
            </div>

            {/* Scadenziario */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Calendar className="w-3 h-3" />
                <p className="text-[9px] uppercase tracking-wider">Scadenziario</p>
              </div>
              <p className="text-lg font-bold italic">Attivo</p>
              <p className="text-[10px] opacity-70 mt-1">Controllo scadenze</p>
            </div>

            {/* Lordo Mensile */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Euro className="w-3 h-3" />
                <p className="text-[9px] uppercase tracking-wider">Lordo Mensile</p>
              </div>
              <p className="text-2xl font-bold">{monthlyRent.toFixed(2)} €</p>
              <p className="text-[10px] opacity-70 mt-1">Canone base</p>
            </div>
          </div>
        </div>

        {/* Card Patrimonio Immobiliare */}
        <div className="section-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Patrimonio Immobiliare</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">In locazione a:</p>
              <p className="font-bold text-lg">{property.tenantName?.toUpperCase() || 'N/A'}</p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Termine contrattuale</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-bold text-4xl">{property.endDate?.split('-')[2] || '31'}</p>
                  <p className="text-sm text-muted-foreground">
                    {property.endDate ? 
                      new Date(property.endDate).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }).toUpperCase() 
                      : 'OTT 2026'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Regime locativo</p>
                <p className="font-bold italic text-primary">{property.rentalType || 'TRANSITORIO'}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Decorrenza trascorsa</p>
                <p className="font-bold">{contractProgress}%</p>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill bg-primary" 
                  style={{ width: `${contractProgress}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card Scadenziario */}
        <div className="section-card">
          <h3 className="font-bold text-base mb-1">Scadenziario</h3>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">
            Adempimenti e manutenzioni
          </p>

          <div className="space-y-3">
            {property.scheduledItems?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={item.completed}
                  readOnly
                  className="w-5 h-5 rounded border-2" 
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-primary uppercase">
                    {item.type} • {item.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageLayout>
  );
}