import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi, facultyApi, followsApi } from '@/api';
import { Search, Filter, Star, MapPin, Heart, X, Calendar, Clock, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const FindFaculty = () => {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');
  const [followedFaculty, setFollowedFaculty] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch faculty on mount
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const response = await facultyApi.listFaculty();
        if (response.success) {
          setFaculty(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch faculty:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  const departments = ['all', ...new Set(faculty.map(f => f.department))];

  const filteredFaculty = useMemo(() => {
    return faculty.filter(f => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment = departmentFilter === 'all' || f.department === departmentFilter;

      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'online' && f.profile?.isOnline) ||
        (availabilityFilter === 'available' && f.profile?.availability?.length > 0);

      return matchesSearch && matchesDepartment && matchesAvailability;
    });
  }, [faculty, searchQuery, departmentFilter, availabilityFilter]);

  const toggleFollow = async (facultyId: string) => {
    try {
      if (followedFaculty.includes(facultyId)) {
        await followsApi.unfollowFaculty(facultyId);
        setFollowedFaculty(prev => prev.filter(id => id !== facultyId));
        toast({ description: 'Unfollowed successfully' });
      } else {
        await followsApi.followFaculty(facultyId);
        setFollowedFaculty(prev => [...prev, facultyId]);
        toast({ description: 'Now following this faculty' });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to update follow status'
      });
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedFaculty || !selectedDate || !selectedSlot || !appointmentTitle) {
      toast({
        variant: 'destructive',
        description: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setIsBooking(true);

      // Parse the time slot (e.g., "09:00 - 10:00")
      const [startTime, endTime] = selectedSlot.split(' - ');

      // Calculate duration in minutes
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

      const appointmentData = {
        facultyId: selectedFaculty._id, // Use MongoDB _id
        title: appointmentTitle,
        description: appointmentDescription,
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        durationMinutes: durationMinutes,
        location: selectedFaculty.profile?.officeLocation || 'TBD',
      };

      const response = await appointmentsApi.createAppointment(appointmentData);

      if (response.success) {
        toast({
          title: 'Appointment Requested!',
          description: `Your appointment with ${selectedFaculty?.name} has been sent for approval.`,
        });

        // Reset form
        setSelectedFaculty(null);
        setBookingStep(0);
        setSelectedDate('');
        setSelectedSlot('');
        setAppointmentTitle('');
        setAppointmentDescription('');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: error.response?.data?.message || 'Failed to create appointment',
      });
    } finally {
      setIsBooking(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setAvailabilityFilter('all');
  };

  // Get next 7 days for booking
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Find Faculty</h1>
          <p className="text-muted-foreground mt-1">Search and book appointments with faculty members.</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, department, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online Now</SelectItem>
              <SelectItem value="available">Has Availability</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || departmentFilter !== 'all' || availabilityFilter !== 'all') && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredFaculty.length} faculty member{filteredFaculty.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Faculty Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFaculty.map(f => (
                <Card key={f._id} className="hover-lift overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header with avatar */}
                    <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/5 to-accent/10">
                      <button
                        onClick={() => toggleFollow(f._id)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${followedFaculty.includes(f._id)
                            ? 'fill-destructive text-destructive'
                            : 'text-muted-foreground'
                            }`}
                        />
                      </button>

                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-card">
                          <AvatarImage src={f.avatarUrl} />
                          <AvatarFallback className="text-lg">{f.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{f.name}</h3>
                          <p className="text-sm text-muted-foreground">{f.department}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 text-xs ${f.profile?.isOnline ? 'text-success' : 'text-muted-foreground'}`}>
                              <span className={`w-2 h-2 rounded-full ${f.profile?.isOnline ? 'bg-success' : 'bg-muted'}`} />
                              {f.profile?.isOnline ? 'Online' : 'Offline'}
                            </span>
                            {f.profile?.rating && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-warning text-warning" />
                                {f.profile.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 pt-4 space-y-4">
                      {/* Specializations */}
                      {f.profile?.specialization && f.profile.specialization.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {f.profile.specialization.slice(0, 3).map((spec: string) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Location */}
                      {f.profile?.officeLocation && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {f.profile.officeLocation}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedFaculty(f);
                            setBookingStep(0);
                          }}
                        >
                          View Profile
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => {
                            setSelectedFaculty(f);
                            setBookingStep(1);
                          }}
                        >
                          Book
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredFaculty.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No faculty found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}

        {/* Faculty Profile / Booking Modal */}
        <Dialog open={!!selectedFaculty} onOpenChange={() => { setSelectedFaculty(null); setBookingStep(0); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedFaculty && (
              <>
                {bookingStep === 0 ? (
                  // Profile View
                  <>
                    <DialogHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={selectedFaculty.avatar} />
                          <AvatarFallback className="text-2xl">{selectedFaculty.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <DialogTitle className="text-xl">{selectedFaculty.name}</DialogTitle>
                          <DialogDescription className="mt-1">
                            {selectedFaculty.department}
                          </DialogDescription>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              {selectedFaculty.rating} ({selectedFaculty.reviewCount} reviews)
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {selectedFaculty.followerCount} followers
                            </span>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                      {/* Bio */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">About</h4>
                        <p className="text-sm text-muted-foreground">{selectedFaculty.bio}</p>
                      </div>

                      {/* Qualifications */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Qualifications</h4>
                        <ul className="space-y-1">
                          {selectedFaculty.qualifications.map((q, i) => (
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
                          {selectedFaculty.specialization.map(spec => (
                            <Badge key={spec} variant="secondary">{spec}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Office Location */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Office Location</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {selectedFaculty.officeLocation}
                        </p>
                      </div>

                      {/* Availability Preview */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Weekly Availability</h4>
                        <div className="grid grid-cols-5 gap-2">
                          {selectedFaculty.availability.slice(0, 5).map(avail => (
                            <div key={avail.day} className="text-center p-2 rounded-lg bg-accent/50">
                              <p className="text-xs font-medium text-foreground">{avail.day.slice(0, 3)}</p>
                              <p className="text-xs text-muted-foreground">{avail.slots.length} slots</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          variant={followedFaculty.includes(selectedFaculty.id) ? 'outline' : 'secondary'}
                          onClick={() => toggleFollow(selectedFaculty.id)}
                        >
                          <Heart className={`mr-2 h-4 w-4 ${followedFaculty.includes(selectedFaculty.id) ? 'fill-current' : ''}`} />
                          {followedFaculty.includes(selectedFaculty.id) ? 'Following' : 'Follow'}
                        </Button>
                        <Button className="flex-1" onClick={() => setBookingStep(1)}>
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
                      <DialogDescription>Choose a date for your appointment with {selectedFaculty.name}</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-4">
                      {getNextDays().map(d => (
                        <button
                          key={d.date}
                          onClick={() => { setSelectedDate(d.date); setBookingStep(2); }}
                          className={`p-3 rounded-lg border text-center transition-colors ${selectedDate === d.date
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

                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedFaculty.availability[0]?.slots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => { setSelectedSlot(slot); setBookingStep(3); }}
                          className={`px-4 py-2 rounded-lg border transition-colors ${selectedSlot === slot
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card hover:bg-accent border-border'
                            }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>

                    <Button variant="outline" className="mt-4" onClick={() => setBookingStep(1)}>
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
                          {selectedFaculty.officeLocation}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setBookingStep(2)}>
                          Back
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleBookAppointment}
                          disabled={!appointmentTitle || isBooking}
                        >
                          {isBooking ? 'Booking...' : 'Confirm Booking'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FindFaculty;
