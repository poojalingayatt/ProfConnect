import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { getFacultyAvailability } from '@/api/availability';
import { createAppointment } from '@/api/appointments';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  facultyId: number;
  facultyName: string;
  faculty?: any;
}

const BookingModal = ({ open, onClose, facultyId, facultyName, faculty }: BookingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Steps: 0 = date selection, 1 = slot selection, 2 = appointment details
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');

  const {
    data: availabilityRaw,
    isLoading: isAvailabilityLoading,
    isError: isAvailabilityError,
  } = useQuery({
    queryKey: ['availability', facultyId],
    queryFn: () => getFacultyAvailability(facultyId),
    enabled: open && !!facultyId,
  });

  // Defensive: always ensure availability is an array
  const availability = useMemo(() => {
    if (Array.isArray(availabilityRaw)) return availabilityRaw;
    return [];
  }, [availabilityRaw]);

  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDate]);

  const bookMutation = useMutation({
    mutationFn: createAppointment,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['availability', facultyId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability', facultyId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast({
        title: 'Success',
        description: 'Appointment booked successfully!',
      });
      handleClose();
    },
    onError: (error: any) => {
      const status = error?.response?.status;

      if (status === 409) {
        toast({
          title: 'Slot Taken',
          description: 'This slot was just booked. Please select another.',
          variant: 'destructive',
        });
      } else if (status === 400) {
        toast({
          title: 'Invalid Details',
          description: error?.response?.data?.message || 'Invalid booking details.',
          variant: 'destructive',
        });
      } else if (status === 403) {
        toast({
          title: 'Access Denied',
          description: 'Only students can book appointments.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Booking Failed',
          description: 'Failed to book appointment. Please try again.',
          variant: 'destructive',
        });
      }
    },
  });

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedSlot || !appointmentTitle) return;

    bookMutation.mutate({
      facultyId,
      date: new Date(selectedDate).toISOString(),
      slot: selectedSlot,
      title: appointmentTitle,
      description: appointmentDescription,
    });
  };

  const handleClose = () => {
    onClose();
    setBookingStep(0);
    setSelectedDate('');
    setSelectedDay('');
    setSelectedSlot('');
    setAppointmentTitle('');
    setAppointmentDescription('');
  };

  // Get next 14 days for booking
  const getNextDays = () => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  };

  // Resolve office location from faculty data (defensive)
  const officeLocation = faculty?.officeLocation
    || faculty?.facultyProfile?.officeLocation
    || null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <>
          {bookingStep === 0 ? (
            // ── Step 0: Date Selection ──
            <>
              <DialogHeader>
                <DialogTitle>Select Date</DialogTitle>
                <DialogDescription>
                  Choose a date for your appointment with {facultyName}
                </DialogDescription>
              </DialogHeader>

              {isAvailabilityLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                </div>
              ) : isAvailabilityError ? (
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-sm text-destructive text-center">
                  Unable to load availability. Please try again.
                </div>
              ) : availability.length === 0 ? (
                <div className="mt-4 p-4 rounded-lg bg-accent/50 text-sm text-muted-foreground text-center">
                  This faculty has not set any availability yet.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-4">
                  {getNextDays().map(d => {
                    // Check if this day has availability
                    const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' });
                    const hasSlots = availability.some(
                      (a: any) => a.day === dayName && a.slots?.length > 0
                    );

                    return (
                      <button
                        key={d.date}
                        onClick={() => {
                          if (!hasSlots) return;
                          setSelectedDate(d.date);
                          setSelectedDay(dayName);
                          setSelectedSlot('');
                          setBookingStep(1);
                        }}
                        disabled={!hasSlots}
                        className={`p-3 rounded-lg border text-center transition-colors ${!hasSlots
                            ? 'bg-muted/50 border-border text-muted-foreground/40 cursor-not-allowed'
                            : selectedDate === d.date
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card hover:bg-accent border-border'
                          }`}
                      >
                        <p className="text-xs font-medium">{d.day}</p>
                        <p className="text-lg font-bold">{d.dayNum}</p>
                        <p className="text-xs">{d.month}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : bookingStep === 1 ? (
            // ── Step 1: Time Slot Selection ──
            <>
              <DialogHeader>
                <DialogTitle>Select Time Slot</DialogTitle>
                <DialogDescription>
                  Available slots for {selectedDate
                    ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                    : ''}
                </DialogDescription>
              </DialogHeader>

              {(() => {
                const dayAvailability = availability.find(
                  (a: any) => a.day === selectedDay
                );
                const availableSlots = dayAvailability?.slots ?? [];

                if (availableSlots.length === 0) {
                  return (
                    <div className="mt-4 p-4 rounded-lg bg-accent/50 text-sm text-muted-foreground text-center">
                      No slots available for {selectedDay || 'this day'}.
                    </div>
                  );
                }

                return (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {availableSlots.map((slot: string) => (
                      <button
                        key={slot}
                        onClick={() => { setSelectedSlot(slot); setBookingStep(2); }}
                        className={`px-4 py-2 rounded-lg border transition-colors ${selectedSlot === slot
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card hover:bg-accent border-border'
                          }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                );
              })()}

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setBookingStep(0)}
              >
                Back
              </Button>
            </>
          ) : (
            // ── Step 2: Appointment Details ──
            <>
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                    : ''}{' '}
                  at {selectedSlot}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Doubt Session - Data Structures"
                    value={appointmentTitle}
                    onChange={(e) => setAppointmentTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell the faculty what you'd like to discuss..."
                    value={appointmentDescription}
                    onChange={(e) => setAppointmentDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="p-4 rounded-lg bg-accent/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                      : ''}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {selectedSlot}
                  </div>
                  {officeLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {officeLocation}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setBookingStep(1)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleBookAppointment}
                    disabled={
                      bookMutation.isPending ||
                      !selectedSlot ||
                      !appointmentTitle
                    }
                  >
                    {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;