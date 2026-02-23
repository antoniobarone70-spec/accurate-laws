import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExtraExpense } from '@/types/property';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExtraExpense, 'id'>) => void;
}

export function AddExpenseModal({ open, onClose, onSave }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'ordinaria' | 'straordinaria'>('straordinaria');

  const handleSave = () => {
    if (!description.trim() || !amount) return;
    
    onSave({
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      category
    });
    
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('straordinaria');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aggiungi Spesa Extra</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Input
              id="description"
              placeholder="Es: Riparazione caldaia"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Importo (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expenseDate">Data</Label>
            <Input
              id="expenseDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'ordinaria' | 'straordinaria')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="straordinaria">Straordinaria</option>
              <option value="ordinaria">Ordinaria</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={!description.trim() || !amount}>
            Salva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
