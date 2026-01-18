import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Phone, MapPin, Clock, IdCard, GraduationCap, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/auth';

const CompleteProfile = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [userRole, setUserRole] = useState<'student' | 'faculty'>('student');

    // Common fields
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bio, setBio] = useState('');

    // Faculty-specific fields
    const [department, setDepartment] = useState('');
    const [officeLocation, setOfficeLocation] = useState('');
    const [officeHours, setOfficeHours] = useState('');
    const [specialization, setSpecialization] = useState<string[]>([]);
    const [specializationInput, setSpecializationInput] = useState('');

    // Student-specific fields
    const [studentId, setStudentId] = useState('');
    const [studentDepartment, setStudentDepartment] = useState(''); // Renamed to avoid conflict with faculty department
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [semester, setSemester] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('profconnect_user_type') as 'student' | 'faculty';
        if (role) setUserRole(role);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid File',
                    description: 'Please select an image file',
                });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'File Too Large',
                    description: 'Please select an image under 5MB',
                });
                return;
            }

            setAvatarFile(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddSpecialization = () => {
        if (specializationInput.trim() && !specialization.includes(specializationInput.trim())) {
            setSpecialization([...specialization, specializationInput.trim()]);
            setSpecializationInput('');
        }
    };

    const handleRemoveSpecialization = (index: number) => {
        setSpecialization(specialization.filter((_, i) => i !== index));
    };

    const handleAddSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (index: number) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (userRole === 'faculty' && !bio.trim()) {
            toast({
                variant: 'destructive',
                title: 'Bio Required',
                description: 'Please provide your professional bio',
            });
            return;
        }

        if (userRole === 'student' && !studentId.trim()) {
            toast({
                variant: 'destructive',
                title: 'Student ID Required',
                description: 'Please enter your student ID number',
            });
            return;
        }

        if (bio.length > 300) {
            toast({
                variant: 'destructive',
                title: 'Bio Too Long',
                description: 'Bio must be 300 characters or less',
            });
            return;
        }

        setIsLoading(true);

        try {
            const profileData: any = {
                phone,
                avatarUrl,
                bio,
                profileCompleted: true,
            };

            if (userRole === 'faculty') {
                profileData.department = department;
                profileData.officeLocation = officeLocation;
                profileData.officeHours = officeHours;
                profileData.specialization = specialization;
            } else {
                profileData.studentId = studentId;
                profileData.department = studentDepartment; // Use studentDepartment for students
                profileData.skills = skills;
                profileData.semester = semester ? parseInt(semester) : undefined;
            }

            const response = await api.put('/profile', profileData);

            if (response.data.success) {
                toast({
                    title: 'Profile Completed!',
                    description: 'Welcome to ProfConnect',
                });

                if (userRole === 'faculty') {
                    navigate('/faculty/dashboard');
                } else {
                    navigate('/student/dashboard');
                }
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.response?.data?.message || 'Could not update profile',
            });
        } finally {
            setIsLoading(false);
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-6">
            <Card className="w-full max-w-[950px] border-border/40 shadow-lg">
                {/* Compact Header */}
                <div className="px-7 pt-6 pb-4 border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Complete Your Profile</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {userRole === 'faculty'
                                    ? 'Help students discover and connect with you'
                                    : 'Set up your account to start booking appointments'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-7">
                    <div className="grid md:grid-cols-[200px_1fr] gap-8">
                        {/* Left Column - Profile Picture */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Profile Picture</Label>
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                                className="relative cursor-pointer group"
                            >
                                <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border/60 bg-accent/30 flex flex-col items-center justify-center overflow-hidden hover:border-primary/50 transition-colors group-hover:bg-accent/40">
                                    {avatarUrl ? (
                                        <>
                                            <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="h-8 w-8 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                            <p className="text-xs text-muted-foreground text-center px-3">
                                                Upload picture
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Form Fields */}
                        <div className="space-y-4">
                            {/* Faculty Fields */}
                            {userRole === 'faculty' && (
                                <>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
                                            <Select value={department} onValueChange={setDepartment} required>
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Select department" />
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
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="+91-9876543210"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="pl-9 h-10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="officeLocation" className="text-sm font-medium">Office Location</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="officeLocation"
                                                    placeholder="Room A-204, 2nd Floor"
                                                    value={officeLocation}
                                                    onChange={(e) => setOfficeLocation(e.target.value)}
                                                    className="pl-9 h-10"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="officeHours" className="text-sm font-medium">Office Hours</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="officeHours"
                                                    placeholder="Mon-Fri 2:00 PM - 4:00 PM"
                                                    value={officeHours}
                                                    onChange={(e) => setOfficeHours(e.target.value)}
                                                    className="pl-9 h-10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">Specialization Areas</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="e.g., AI, Machine Learning, Cloud Computing"
                                                value={specializationInput}
                                                onChange={(e) => setSpecializationInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())}
                                                className="h-10"
                                            />
                                            <Button type="button" onClick={handleAddSpecialization} size="sm" className="px-4">
                                                Add
                                            </Button>
                                        </div>
                                        {specialization.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {specialization.map((spec, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-sm text-primary"
                                                    >
                                                        {spec}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSpecialization(index)}
                                                            className="hover:text-primary/70"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="bio" className="text-sm font-medium">Professional Bio *</Label>
                                        <Textarea
                                            id="bio"
                                            placeholder="Describe your teaching philosophy, research interests, and expertise..."
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            maxLength={300}
                                            rows={3}
                                            required
                                            className="resize-none text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
                                    </div>
                                </>
                            )}

                            {/* Student Fields */}
                            {userRole === 'student' && (
                                <>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="studentId" className="text-sm font-medium">Student ID *</Label>
                                            <div className="relative">
                                                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="studentId"
                                                    placeholder="e.g., 2024CS001"
                                                    value={studentId}
                                                    onChange={(e) => setStudentId(e.target.value)}
                                                    className="pl-9 h-10"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
                                            <Select value={studentDepartment} onValueChange={setStudentDepartment} required>
                                                <SelectTrigger className="h-10">
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
                                            <SelectTrigger className="h-10">
                                                <SelectValue placeholder="Select semester" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">Skills</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="e.g., MERN, Python, Java"
                                                value={skillInput}
                                                onChange={(e) => setSkillInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                                className="h-10"
                                            />
                                            <Button type="button" onClick={handleAddSkill} size="sm" className="px-4">
                                                Add
                                            </Button>
                                        </div>
                                        {skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-sm text-primary"
                                                    >
                                                        {skill}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSkill(index)}
                                                            className="hover:text-primary/70"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="bio" className="text-sm font-medium">About Me *</Label>
                                        <Textarea
                                            id="bio"
                                            placeholder="Tell us about yourself, your interests, and academic goals..."
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            maxLength={300}
                                            rows={3}
                                            className="resize-none text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 pt-5 border-t border-border/30">
                        <Button type="submit" className="w-full h-11 shadow-sm" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving Profile...
                                </span>
                            ) : (
                                'Complete Profile'
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CompleteProfile;
