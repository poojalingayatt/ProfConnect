import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
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

const StudentSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/profile');
        if (response.data.success) {
          const profile = response.data.data;
          setPhone(profile.phone || '');
          setDepartment(profile.department || '');
          setStudentId(profile.studentId || '');
          setSemester(profile.semester?.toString() || '');
          setBio(profile.bio || '');
          setSkills(profile.skills || []);
          setAvatarUrl(profile.avatarUrl || '');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please select an image file',
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
        });
        return;
      }

      // Read file and convert to base64 or upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast({
          title: 'Image selected',
          description: 'Click "Save Changes" to update your profile picture',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put('/profile', {
        phone,
        department,
        studentId,
        semester: semester ? parseInt(semester) : undefined,
        bio,
        skills,
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your account preferences</p>
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
                        <button
                          onClick={handleCameraClick}
                          type="button"
                          className="absolute bottom-1 right-1 p-2 bg-background border border-border rounded-full hover:bg-accent transition-colors shadow-sm"
                        >
                          <Camera className="h-4 w-4 text-foreground" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
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
                        <Label htmlFor="studentId" className="text-sm font-medium">Student ID</Label>
                        <Input
                          id="studentId"
                          placeholder="e.g., 2024CS001"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                        <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Computer Science', 'Electronics', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Information Technology', 'Chemical Engineering', 'Biotechnology'].map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="semester" className="text-sm font-medium">Semester</Label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number(optional)</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                          className="h-9"
                        />
                        <Button type="button" onClick={handleAddSkill} size="sm" variant="outline" className="px-4">
                          Add
                        </Button>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-sm"
                            >
                              {skill}
                              <button onClick={() => handleRemoveSkill(skill)} className="hover:text-destructive">
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

export default StudentSettings;