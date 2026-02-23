import { useState } from 'react';
import { useProperty } from '@/contexts/PropertyContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { AddScheduledItemModal } from '@/components/modals/AddScheduledItemModal';
import { calculateIMU } from '@/types/property';
import { Plus, Trash2, Download, Upload, Calendar, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import BackupRestore from '@/components/BackupRestore';

type TabType = 'immobile' | 'contratto' | 'catasto' | 'inventario';

const TABS: { key: TabType; label: string }[] = [
  { key: 'immobile', label: 'IMMOBILE' },
  { key: 'contratto', label: 'CONTRATTO' },
  { key: 'catasto', label: 'CATASTO' },
  { key: 'inventario', label: 'INVENTARIO' },
];

const CEDOLARE_OPTIONS = [
  { value: 'primo', label: 'Primo Anno (saldo 100% anno succ.)' },
  { value: 'secondo', label: 'Secondo Anno (solo saldo)' },
  { value: 'terzo_plus', label: 'Terzo Anno+ (acconti + saldo)' },
];

export default function Dati() {
  const { 
    property, 
    updateProperty, 
    addScheduledItem, 
    removeScheduledItem, 
    addInventoryRoom, 
    removeInventoryRoom,
    exportData,
    importData
  } = useProperty();
  
  const [activeTab, setActiveTab] = useState<TabType>('immobile');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [scheduledModalOpen, setScheduledModalOpen] = useState(false);
  
  const imuTotal = calculateIMU(property.mainRendita, property.pertinenzaRendita, property.imuAliquota);
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMM yyyy', { locale: it });
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-immobile-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          if (importData(data)) {
            alert('Dati ripristinati con successo!');
          } else {
            alert('Errore nel ripristino dei dati');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetData = () => {
    if (confirm('Sei sicuro di voler azzerare tutti i dati? Questa operazione non può essere annullata.')) {
      localStorage.removeItem('propertyData');
      localStorage.removeItem('monthlyRecords');
      localStorage.removeItem('fiscalPayments');
      window.location.reload();
    }
  };

  const handleAddRoom = () => {
    if (newRoomName && newRoomDescription) {
      addInventoryRoom({
        name: newRoomName.toUpperCase(),
        description: newRoomDescription
      });
      setNewRoomName('');
      setNewRoomDescription('');
    }
  };

  const handleRenditaChange = (field: 'mainRendita' | 'pertinenzaRendita', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateProperty({ [field]: numValue });
  };

  return (
    <PageLayout title="Gestione" subtitle="ANAGRAFICA">
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-pill whitespace-nowrap ${
                activeTab === tab.key ? 'tab-pill-active' : 'tab-pill-inactive'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* IMMOBILE Tab */}
        {activeTab === 'immobile' && (
          <div className="space-y-4 animate-fade-in">
            {/* Condominio */}
            <div className="section-card">
              <h2 className="section-title">Condominio</h2>
              <p className="section-subtitle">ANAGRAFICA GENERALE</p>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    NOME COMPLESSO
                  </label>
                  <input
                    type="text"
                    value={property.condominiumName}
                    onChange={(e) => updateProperty({ condominiumName: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    INDIRIZZO COMPLETO
                  </label>
                  <input
                    type="text"
                    value={property.address}
                    onChange={(e) => updateProperty({ address: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    CODICE FISCALE ENTE
                  </label>
                  <input
                    type="text"
                    value={property.fiscalCode}
                    onChange={(e) => updateProperty({ fiscalCode: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Scadenziario */}
            <div className="section-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="section-title font-display italic">Scadenziario & Alert</h2>
                  <p className="section-subtitle">PIANIFICAZIONE NOTIFICHE</p>
                </div>
                <button 
                  onClick={() => setScheduledModalOpen(true)}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              
              <div className="mt-4 space-y-2">
                {property.scheduledItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs">
                          <span className={item.type === 'fiscale' ? 'text-urgent' : 'text-muted-foreground'}>
                            {item.type.toUpperCase()}
                          </span>
                          {' • '}
                          <span className="text-muted-foreground">{formatDate(item.date)}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeScheduledItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Amministratore */}
            <div className="section-card">
              <h2 className="section-title font-display italic">Amministratore</h2>
              <p className="section-subtitle">ANAGRAFICA STUDIO</p>
              
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    RAGIONE SOCIALE / NOME
                  </label>
                  <input
                    type="text"
                    value={property.adminName}
                    onChange={(e) => updateProperty({ adminName: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    TELEFONO STUDIO
                  </label>
                  <input
                    type="tel"
                    value={property.adminPhone}
                    onChange={(e) => updateProperty({ adminPhone: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-primary font-medium">
                    CELLULARE URGENZE
                  </label>
                  <input
                    type="tel"
                    value={property.adminMobile}
                    onChange={(e) => updateProperty({ adminMobile: e.target.value })}
                    className="input-field w-full mt-1 text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    EMAIL ORDINARIA
                  </label>
                  <input
                    type="email"
                    value={property.adminEmail}
                    onChange={(e) => updateProperty({ adminEmail: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    EMAIL PEC
                  </label>
                  <input
                    type="email"
                    value={property.adminPec}
                    onChange={(e) => updateProperty({ adminPec: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      CODICE FISCALE
                    </label>
                    <input
                      type="text"
                      value={property.adminFiscalCode}
                      onChange={(e) => updateProperty({ adminFiscalCode: e.target.value })}
                      className="input-field w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      PARTITA IVA
                    </label>
                    <input
                      type="text"
                      value={property.adminVat}
                      onChange={(e) => updateProperty({ adminVat: e.target.value })}
                      className="input-field w-full mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    NR. REA / ISCRIZIONE
                  </label>
                  <input
                    type="text"
                    value={property.adminRea}
                    onChange={(e) => updateProperty({ adminRea: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    SEDE OPERATIVA
                  </label>
                  <input
                    type="text"
                    value={property.adminAddress}
                    onChange={(e) => updateProperty({ adminAddress: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Coordinate Bancarie */}
            <div className="section-card">
              <h2 className="section-title font-display italic">Coordinate Bancarie</h2>
              <p className="section-subtitle">DATI AMMINISTRATORE</p>
              
              <div className="mt-3 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  RATE CONDOMINIALI
                  <span className="text-[10px] opacity-70">Utilizzare per versamenti</span>
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    ISTITUTO BANCARIO
                  </label>
                  <input
                    type="text"
                    value={property.bankName}
                    onChange={(e) => updateProperty({ bankName: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    IBAN AMMINISTRATORE
                  </label>
                  <input
                    type="text"
                    value={property.bankIban}
                    onChange={(e) => updateProperty({ bankIban: e.target.value })}
                    className="input-field w-full mt-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Backup */}
            <div className="section-card">
              <h2 className="section-title">Backup Dati</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Salva i tuoi dati per evitare di perderli se svuoti la cache.
              </p>
              
              <BackupRestore />
            </div>

            {/* Reset */}
            <div className="section-card border-destructive/30">
              <h2 className="section-title text-destructive">Azzera Dati</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Riporta l'app allo stato iniziale. Utile se i dati sono corrotti.
              </p>
              
              <div className="mt-4">
                <button
                  onClick={handleResetData}
                  className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-3 rounded-xl font-medium hover:bg-destructive/90 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  AZZERA TUTTO
                </button>
              </div>
            </div>

            <AddScheduledItemModal
              open={scheduledModalOpen}
              onClose={() => setScheduledModalOpen(false)}
              onSave={addScheduledItem}
            />
          </div>
        )}

        {/* CONTRATTO Tab */}
        {activeTab === 'contratto' && (
          <div className="space-y-4 animate-fade-in">
            <div className="section-card">
              <h2 className="section-title">Locazione</h2>
              <p className="section-subtitle">ASSETTO CONTRATTUALE</p>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    NOMINATIVO INQUILINO
                  </label>
                  <input
                    type="text"
                    value={property.tenantName}
                    onChange={(e) => updateProperty({ tenantName: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    REGIME DI LOCAZIONE
                  </label>
                  <select
                    value={property.rentalType}
                    onChange={(e) => updateProperty({ rentalType: e.target.value as any })}
                    className="input-field w-full mt-1"
                  >
                    <option value="Transitorio">Transitorio</option>
                    <option value="Ordinario">Ordinario 4+4</option>
                    <option value="Studenti">Studenti</option>
                    <option value="Concordato">Concordato</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      DATA DECORRENZA
                    </label>
                    <input
                      type="date"
                      value={property.startDate}
                      onChange={(e) => updateProperty({ startDate: e.target.value })}
                      className="input-field w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      DATA SCADENZA
                    </label>
                    <input
                      type="date"
                      value={property.endDate}
                      onChange={(e) => updateProperty({ endDate: e.target.value })}
                      className="input-field w-full mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    DEPOSITO CAUZIONALE
                  </label>
                  <input
                    type="text"
                    value={property.depositoCauzionale}
                    onChange={(e) => updateProperty({ depositoCauzionale: e.target.value })}
                    placeholder="Es: €1.350 (3 mensilità)"
                    className="input-field w-full mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      CANONE (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={property.monthlyRent}
                      onChange={(e) => updateProperty({ monthlyRent: parseFloat(e.target.value) || 0 })}
                      className="input-field w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      SPESE COND. (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={property.condominiumFees}
                      onChange={(e) => updateProperty({ condominiumFees: parseFloat(e.target.value) || 0 })}
                      className="input-field w-full mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    REGIME CEDOLARE SECCA
                  </label>
                  <select
                    value={property.cedolareSeccaYear}
                    onChange={(e) => updateProperty({ cedolareSeccaYear: e.target.value as any })}
                    className="input-field w-full mt-1"
                  >
                    {CEDOLARE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="section-card">
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-3">
                REGISTRAZIONE AGENZIA ENTRATE
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    N. REGISTRAZIONE
                  </label>
                  <input
                    type="text"
                    value={property.registrationNumber}
                    onChange={(e) => updateProperty({ registrationNumber: e.target.value })}
                    placeholder="Es: T12345"
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    DATA REGISTRAZIONE
                  </label>
                  <input
                    type="date"
                    value={property.registrationDate}
                    onChange={(e) => updateProperty({ registrationDate: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CATASTO Tab */}
        {activeTab === 'catasto' && (
          <div className="space-y-4 animate-fade-in">
            {/* Unità Principale */}
            <div className="section-card">
              <h2 className="section-title">Unità Principale</h2>
              <p className="section-subtitle">IDENTIFICATIVI FISCALI</p>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    CATEGORIA
                  </label>
                  <input
                    type="text"
                    value={property.mainCategory}
                    onChange={(e) => updateProperty({ mainCategory: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    RENDITA (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={property.mainRendita}
                    onChange={(e) => handleRenditaChange('mainRendita', e.target.value)}
                    className="input-field w-full mt-1 text-primary"
                  />
                </div>
              </div>

              {/* ✅ NUOVO CAMPO MQ - UNITÀ PRINCIPALE */}
              <div className="mt-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  SUPERFICIE (MQ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={property.mainMq || ''}
                  onChange={(e) => updateProperty({ mainMq: parseFloat(e.target.value) || 0 })}
                  placeholder="Es. 85"
                  className="input-field w-full mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Campo informativo - Superficie in metri quadrati
                </p>
              </div>
              
              <div className="mt-4 p-4 bg-muted rounded-xl">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  DATI PER CERTIFICAZIONE
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">SEZ. URBANA</label>
                    <input
                      type="text"
                      value={property.mainSezioneUrbana}
                      onChange={(e) => updateProperty({ mainSezioneUrbana: e.target.value })}
                      className="input-field w-full mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">FOGLIO</label>
                    <input
                      type="text"
                      value={property.mainFoglio}
                      onChange={(e) => updateProperty({ mainFoglio: e.target.value })}
                      className="input-field w-full mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">PARTICELLA</label>
                    <input
                      type="text"
                      value={property.mainParticella}
                      onChange={(e) => updateProperty({ mainParticella: e.target.value })}
                      className="input-field w-full mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">SUBALTERNO</label>
                    <input
                      type="text"
                      value={property.mainSubalterno}
                      onChange={(e) => updateProperty({ mainSubalterno: e.target.value })}
                      className="input-field w-full mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pertinenza */}
            <div className="section-card">
              <h2 className="section-title">Pertinenza / Box</h2>
              <p className="section-subtitle">IDENTIFICATIVI FISCALI</p>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    CATEGORIA
                  </label>
                  <input
                    type="text"
                    value={property.pertinenzaCategory}
                    onChange={(e) => updateProperty({ pertinenzaCategory: e.target.value })}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    RENDITA (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={property.pertinenzaRendita}
                    onChange={(e) => handleRenditaChange('pertinenzaRendita', e.target.value)}
                    className="input-field w-full mt-1 text-primary"
                  />
                </div>
              </div>

              {/* ✅ NUOVO CAMPO MQ - PERTINENZA/BOX */}
              <div className="mt-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  SUPERFICIE (MQ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={property.pertinenzaMq || ''}
                  onChange={(e) => updateProperty({ pertinenzaMq: parseFloat(e.target.value) || 0 })}
                  placeholder="Es. 15"
                  className="input-field w-full mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Campo informativo - Superficie in metri quadrati
                </p>
              </div>
              
              <div className="mt-4 p-4 bg-muted rounded-xl">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  DATI PER CERTIFICAZIONE
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">SEZ. URBANA</label>
                    <input
                      type="text"
                      value={property.pertinenzaSezioneUrbana}
                      onChange={(e) => updateProperty({ pertinenzaSezioneUrbana: e.target.value })}
                      className="input-field w-full mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">FOGLIO</label>
                    <input
                      type="text"
                      value={property.pertinenzaFoglio}
                      onChange={(e) => updateProperty({ pertinenzaFoglio: e.target.value })}
                      className="input-field w-full mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">PARTICELLA</label>
                    <input
                      type="text"
                      value={property.pertinenzaParticella}
                      onChange={(e) => updateProperty({ pertinenzaParticella: e.target.value })}
                      className="input-field w-full mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">SUBALTERNO</label>
                    <input
                      type="text"
                      value={property.pertinenzaSubalterno}
                      onChange={(e) => updateProperty({ pertinenzaSubalterno: e.target.value })}
                      className="input-field w-full mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parametri IMU */}
            <div className="section-card bg-destructive/5 border-destructive/20">
              <h2 className="section-title text-destructive font-display italic">Parametri IMU</h2>
              <p className="section-subtitle text-destructive/70">COMUNE {property.comuneName.toUpperCase()}</p>
              
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-destructive font-medium">ALIQUOTA (PER MILLE)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={property.imuAliquota}
                    onChange={(e) => updateProperty({ imuAliquota: parseFloat(e.target.value) || 0 })}
                    className="w-24 text-center bg-white border border-destructive/30 rounded-xl px-3 py-2 text-primary font-semibold"
                  />
                </div>
                
                <p className="text-xs text-destructive/70 mt-3 italic">
                  Formula: (Rendita + 5%) × 160 × Aliquota
                </p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-destructive/20">
                  <span className="text-destructive font-semibold">Totale Calcolato:</span>
                  <span className="text-2xl font-display font-bold text-destructive italic">€{Math.round(imuTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVENTARIO Tab */}
        {activeTab === 'inventario' && (
          <div className="space-y-4 animate-fade-in">
            {/* Contatori */}
            <div className="section-card">
              <h2 className="section-title font-display italic">Letture Contatori</h2>
              <p className="section-subtitle">VALORI INGRESSO / USCITA</p>
              
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    CONTATORE GAS
                  </label>
                  <input
                    type="text"
                    value={property.contatoreGas}
                    onChange={(e) => updateProperty({ contatoreGas: e.target.value })}
                    placeholder="Es: 12345.67"
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    CONTATORE LUCE
                  </label>
                  <input
                    type="text"
                    value={property.contatoreLuce}
                    onChange={(e) => updateProperty({ contatoreLuce: e.target.value })}
                    placeholder="Es: 98765.43"
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    CONTATORE ACQUA
                  </label>
                  <input
                    type="text"
                    value={property.contatoreAcqua}
                    onChange={(e) => updateProperty({ contatoreAcqua: e.target.value })}
                    placeholder="Es: 456.78"
                    className="input-field w-full mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Inventario Arredi */}
            <div className="section-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="section-title font-display italic">Inventario Arredi</h2>
                  <p className="section-subtitle">CENSIMENTO AMBIENTI</p>
                </div>
                <button 
                  onClick={() => {
                    const name = prompt('Nome ambiente (es: CUCINA):');
                    if (name) {
                      const desc = prompt('Descrizione arredi:');
                      if (desc) {
                        addInventoryRoom({ name: name.toUpperCase(), description: desc });
                      }
                    }
                  }}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  AMBIENTE
                </button>
              </div>
              
              <div className="mt-4 space-y-4">
                {property.inventory.map(room => (
                  <div key={room.id} className="p-4 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-primary uppercase tracking-wider">{room.name}</p>
                      <button
                        onClick={() => removeInventoryRoom(room.id)}
                        className="text-destructive text-xs font-medium hover:underline"
                      >
                        RIMUOVI
                      </button>
                    </div>
                    <p className="text-base font-display italic text-muted-foreground mt-2 leading-relaxed">
                      {room.description}
                    </p>
                  </div>
                ))}
                
                {property.inventory.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nessun ambiente registrato
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
