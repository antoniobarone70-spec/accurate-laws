import { PageLayout } from '@/components/layout/PageLayout';
import { ExternalLink, ChevronRight, BookOpen, Info } from 'lucide-react';

const LEGAL_LINKS = [
  {
    id: 'condominio',
    title: 'Normativa Condominiale',
    links: [
      {
        article: 'Art. 1117 c.c.',
        title: 'Parti comuni',
        url: 'https://www.brocardi.it/codice-civile/libro-terzo/titolo-vii/capo-ii/art1117.html',
      },
      {
        article: 'Art. 1123 c.c.',
        title: 'Ripartizione spese',
        url: 'https://www.brocardi.it/codice-civile/libro-terzo/titolo-vii/capo-ii/art1123.html',
      },
      {
        article: 'Art. 1130 c.c.',
        title: 'Attribuzioni amministratore',
        url: 'https://www.brocardi.it/codice-civile/libro-terzo/titolo-vii/capo-ii/art1130.html',
      },
      {
        article: 'Art. 63 disp. att. c.c.',
        title: 'Morosità',
        url: 'https://www.brocardi.it/codice-civile/disposizioni-di-attuazione/capo-ii/sezione-i/art63-disp-att.html',
      },
    ]
  },
  {
    id: 'cedolare',
    title: 'Cedolare Secca',
    links: [
      {
        article: 'D.Lgs. 23/2011',
        title: 'Disciplina cedolare secca',
        url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/agevolazioni/cedolare-secca',
      },
      {
        article: 'Circolare 26/E',
        title: 'Chiarimenti Agenzia Entrate',
        url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/233439/Circolare+n.26+del+01_06_2011.pdf',
      },
    ]
  },
  {
    id: 'imu',
    title: 'IMU Seconda Casa',
    links: [
      {
        article: 'Legge 160/2019',
        title: 'Nuova IMU',
        url: 'https://www.agenziaentrate.gov.it/portale/web/guest/imu1',
      },
      {
        article: 'Art. 1 commi 738-783',
        title: 'Disposizioni IMU',
        url: 'https://www.gazzettaufficiale.it/eli/id/2019/12/30/19G00165/sg',
      },
    ]
  },
  {
    id: 'locazioni',
    title: 'Obblighi Fiscali Locatore',
    links: [
      {
        article: 'Art. 26 TUIR',
        title: 'Redditi fondiari',
        url: 'https://www.brocardi.it/testo-unico-imposte-redditi/titolo-i/capo-ii/sezione-i/art26.html',
      },
      {
        article: 'Modello RLI',
        title: 'Registrazione contratti',
        url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/locazione-immobili-modello-rli',
      },
    ]
  },
];

export default function Leggi() {
  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <PageLayout title="Normativa" subtitle="LEGAL ADVICE">
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Compendio Normativo */}
        <div className="section-card">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
            <div>
              <h2 className="section-title">Compendio Normativo</h2>
              <p className="section-subtitle">CONSULTAZIONE RIFERIMENTI LEGALI</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {LEGAL_LINKS.map(section => (
              <div key={section.id}>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.links.map((link, index) => (
                    <button
                      key={index}
                      onClick={() => openExternalLink(link.url)}
                      className="legal-link w-full text-left group"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{link.article} – {link.title}</p>
                        <p className="text-xs text-primary mt-1 flex items-center gap-1">
                          CONSULTA SU FONTE UFFICIALE
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box about First Year Tax */}
        <div className="section-card bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Cedolare Secca - Primo Anno</h3>
              <p className="text-sm text-blue-700 mt-2">
                Nel <strong>primo anno di locazione</strong> non sono dovuti acconti sulla cedolare secca. 
                L'imposta viene versata interamente a <strong>saldo nell'anno successivo</strong> 
                (entro il 30 giugno).
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Dal <strong>terzo anno</strong> si applica il regime ordinario con acconti (95%) 
                in due rate (giugno e novembre) e saldo (5%).
              </p>
              <button
                onClick={() => openExternalLink('https://www.agenziaentrate.gov.it/portale/web/guest/schede/agevolazioni/cedolare-secca')}
                className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                Approfondisci su Agenzia Entrate
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Legal Note */}
        <div className="section-card bg-amber-50 border-amber-200">
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-3">
            NOTA LEGALE RAPIDA
          </h3>
          <blockquote className="text-sm text-amber-800 italic border-l-4 border-amber-400 pl-4">
            "Le spese per la conservazione e per il godimento delle parti comuni dell'edificio, 
            per la prestazione dei servizi nell'interesse comune sono sostenute dai condomini 
            in misura proporzionale al valore della proprietà di ciascuno."
          </blockquote>
          <p className="text-xs text-amber-600 mt-2">— Art. 1123 Codice Civile</p>
        </div>
      </div>
    </PageLayout>
  );
}
