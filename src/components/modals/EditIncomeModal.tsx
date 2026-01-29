import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonthlyRecord } from '@/types/property';

interface EditIncomeModalProps {
  open: boolean;
  onClose: () => void;
  record: MonthlyRecord | null;
  monthName: string;
  onSave: (updates: Partial<MonthlyRecord>) => void;
}

export function EditIncomeModal({ open, onClose, record, monthName, onSave }: EditIncomeModalProps) {
  const [rentReceived, setRentReceived] = useState('');
  const [status, setStatus] = useState('atteso');
  const [receivedDate, setReceivedDate] = useState('');

  useEffect(() => {
    if (record) {
      setRentReceived(record.rentReceived > 0 ? record.rentReceived.toString() : '');
      setStatus(record.status);
      setReceivedDate(record.receivedDate || '');
    }
  }, [record]);

  const handleSave = () => {
    const rent = parseFloat(rentReceived) || 0;
    const updates: Partial<MonthlyRecord> = {
      rentReceived: rent,
      status: rent > 0 ? 'registrato' : 'atteso',
      receivedDate: rent > 0 ? (receivedDate || new Date().toISOString().split('T')[0]) : null
    };
    onSave(updates);
    onClose();
  };

  const handleClear = () => {
    onSave({
      rentReceived: 0,
      status: 'atteso',
      receivedDate: null
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Incasso {monthName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rent">Importo Ricevuto (€)</Label>
            <Input
              id="rent"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={rentReceived}
              onChange={(e) => setRentReceived(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Data Ricezione</Label>
            <Input
              id="date"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Azzera
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Salva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
