import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminRow {
  user_id: string;
  email: string;
  created_at: string;
}

// Lets an existing admin add or remove other admins, via the
// list_admins/add_admin_by_email/remove_admin Postgres functions (each of
// which independently checks the caller is an admin - this screen is a
// thin UI over that, not where the actual access control lives).
export default function AdminUsersManagement() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadAdmins = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('list_admins');
    if (error) {
      toast.error('שגיאה בטעינת רשימת האדמינים: ' + error.message);
    } else {
      setAdmins(data ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsAdding(true);
    const { error } = await supabase.rpc('add_admin_by_email', { target_email: newEmail.trim() });
    setIsAdding(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('האדמין נוסף בהצלחה');
      setNewEmail('');
      loadAdmins();
    }
  };

  const handleRemove = async (userId: string) => {
    const { error } = await supabase.rpc('remove_admin', { target_user_id: userId });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('הוסרו הרשאות הניהול');
      loadAdmins();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-semibold text-foreground">ניהול אדמינים</h1>
          <p className="text-sm text-muted-foreground">הוספה והסרה של הרשאות ניהול</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <Label className="text-sm font-medium text-foreground mb-2 block">הוספת אדמין חדש</Label>
        <p className="text-xs text-muted-foreground mb-3">
          המשתמש חייב להירשם קודם דרך מסך ההתחברות (/auth) לפני שאפשר להוסיף לו הרשאת ניהול.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="admin@tel-aviv.gov.il"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="field-civic flex-1"
            dir="ltr"
            required
          />
          <Button type="submit" disabled={isAdding} className="btn-civic">
            <UserPlus className="h-4 w-4 ml-2" />
            {isAdding ? 'מוסיף...' : 'הוסף אדמין'}
          </Button>
        </form>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">אדמינים קיימים ({admins.length})</h2>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">טוען...</div>
        ) : admins.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">לא נמצאו אדמינים</div>
        ) : (
          <ul className="divide-y divide-border">
            {admins.map((admin) => {
              const isSelf = admin.user_id === user?.id;
              return (
                <li key={admin.user_id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground" dir="ltr">
                      {admin.email}
                      {isSelf && <span className="mr-2 text-xs text-muted-foreground">(אתה)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      אדמין מתאריך {new Date(admin.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isSelf} title={isSelf ? 'לא ניתן להסיר את עצמך' : 'הסר הרשאת ניהול'}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>הסרת הרשאת ניהול</AlertDialogTitle>
                        <AlertDialogDescription>
                          האם אתה בטוח שברצונך להסיר את הרשאת הניהול של {admin.email}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemove(admin.user_id)} className="bg-destructive text-destructive-foreground">
                          הסר
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
