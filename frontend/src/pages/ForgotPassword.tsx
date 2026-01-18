import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/auth';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast({
                variant: 'destructive',
                title: 'Email Required',
                description: 'Please enter your email address',
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.data.success) {
                setEmailSent(true);
                toast({
                    title: 'Email Sent!',
                    description: response.data.data.message,
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Request Failed',
                description: error.response?.data?.message || 'Could not process your request',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link to="/login">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Button>
                </Link>

                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                            <Mail className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="font-display text-2xl">Forgot Password?</CardTitle>
                            <CardDescription className="mt-2">
                                {emailSent
                                    ? 'Check your email for reset instructions'
                                    : 'Enter your email to receive a password reset link'}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {!emailSent ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </span>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>

                                <p className="text-center text-sm text-muted-foreground">
                                    Remember your password?{' '}
                                    <Link to="/login" className="text-primary hover:underline font-medium">
                                        Sign in
                                    </Link>
                                </p>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <p className="text-sm text-center text-foreground">
                                        If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                                    </p>
                                </div>

                                <p className="text-xs text-center text-muted-foreground">
                                    Didn't receive an email? Check your spam folder or{' '}
                                    <button
                                        onClick={() => setEmailSent(false)}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        try again
                                    </button>
                                </p>

                                <Link to="/login">
                                    <Button variant="outline" className="w-full">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
