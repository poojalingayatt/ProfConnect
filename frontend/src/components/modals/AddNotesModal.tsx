import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AddNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentTitle: string;
  existingNotes?: string;
  onSave: (notes: string) => void;
}

const AddNotesModal = ({
  open,
  onOpenChange,
  appointmentTitle,
  existingNotes = '',
  onSave,
}: AddNotesModalProps) => {
  const [notes, setNotes] = useState(existingNotes);

  const handleSave = () => {
    onSave(notes);
    onOpenChange(false);
  };

  const handleClose = () => {
    setNotes(existingNotes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Appointment Notes</DialogTitle>
              <DialogDescription>{appointmentTitle}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="notes" className="mb-2 block">
            Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Add notes about this appointment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            These notes are private and only visible to you.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNotesModal;