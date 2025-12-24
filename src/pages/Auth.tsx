import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { z } from 'zod';

const emailSchema = z.string().email('כתובת אימייל לא תקינה');
const passwordSchema = z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים');

export default function Auth() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signIn, signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect authenticated admins to admin page
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, isLoading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('אימייל או סיסמה שגויים');
      } else {
        toast.error('שגיאה בהתחברות: ' + error.message);
      }
    } else {
      toast.success('התחברת בהצלחה');
    }
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('המשתמש כבר רשום במערכת');
      } else {
        toast.error('שגיאה בהרשמה: ' + error.message);
      }
    } else {
      toast.success('נרשמת בהצלחה! כעת תוכל להתחבר.');
    }
    
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setErrors({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-civic-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-6 text-center">
              <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h1 className="text-xl font-display font-semibold">גישת מנהל</h1>
              <p className="text-sm opacity-80 mt-1">
                לעובדי העירייה בלבד
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="signin" className="p-6" onValueChange={resetForm}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">התחברות</TabsTrigger>
                <TabsTrigger value="signup">הרשמה</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      אימייל
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="admin@tel-aviv.gov.il"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field-civic"
                      dir="ltr"
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      סיסמה
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="הזן סיסמה"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="field-civic pl-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-civic h-11"
                  >
                    {isSubmitting ? 'מתחבר...' : 'התחבר'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      אימייל
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="admin@tel-aviv.gov.il"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field-civic"
                      dir="ltr"
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      סיסמה
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="לפחות 6 תווים"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="field-civic pl-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-civic h-11"
                  >
                    {isSubmitting ? 'נרשם...' : 'הירשם'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    הרשמה זו מיועדת לצוות העירייה בלבד.
                    <br />
                    לאחר ההרשמה, מנהל מערכת יאשר את הרשאות הגישה.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            אזור זה מוגבל לצוות העירייה המורשה בלבד.
          </p>
        </div>
      </div>
    </div>
  );
}
