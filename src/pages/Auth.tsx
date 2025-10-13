import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import GoogleIcon from '@/components/icons/GoogleIcon';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      setIsLoading(true);

      const { error } = isLogin 
        ? await signIn(validated.email, validated.password)
        : await signUp(validated.email, validated.password);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(isLogin ? 'Logged in successfully!' : 'Account created successfully!');
        if (!isLogin) {
          setIsLogin(true);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error('An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3 justify-center">
            <div className="p-3 bg-primary rounded-xl">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Job Find Assistant</h1>
          </div>
          <div>
            <CardTitle>{isLogin ? 'Welcome back' : 'Create an account'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to track your job applications' 
                : 'Get started with tracking your job search'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Sign in' : 'Sign up')}
            </Button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-lg"
              disabled={isGoogleLoading}
              onClick={() => {
                if (isGoogleLoading) return;
                setIsGoogleLoading(true);
                signInWithGoogle()
                  .then(({ error }) => {
                    if (error) {
                      toast.error(error.message);
                      setIsGoogleLoading(false);
                    }
                    // On success, Supabase redirects; loading stops on return
                  })
                  .catch(() => {
                    toast.error('Failed to start Google sign-in');
                    setIsGoogleLoading(false);
                  });
              }}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <GoogleIcon className="mr-2" />
                  Continue with Google
                </>
              )}
            </Button>
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
