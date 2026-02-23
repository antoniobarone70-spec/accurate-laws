import { Download, Upload } from 'lucide-react';
import { exportJson, importJson } from '@/services/localData';

export default function BackupRestore() {
  const handleExport = () => {
    const data = exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-app-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          const ok = importJson(data);
          if (ok) {
            alert('Dati ripristinati con successo!');
            window.location.reload();
          } else {
            alert('Errore nel ripristino dei dati');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="mt-4 flex gap-3">
      <button
        onClick={handleExport}
        className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
      >
        <Download className="w-4 h-4" />
        Scarica Dati
      </button>
      <button
        onClick={handleImport}
        className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors border border-border"
      >
        <Upload className="w-4 h-4" />
        Ripristina Dati
      </button>
    </div>
  );
}
