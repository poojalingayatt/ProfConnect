import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
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

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentTitle: string;
  currentDate: string;
  currentTime: string;
  onConfirm: (newDate: string, newTime: string, reason: string) => void;
}

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

const RescheduleModal = ({
  open,
  onOpenChange,
  appointmentTitle,
  currentDate,
  currentTime,
  onConfirm,
}: RescheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');

  const getNextDays = () => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return days;
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm(selectedDate, selectedTime, reason);
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
    }
  };

  const handleClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new date and time for "{appointmentTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current appointment info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Current schedule:</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(currentDate).toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'long', day: 'numeric' 
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {currentTime}
              </span>
            </div>
          </div>

          {/* Date selection */}
          <div>
            <Label className="mb-3 block">Select New Date</Label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {getNextDays().map(d => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    selectedDate === d.date
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-accent border-border'
                  }`}
                >
                  <p className="text-xs font-medium">{d.day}</p>
                  <p className="text-lg font-bold">{d.dayNum}</p>
                  <p className="text-xs">{d.month}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Time selection */}
          {selectedDate && (
            <div>
              <Label className="mb-3 block">Select New Time</Label>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedTime === slot
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-accent border-border'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          {selectedTime && (
            <div>
              <Label htmlFor="reason" className="mb-2 block">
                Reason for rescheduling (optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Let them know why you're rescheduling..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
          >
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleModal;