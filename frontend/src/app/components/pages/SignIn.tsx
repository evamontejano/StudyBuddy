import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { API_BASE_URL } from '../../../lib/api';

export function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Invalid credentials', {
            duration: 2000,
          });
          throw new Error(errorData.error || 'Invalid credentials');
        }
        throw new Error('An error occurred. Please try again.');
      }

      const data = await response.json();
      
      // Store authentication data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId.toString());
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);

      // Show success toast
      toast.success('Successfully logged in! Welcome back.', {
        duration: 2000,
      });

      // Navigate to dashboard after toast dismisses
      setTimeout(() => {
        navigate('/dashboard');
      }, 2100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4 relative">
      <Link to="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" className="h-12 w-12 p-2">
          <ArrowLeft className="h-full w-full" />
        </Button>
      </Link>
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <span className="font-semibold text-2xl">Study Buddy</span>
          </Link>
          <h1 className="text-2xl mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your account to continue learning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {/* <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link> */}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute right-0 top-0 h-full hover:bg-accent hover:text-accent-foreground ${!formData.password ? 'invisible' : ''}`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={formData.remember}
              onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div> */}

          <Button type="submit" className="w-full" size="lg" disabled={!formData.email || !formData.password || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
