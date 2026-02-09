import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Eye, EyeOff, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: result.message,
      });
      
      // Redirect based on user type
      const userType = localStorage.getItem('profconnect_user_type');
      if (userType === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: result.message,
      });
    }
  };

  const fillDemoCredentials = (type: 'student' | 'faculty') => {
    if (type === 'student') {
      setEmail('student1@profconnect.com');
      setPassword('Student@123');
    } else {
      setEmail('faculty1@profconnect.com');
      setPassword('Faculty@123');
    }
  };

  const demoCredentials = {
    students: [
      { email: 'student1@profconnect.com', password: 'Student@123', name: 'Aisha Patel' },
      { email: 'student2@profconnect.com', password: 'Student@123', name: 'Rohan Kumar' },
      { email: 'student3@profconnect.com', password: 'Student@123', name: 'Priya Singh' },
    ],
    faculty: [
      { email: 'faculty1@profconnect.com', password: 'Faculty@123', name: 'Prof. Rajesh Sharma', dept: 'Computer Science' },
      { email: 'faculty2@profconnect.com', password: 'Faculty@123', name: 'Prof. Meera Verma', dept: 'Electronics' },
      { email: 'faculty3@profconnect.com', password: 'Faculty@123', name: 'Prof. Arjun Malhotra', dept: 'Mechanical Engineering' },
    ],
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">ProfConnect</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Demo buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => fillDemoCredentials('student')}
            >
              Try as Student
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => fillDemoCredentials('faculty')}
            >
              Try as Faculty
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </form>

          {/* Demo credentials accordion */}
          <div className="mt-8 border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">View demo credentials</span>
              {showCredentials ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showCredentials && (
              <div className="p-4 pt-0 border-t border-border bg-accent/20">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Student Accounts</p>
                    <div className="space-y-2">
                      {demoCredentials.students.map((cred, i) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{cred.name}</span>
                          <br />
                          {cred.email} / {cred.password}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Faculty Accounts</p>
                    <div className="space-y-2">
                      {demoCredentials.faculty.map((cred, i) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{cred.name}</span> ({cred.dept})
                          <br />
                          {cred.email} / {cred.password}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(0_0%_100%/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_100%/0.1)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <div className="max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
              Connect. Collaborate. Grow.
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Join thousands of students and faculty members using ProfConnect to build meaningful academic relationships.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
