import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Star, MapPin, Check, Calendar, Clock, Heart } from 'lucide-react';
import { getFacultyAvailability } from '@/api/availability';
import { createAppointment } from '@/api/appointments';

interface FacultyListItem {
  id: number;
  name: string;
  email: string;
  department?: string;
  facultyProfile: {
    bio?: string;
    rating: number;
    reviewCount: number;
    isOnline: boolean;
    specializations: { id: number; name: string }[];
  };
  officeLocation: string;
  availability: { day: string; slots: string[] }[];
  announcements: { date: string; title: string }[];
  qualifications: string[];
  avatar?: string;
  bio?: string;
  followerCount: number;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  facultyId: number;
  facultyName: string;
  faculty: FacultyListItem | null;
}

const BookingModal = ({ open, onClose, facultyId, facultyName, faculty }: BookingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');

  const {
    data: availability = [],
    isLoading: isAvailabilityLoading,
    isError: isAvailabilityError,
  } = useQuery({
    queryKey: ['availability', facultyId],
    queryFn: () => getFacultyAvailability(facultyId),
    enabled: open && !!facultyId,
  });

  // Reset selected slot when date changes to prevent invalid selections
  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDate]);

  const bookMutation = useMutation({
    mutationFn: createAppointment,
    onMutate: async () => {
      // Cancel any outgoing availability refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['availability', facultyId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability', facultyId] });

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
          description: 'Invalid booking details.',
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

  // Handle booking confirmation with real mutation
  const handleBookAppointment = () => {
    if (!selectedDate || !selectedSlot || !appointmentTitle) return;

    bookMutation.mutate({
      facultyId,
      date: new Date(selectedDate).toISOString(),
      time: selectedSlot,
      title: appointmentTitle,
      description: appointmentDescription,
    });
  };

  // Close modal and reset all state
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

  if (!faculty || faculty.id !== facultyId) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Faculty data not available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <>
          {bookingStep === 0 ? (
            // Profile View
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={faculty.avatar} />
                    <AvatarFallback className="text-2xl">{faculty.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{faculty.name}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {faculty.department}
                    </DialogDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {faculty.facultyProfile.rating} ({faculty.facultyProfile.reviewCount} reviews)
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {faculty.followerCount} followers
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Bio */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{faculty.bio}</p>
                </div>

                {/* Qualifications */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Qualifications</h4>
                  <ul className="space-y-1">
                    {faculty.qualifications.map((q, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specializations */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {faculty.facultyProfile.specializations.map(spec => (
                      <Badge key={spec.id} variant="secondary">{spec.name}</Badge>
                    ))}
                  </div>
                </div>

                {/* Office Location */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Office Location</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {faculty.officeLocation}
                  </p>
                </div>

                {/* Availability Preview */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Weekly Availability</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {faculty.availability.slice(0, 5).map(avail => (
                      <div key={avail.day} className="text-center p-2 rounded-lg bg-accent/50">
                        <p className="text-xs font-medium text-foreground">{avail.day.slice(0, 3)}</p>
                        <p className="text-xs text-muted-foreground">{avail.slots.length} slots</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="secondary" className="flex-1" onClick={() => setBookingStep(1)}>
                    Book Appointment
                  </Button>
                </div>
              </div>
            </>
          ) : bookingStep === 1 ? (
            // Date Selection
            <>
              <DialogHeader>
                <DialogTitle>Select Date</DialogTitle>
                <DialogDescription>Choose a date for your appointment with {faculty.name}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-4">
                {getNextDays().map(d => (
                  <button
                    key={d.date}
                    onClick={() => {
                      setSelectedDate(d.date);
                      setSelectedDay(
                        new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' })
                      );
                      setSelectedSlot('');
                      setBookingStep(2);
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors ${
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

              <Button variant="outline" className="mt-4" onClick={() => setBookingStep(0)}>
                Back to Profile
              </Button>
            </>
          ) : bookingStep === 2 ? (
            // Time Slot Selection
            <>
              <DialogHeader>
                <DialogTitle>Select Time Slot</DialogTitle>
                <DialogDescription>
                  Available slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </DialogDescription>
              </DialogHeader>

              {(() => {
                const selectedDay = selectedDate
                  ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })
                  : '';

                const dayAvailability = availability.find(
                  (a) => a.day === selectedDay
                );

                const availableSlots = dayAvailability?.slots ?? [];

                if (isAvailabilityLoading) {
                  return (
                    <div className="mt-4 p-4 rounded-lg bg-accent/50 text-sm text-muted-foreground text-center">
                      Loading available slots...
                    </div>
                  );
                }

                if (isAvailabilityError) {
                  return (
                    <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-sm text-destructive text-center">
                      Unable to load availability. Please try again.
                    </div>
                  );
                }

                if (availableSlots.length === 0) {
                  return (
                    <div className="mt-4 p-4 rounded-lg bg-accent/50 text-sm text-muted-foreground text-center">
                      No slots available for {selectedDay || 'this day'}.
                    </div>
                  );
                }

                return (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => { setSelectedSlot(slot); setBookingStep(3); }}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedSlot === slot
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
                onClick={() => setBookingStep(1)}
              >
                Back
              </Button>
            </>
          ) : (
            // Appointment Details
            <>
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedSlot}
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
                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {selectedSlot}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {faculty.officeLocation}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setBookingStep(2)}>
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