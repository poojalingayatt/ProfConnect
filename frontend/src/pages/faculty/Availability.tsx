import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, Check } from 'lucide-react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

const FacultyAvailability = () => {
  const { getFacultyData } = useAuth();
  const facultyData = getFacultyData();
  const { toast } = useToast();

  const [isInOffice, setIsInOffice] = useState(facultyData?.isOnline || false);
  const [currentLocation, setCurrentLocation] = useState(facultyData?.currentLocation || '');
  
  // Initialize availability grid
  const [availability, setAvailability] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    days.forEach(day => {
      const dayAvail = facultyData?.availability.find(a => a.day === day);
      initial[day] = dayAvail?.slots || [];
    });
    return initial;
  });

  const toggleSlot = (day: string, slot: string) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      if (daySlots.includes(slot)) {
        return { ...prev, [day]: daySlots.filter(s => s !== slot) };
      } else {
        return { ...prev, [day]: [...daySlots, slot].sort() };
      }
    });
  };

  const handleSave = () => {
    toast({
      title: 'Availability Updated',
      description: 'Your availability has been saved successfully.',
    });
  };

  const handleSetStandardHours = () => {
    const standardSlots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'];
    const newAvail: Record<string, string[]> = {};
    days.forEach(day => {
      newAvail[day] = [...standardSlots];
    });
    setAvailability(newAvail);
    toast({ description: 'Standard hours applied' });
  };

  const handleClearAll = () => {
    const newAvail: Record<string, string[]> = {};
    days.forEach(day => {
      newAvail[day] = [];
    });
    setAvailability(newAvail);
    toast({ description: 'All availability cleared' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Manage Availability</h1>
          <p className="text-muted-foreground mt-1">Set your office hours and availability for appointments.</p>
        </div>

        {/* Office Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Status</CardTitle>
            <CardDescription>Let students know if you're available right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  isInOffice ? 'bg-success animate-pulse' : 'bg-muted'
                )} />
                <div>
                  <p className="font-medium text-foreground">
                    {isInOffice ? 'Available in Office' : 'Not Available'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Students can see your current status
                  </p>
                </div>
              </div>
              <Switch
                checked={isInOffice}
                onCheckedChange={setIsInOffice}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <Label htmlFor="location" className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Current Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., Building A, Room 301"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Weekly Availability */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Weekly Availability</CardTitle>
                <CardDescription>Click on time slots to toggle availability.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSetStandardHours}>
                  Standard Hours
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header row */}
                <div className="grid grid-cols-6 gap-2 mb-2">
                  <div className="text-sm font-medium text-muted-foreground p-2">Time</div>
                  {days.map(day => (
                    <div key={day} className="text-sm font-medium text-foreground text-center p-2">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Time slot rows */}
                <div className="space-y-1">
                  {timeSlots.map(slot => (
                    <div key={slot} className="grid grid-cols-6 gap-2">
                      <div className="text-xs text-muted-foreground p-2 flex items-center">
                        {slot}
                      </div>
                      {days.map(day => {
                        const isAvailable = availability[day]?.includes(slot);
                        return (
                          <button
                            key={`${day}-${slot}`}
                            onClick={() => toggleSlot(day, slot)}
                            className={cn(
                              'h-8 rounded-md border transition-all duration-200',
                              isAvailable
                                ? 'bg-success/20 border-success/50 hover:bg-success/30'
                                : 'bg-card border-border hover:bg-accent/50'
                            )}
                          >
                            {isAvailable && (
                              <Check className="h-4 w-4 mx-auto text-success" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/20 border border-success/50" />
                <span className="text-sm text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-card border border-border" />
                <span className="text-sm text-muted-foreground">Not Available</span>
              </div>
            </div>

            <Button className="mt-6" onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              Save Availability
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => {
              setIsInOffice(true);
              toast({ description: 'Status set to available' });
            }}>
              <Clock className="h-4 w-4 mr-2" />
              Available Now
            </Button>
            <Button variant="outline" onClick={() => {
              setIsInOffice(false);
              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const dayKey = days.find(d => d === today);
              if (dayKey) {
                setAvailability(prev => ({ ...prev, [dayKey]: [] }));
              }
              toast({ description: 'Marked as off for today' });
            }}>
              Off Today
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FacultyAvailability;
