import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { PropertyProvider } from "./contexts/PropertyContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Registro from "./pages/Registro";
import Finanze from "./pages/Finanze";
import Leggi from "./pages/Leggi";
import Dati from "./pages/Dati";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";
import {
  saveProperty,
  setMonthlyRecords,
  setFiscalPayments,
  getDb,
} from "@/services/localData";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const migrate = async () => {
      const done = localStorage.getItem('MIGRATION_DONE');
      if (done) return;
      try {
        const { data: properties, error } = await supabase
          .from('properties')
          .select('*')
          .limit(1);

        if (error) throw error;

        if (properties && properties.length > 0) {
          const dbProperty = properties[0];
          const { data: scheduledItemsDb } = await supabase
            .from('scheduled_items')
            .select('*')
            .eq('property_id', dbProperty.id);

          const { data: inventoryDb } = await supabase
            .from('inventory_rooms')
            .select('*')
            .eq('property_id', dbProperty.id);

          const { data: dbMonthlyRecords } = await supabase
            .from('monthly_records')
            .select('*')
            .eq('property_id', dbProperty.id);

          const { data: dbFiscalPayments } = await supabase
            .from('fiscal_payments')
            .select('*')
            .eq('property_id', dbProperty.id);

          const scheduledItems = (scheduledItemsDb || []).map((item: any) => ({
            id: item.id,
            title: item.task || item.title || '',
            date: item.next_date || item.date || '',
            type: item.type || 'altro',
            completed: item.status ? item.status === 'completed' : !!item.completed,
            notes: item.notes || '',
          }));

          const inventory = (inventoryDb || []).map((room: any) => ({
            id: room.id,
            name: room.name || '',
            description: room.description || '',
          }));

          const property = {
            id: dbProperty.id,
            condominiumName: dbProperty.condominium_name || '',
            address: dbProperty.address || '',
            fiscalCode: dbProperty.fiscal_code || '',
            comuneName: dbProperty.comune_name || 'Milano',
            adminName: dbProperty.admin_name || '',
            adminPhone: dbProperty.admin_phone || '',
            adminMobile: dbProperty.admin_mobile || '',
            adminEmail: dbProperty.admin_email || '',
            adminPec: dbProperty.admin_pec || '',
            adminFiscalCode: dbProperty.admin_fiscal_code || '',
            adminVat: dbProperty.admin_vat || '',
            adminRea: dbProperty.admin_rea || '',
            adminAddress: dbProperty.admin_address || '',
            bankName: dbProperty.bank_name || '',
            bankIban: dbProperty.bank_iban || '',
            tenantName: dbProperty.tenant_name || '',
            rentalType: dbProperty.rental_type || 'Transitorio',
            startDate: dbProperty.start_date || '',
            endDate: dbProperty.end_date || '',
            monthlyRent: Number(dbProperty.monthly_rent) || 0,
            condominiumFees: Number(dbProperty.condominium_fees) || 0,
            cedolareSeccaYear: dbProperty.cedolare_secca_year || 'primo',
            registrationNumber: dbProperty.registration_number || '',
            registrationDate: dbProperty.registration_date || '',
            depositoCauzionale: dbProperty.deposito_cauzionale || '',
            mainCategory: dbProperty.main_category || 'A/2',
            mainRendita: Number(dbProperty.main_rendita) || 0,
            mainMq: Number(dbProperty.main_mq) || 0,
            mainSezioneUrbana: dbProperty.main_sezione_urbana || '',
            mainFoglio: dbProperty.main_foglio || '',
            mainParticella: dbProperty.main_particella || '',
            mainSubalterno: dbProperty.main_subalterno || '',
            pertinenzaCategory: dbProperty.pertinenza_category || 'C/6',
            pertinenzaRendita: Number(dbProperty.pertinenza_rendita) || 0,
            pertinenzaMq: Number(dbProperty.pertinenza_mq) || 0,
            pertinenzaSezioneUrbana: dbProperty.pertinenza_sezione_urbana || '',
            pertinenzaFoglio: dbProperty.pertinenza_foglio || '',
            pertinenzaParticella: dbProperty.pertinenza_particella || '',
            pertinenzaSubalterno: dbProperty.pertinenza_subalterno || '',
            imuAliquota: Number(dbProperty.imu_aliquota) || 10.6,
            contatoreGas: dbProperty.contatore_gas || '',
            contatoreLuce: dbProperty.contatore_luce || '',
            contatoreAcqua: dbProperty.contatore_acqua || '',
            scheduledItems,
            inventory,
          };

          saveProperty(property);

          const monthlyRecords = (dbMonthlyRecords || []).map((r: any) => ({
            month: r.month,
            year: r.year,
            rentReceived: Number(r.rent_received) || 0,
            condominiumFees: Number(r.condominium_fees) || 0,
            receivedDate: r.received_date || null,
            status: r.status || 'atteso',
            extraExpenses: r.extra_expenses || [],
          }));
          setMonthlyRecords(monthlyRecords);

          const fiscalPayments = (dbFiscalPayments || []).map((p: any) => ({
            id: p.id,
            type: p.type,
            amount: Number(p.amount),
            dueDate: p.due_date,
            paid: p.paid,
            paidDate: p.paid_date,
            notes: p.notes,
            date: p.date || p.due_date || '',
            year: p.year || new Date(p.due_date || Date.now()).getFullYear(),
          }));
          setFiscalPayments(fiscalPayments);
        } else {
          getDb();
        }

        localStorage.setItem('MIGRATION_DONE', 'true');
        // eslint-disable-next-line no-alert
        alert('Migrazione completata: dati salvati in locale');
        // eslint-disable-next-line no-console
        console.log('Migrazione completata: APP_DB inizializzato');
      } catch (e) {
        getDb();
        localStorage.setItem('MIGRATION_DONE', 'true');
        // eslint-disable-next-line no-console
        console.log('Migrazione saltata: Supabase non disponibile, inizializzato APP_DB');
      }
    };
    migrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <PropertyProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/finanze" element={<Finanze />} />
                <Route path="/leggi" element={<Leggi />} />
                <Route path="/dati" element={<Dati />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </PropertyProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
