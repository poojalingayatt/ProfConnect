import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, X } from 'lucide-react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/auth';

const FacultySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState<string[]>([]);
  const [specializationInput, setSpecializationInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/profile');
        if (response.data.success) {
          const profile = response.data.data;
          setPhone(profile.phone || '');
          setDepartment(profile.department || '');
          setOfficeLocation(profile.officeLocation || '');
          setOfficeHours(profile.officeHours || '');
          setBio(profile.bio || '');
          setSpecialization(profile.specialization || []);
          setAvatarUrl(profile.avatarUrl || '');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, []);

  const handleAddSpecialization = () => {
    if (specializationInput.trim() && !specialization.includes(specializationInput.trim())) {
      setSpecialization([...specialization, specializationInput.trim()]);
      setSpecializationInput('');
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setSpecialization(specialization.filter(s => s !== spec));
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put('/profile', {
        phone,
        department,
        officeLocation,
        officeHours,
        bio,
        specialization,
        avatarUrl,
      });

      if (response.data.success) {
        toast({
          title: 'Profile updated',
          description: 'Your changes have been saved.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.response?.data?.message || 'Could not update profile',
      });
    }
  };

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Information Technology',
    'Chemical Engineering',
    'Biotechnology',
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your profile and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-5">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-0">
            <Card className="border-border/40">
              <CardHeader className="pb-5 px-6">
                <CardTitle className="text-lg font-medium">Profile Information</CardTitle>
                <CardDescription className="text-sm">Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid md:grid-cols-[200px_1fr] gap-6">
                  {/* Left Column - Avatar & Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative w-32 h-32 mx-auto">
                        <Avatar className="w-32 h-32 border-2 border-border">
                          <AvatarImage src={avatarUrl || user?.avatarUrl} />
                          <AvatarFallback className="text-3xl">{user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <button className="absolute bottom-1 right-1 p-2 bg-background border border-border rounded-full hover:bg-accent transition-colors shadow-sm">
                          <Camera className="h-4 w-4 text-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                      <Input
                        value={name}
                        disabled
                        className="bg-muted/50 h-9 text-sm cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="bg-muted/50 h-9 text-sm cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">Cannot be changed</p>
                    </div>
                  </div>

                  {/* Right Column - Editable Fields */}
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                        <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="officeLocation" className="text-sm font-medium">Office Location</Label>
                        <Input
                          id="officeLocation"
                          value={officeLocation}
                          onChange={(e) => setOfficeLocation(e.target.value)}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="officeHours" className="text-sm font-medium">Office Hours</Label>
                        <Input
                          id="officeHours"
                          value={officeHours}
                          onChange={(e) => setOfficeHours(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Specialization</Label>
                      <div className="flex gap-2">
                        <Input
                          value={specializationInput}
                          onChange={(e) => setSpecializationInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())}
                          className="h-9"
                        />
                        <Button type="button" onClick={handleAddSpecialization} size="sm" variant="outline" className="px-4">
                          Add
                        </Button>
                      </div>
                      {specialization.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {specialization.map((spec) => (
                            <span
                              key={spec}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-sm"
                            >
                              {spec}
                              <button onClick={() => handleRemoveSpecialization(spec)} className="hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bio" className="text-sm font-medium">About</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={300}
                        rows={2}
                        className="resize-none text-sm"
                      />
                      <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSaveProfile} size="sm">Save Changes</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Notification Preferences</CardTitle>
                <CardDescription className="text-sm">Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Notification settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Privacy Settings</CardTitle>
                <CardDescription className="text-sm">Control your privacy preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Privacy settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FacultySettings;
