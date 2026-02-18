import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFacultyAvailability } from '@/api/availability';
import { requestReschedule } from '@/api/appointments';
import { useToast } from '@/hooks/use-toast';

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: number;
  facultyId: number;
  currentTitle: string;
  currentDate: string;
  currentSlot: string;
  onSubmit?: (data: { date: string; slot: string }) => void;
}

const RescheduleModal = ({
  open,
  onOpenChange,
  appointmentId,
  facultyId,
  currentTitle,
  currentDate,
  currentSlot,
  onSubmit
}: RescheduleModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const {
    data: availability = [],
    isLoading: availabilityLoading,
    isError: availabilityError
  } = useQuery({
    queryKey: ['availability', facultyId],
    queryFn: () => getFacultyAvailability(facultyId),
    enabled: open && facultyId > 0
  });

  const handleSubmitRequest = () => {
    if (!selectedDate || !selectedSlot) return;
    
    if (onSubmit) {
      onSubmit({
        date: selectedDate,
        slot: selectedSlot
      });
    } else {
      // Fallback to direct mutation if no onSubmit provided
      rescheduleMutation.mutate({
        date: selectedDate,
        slot: selectedSlot
      });
    }
  };

  const rescheduleMutation = useMutation({
    mutationFn: (data: { date: string; slot: string }) =>
      requestReschedule(appointmentId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        description: 'Reschedule request sent',
      });
      onOpenChange(false);
      setSelectedDate('');
      setSelectedSlot('');
    },

    onError: (err: any) => {
      if (err.response?.status === 409) {
        toast({
          description: 'Selected slot is no longer available.',
          variant: 'destructive',
        });
      } else {
        toast({
          description: 'Failed to request reschedule.',
          variant: 'destructive',
        });
      }
    }
  });

  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDate]);

  const handleSubmit = () => {
    handleSubmitRequest();
  };

  const handleClose = () => {
    if (!rescheduleMutation.isPending) {
      onOpenChange(false);
      setSelectedDate('');
      setSelectedSlot('');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <CardTitle className="text-xl">Request Reschedule</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
            disabled={rescheduleMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium text-foreground">{currentTitle}</h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Current: {new Date(currentDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Current: {currentSlot}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select New Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded-md"
                disabled={rescheduleMutation.isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Select Time Slot
              </label>
              
              {availabilityLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                </div>
              ) : availabilityError ? (
                <p className="text-destructive text-sm py-4 text-center">
                  Failed to load availability
                </p>
              ) : selectedDate ? (
                <div className="grid grid-cols-2 gap-2">
                  {availability
                    .find(day => day.date === selectedDate)
                    ?.slots.filter(slot => slot.isAvailable)
                    .map(slot => (
                      <Button
                        key={slot.time}
                        variant={selectedSlot === slot.time ? "default" : "outline"}
                        onClick={() => setSelectedSlot(slot.time)}
                        disabled={rescheduleMutation.isPending}
                        className="h-12"
                      >
                        {slot.time}
                      </Button>
                    )) || (
                      <div className="col-span-2 text-center py-4 text-muted-foreground">
                        No slots available for selected day
                      </div>
                    )
                  }
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Please select a date first
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={rescheduleMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedSlot || rescheduleMutation.isPending}
              className="flex-1"
            >
              {rescheduleMutation.isPending ? 'Sending...' : 'Request Reschedule'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RescheduleModal;