import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduledItem } from '@/types/property';

interface AddScheduledItemModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: Omit<ScheduledItem, 'id'>) => void;
}

export function AddScheduledItemModal({ open, onClose, onSave }: AddScheduledItemModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'manutenzione' | 'fiscale'>('manutenzione');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      title: title.trim(),
      type,
      date,
      completed: false
    });
    
    setTitle('');
    setType('manutenzione');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo Adempimento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              placeholder="Es: Revisione caldaia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manutenzione">Manutenzione</SelectItem>
                <SelectItem value="fiscale">Fiscale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="itemDate">Data Scadenza</Label>
            <Input
              id="itemDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={!title.trim()}>
            Salva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
