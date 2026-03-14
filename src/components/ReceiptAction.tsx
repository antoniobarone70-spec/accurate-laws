import { useMemo, useState } from 'react';
import { useProperty } from '@/contexts/PropertyContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { formatEUR } from '@/lib/utils';

interface ReceiptActionProps {
  month: number;
  year: number;
}

export function ReceiptAction({ month, year }: ReceiptActionProps) {
  const { property, monthlyRecords, addReceipt } = useProperty();
  const [twoCopies, setTwoCopies] = useState(true);

  const record = useMemo(
    () => monthlyRecords.find(r => r.month === month && r.year === year),
    [monthlyRecords, month, year]
  );

  const total = Math.max(0, record?.rentReceived || 0);
  const spese = Math.min(property.condominiumFees || 0, total);
  const canone = Math.max(0, total - spese);
  const periodLabel = useMemo(() => {
    const d = new Date(year, month - 1, 1);
    return format(d, 'LLLL yyyy', { locale: it });
  }, [month, year]);

  const landlordName = property.landlordName || '—';
  const landlordInfo = property.landlordInfo || '';
  const tenantName = property.tenantName || '—';
  const immobileInfo = property.address || '—';

  const disabled = !record || total <= 0;

  const handleDownload = () => {
    const today = new Date();
    const savedNumber = addReceipt({
      date: today.toISOString().slice(0, 10),
      month,
      year,
      tenantName,
      total,
      canone,
      spese,
      periodLabel,
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    let y = margin;

    const write = (text: string, size = 12, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.text(text, margin, y);
      y += size + 8;
    };

    // Header
    write(landlordName, 14, true);
    if (landlordInfo) write(landlordInfo, 10);
    doc.text(`Ricevuta N. ${savedNumber} / ${year}`, 420, margin, { align: 'right' });
    y += 4;
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.line(margin, y, 595 - margin, y);
    y += 20;

    // Beneficiary
    write(`Conduttore: ${tenantName}`, 12, true);
    write(`Immobile: ${immobileInfo}`, 11);
    y += 4;

    // Box grigio con dettagli
    const boxTop = y;
    const boxHeight = 120;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, boxTop, 595 - margin * 2, boxHeight, 8, 8, 'F');
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Periodo: ${periodLabel}`, margin + 16, y);
    y += 20;
    doc.text(`Importo totale: ${formatEUR(total)}`, margin + 16, y);
    y += 18;
    doc.text(`Scorporo: Canone ${formatEUR(canone)}  •  Spese ${formatEUR(spese)}`, margin + 16, y);
    y = boxTop + boxHeight + 24;

    // Marca da bollo
    if (canone > 77.47) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('* Marca da bollo da € 2,00 assolta sull’originale', margin, y);
      y += 18;
    }

    // Firma
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Luogo e data: __________________________', margin, y);
    doc.text('Firma del locatore: _____________________', 330, y);
    y += 28;

    if (twoCopies) {
      // Taglio (linea tratteggiata per seconda copia)
      doc.setDrawColor(150);
      doc.setLineDash([6, 4], 0);
      doc.line(margin, y, 595 - margin, y);
      doc.setLineDash([]);
      y += 24;

      // Seconda copia (compatta)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Ricevuta - ${periodLabel} (copia)`, margin, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.text(`${tenantName} • Totale ${formatEUR(total)} • Canone ${formatEUR(canone)} • Spese ${formatEUR(spese)}`, margin, y);
    }

    const fileName = `ricevuta-${year}-${String(month).padStart(2, '0')}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="mt-3">
      <label className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <input
          type="checkbox"
          className="w-4 h-4 rounded"
          checked={twoCopies}
          onChange={(e) => setTwoCopies(e.target.checked)}
        />
        Genera due copie
      </label>
      <button
        onClick={handleDownload}
        disabled={disabled}
        className={`w-full py-2 rounded-xl font-medium transition-colors ${
          disabled ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
        title={disabled ? 'Nessun incasso registrato per il mese' : 'Scarica ricevuta PDF'}
      >
        Scarica Ricevuta
      </button>
    </div>
  );
}

export default ReceiptAction;
