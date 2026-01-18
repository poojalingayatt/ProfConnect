import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/auth';

const VerifyEmail = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        verifyEmail();
    }, [token]);

    const verifyEmail = async () => {
        try {
            const response = await api.get(`/auth/verify-email/${token}`);
            if (response.data.success) {
                setStatus('success');
                setMessage(response.data.data.message || 'Email verified successfully!');

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
        }
    };

    const handleResendVerification = async () => {
        if (!email.trim()) {
            toast({
                variant: 'destructive',
                title: 'Email Required',
                description: 'Please enter your email address',
            });
            return;
        }

        setIsResending(true);
        try {
            const response = await api.post('/auth/resend-verification', { email });
            if (response.data.success) {
                toast({
                    title: 'Email Sent!',
                    description: 'Please check your inbox for the verification link.',
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Send',
                description: error.response?.data?.message || 'Could not send verification email',
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-border/50 shadow-xl">
                <CardHeader className="text-center space-y-4">
                    {status === 'loading' && (
                        <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="mx-auto w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="mx-auto w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                    )}

                    <div>
                        <CardTitle className="font-display text-2xl">
                            {status === 'loading' && 'Verifying Your Email'}
                            {status === 'success' && 'Email Verified!'}
                            {status === 'error' && 'Verification Failed'}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            {status === 'loading' && 'Please wait while we verify your email address...'}
                            {status === 'success' && 'Redirecting you to login...'}
                            {status === 'error' && message}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {status === 'success' && (
                        <>
                            <p className="text-sm text-center text-muted-foreground">
                                Your account has been verified! You can now log in.
                            </p>
                            <Button onClick={() => navigate('/login')} className="w-full">
                                Go to Login
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="space-y-3">
                                <p className="text-sm text-center text-muted-foreground">
                                    Didn't receive the email? Enter your email to resend:
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <Button onClick={handleResendVerification} disabled={isResending}>
                                        {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <Link to="/login">
                                <Button variant="outline" className="w-full">
                                    Back to Login
                                </Button>
                            </Link>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmail;
