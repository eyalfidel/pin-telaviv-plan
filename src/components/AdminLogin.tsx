import { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = login(password);
    if (success) {
      toast.success('Welcome to the admin panel');
    } else {
      toast.error('Invalid password');
      setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-civic-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-display font-semibold">Admin Access</h1>
            <p className="text-sm opacity-80 mt-1">
              Municipal Staff Only
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-civic"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full btn-civic h-11"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              This area is restricted to authorized municipal personnel only.
            </p>
          </form>
        </div>

        {/* Demo hint */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          Demo password: <code className="bg-muted px-2 py-0.5 rounded">tlv-admin-2024</code>
        </p>
      </div>
    </div>
  );
}
