import { useState } from 'react';
import { 
  Download, 
  Trash2, 
  LogOut, 
  Table as TableIcon, 
  Map,
  Filter,
  Search,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useAdminSubmissions } from '@/hooks/useAdminSubmissions';
import { 
  DbSubmissionStatus, 
  PARKING_CONDITIONS_LABELS, 
  POINTS_OF_INTEREST_LABELS, 
  STATUS_LABELS 
} from '@/types/database';
import { toast } from 'sonner';

type ViewMode = 'table' | 'map';

export default function SecureAdminDashboard() {
  const { signOut } = useAuth();
  const { submissions, isLoading, updateStatus, updateAdminResponse, deleteSubmission } = useAdminSubmissions();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DbSubmissionStatus | 'all'>('all');
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [editingResponseText, setEditingResponseText] = useState('');

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = 
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.comments?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['מזהה','כתובת','שם מדווח','אימייל','טלפון','קו רוחב','קו אורך','מצב חניה','עמדות קיימות','נקודות עניין','הערות','סטטוס','תאריך יצירה'];
    const rows = submissions.map((s) => [
      s.id,
      `"${s.address}"`,
      s.reporterName || '',
      s.email || '',
      s.phone || '',
      s.latitude,
      s.longitude,
      PARKING_CONDITIONS_LABELS[s.parkingCondition],
      s.existingSpacesCount ?? '',
      `"${s.pointsOfInterest.map((poi) => POINTS_OF_INTEREST_LABELS[poi]).join(', ')}"`,
      `"${s.comments || ''}"`,
      STATUS_LABELS[s.status],
      s.createdAt.toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bicycle-parking-submissions.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('הקובץ יוצא בהצלחה');
  };

  const exportToGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: submissions.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
        properties: {
          id: s.id, address: s.address, reporterName: s.reporterName, email: s.email, phone: s.phone,
          parkingCondition: PARKING_CONDITIONS_LABELS[s.parkingCondition],
          existingSpacesCount: s.existingSpacesCount,
          pointsOfInterest: s.pointsOfInterest.map((poi) => POINTS_OF_INTEREST_LABELS[poi]),
          comments: s.comments, status: STATUS_LABELS[s.status], createdAt: s.createdAt.toISOString(),
        },
      })),
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bicycle-parking-submissions.geojson';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('הקובץ יוצא בהצלחה');
  };

  const handleStatusChange = async (id: string, newStatus: DbSubmissionStatus) => {
    const success = await updateStatus(id, newStatus);
    if (success) toast.success(`הסטטוס עודכן`);
    else toast.error('שגיאה בעדכון הסטטוס');
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSubmission(id);
    if (success) toast.success('ההגשה נמחקה');
    else toast.error('שגיאה במחיקה');
  };

  const handleOpenResponseEdit = (id: string, currentResponse?: string) => {
    setEditingResponseId(id);
    setEditingResponseText(currentResponse || '');
  };

  const handleSaveResponse = async () => {
    if (!editingResponseId) return;
    const success = await updateAdminResponse(editingResponseId, editingResponseText);
    if (success) {
      toast.success('התגובה נשמרה');
      setEditingResponseId(null);
      setEditingResponseText('');
    } else {
      toast.error('שגיאה בשמירת התגובה');
    }
  };

  const getStatusBadge = (status: DbSubmissionStatus) => {
    const styles: Record<DbSubmissionStatus, string> = {
      pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
      in_review: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
      approved: 'bg-green-500/20 text-green-700 border-green-500/30',
      rejected: 'bg-destructive/20 text-destructive border-destructive/30',
      hidden: 'bg-muted text-muted-foreground border-muted-foreground/30',
    };
    return <Badge className={styles[status]}>{STATUS_LABELS[status]}</Badge>;
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    in_review: submissions.filter((s) => s.status === 'in_review').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    hidden: submissions.filter((s) => s.status === 'hidden').length,
  };

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><span className="text-muted-foreground">טוען נתונים...</span></div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="bg-card border-b border-border sticky top-16 z-[999]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground">לוח בקרה - מנהל</h1>
              <p className="text-sm text-muted-foreground">ניהול הגשות חניית אופניים (גישה מאובטחת)</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="rounded-none">
                  <TableIcon className="h-4 w-4 ml-1" />טבלה
                </Button>
                <Button variant={viewMode === 'map' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('map')} className="rounded-none">
                  <Map className="h-4 w-4 ml-1" />מפה
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={exportToCSV}><Download className="h-4 w-4 ml-1" />CSV</Button>
              <Button variant="outline" size="sm" onClick={exportToGeoJSON}><Download className="h-4 w-4 ml-1" />GeoJSON</Button>
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 ml-1" />התנתק</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{stats.total}</p><p className="text-xs text-muted-foreground">סה״כ</p></div>
            <div className="bg-warning/10 rounded-lg p-3 text-center"><p className="text-2xl font-semibold text-warning">{stats.pending}</p><p className="text-xs text-muted-foreground">ממתינים</p></div>
            <div className="bg-blue-500/10 rounded-lg p-3 text-center"><p className="text-2xl font-semibold text-blue-600">{stats.in_review}</p><p className="text-xs text-muted-foreground">בבדיקה</p></div>
            <div className="bg-success/10 rounded-lg p-3 text-center"><p className="text-2xl font-semibold text-success">{stats.approved}</p><p className="text-xs text-muted-foreground">מאושרים</p></div>
            <div className="bg-destructive/10 rounded-lg p-3 text-center"><p className="text-2xl font-semibold text-destructive">{stats.rejected}</p><p className="text-xs text-muted-foreground">נדחו</p></div>
            <div className="bg-muted rounded-lg p-3 text-center"><p className="text-2xl font-semibold text-muted-foreground">{stats.hidden}</p><p className="text-xs text-muted-foreground">מוסתרים</p></div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="חיפוש..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 field-civic" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="סטטוס" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>כתובת</TableHead><TableHead>תמונה</TableHead><TableHead>שם מדווח</TableHead><TableHead>פרטי קשר</TableHead><TableHead>מצב חניה</TableHead><TableHead>עמדות קיימות</TableHead><TableHead>סטטוס</TableHead><TableHead>תגובה</TableHead><TableHead>תאריך</TableHead><TableHead className="text-left">פעולות</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">לא נמצאו הגשות</TableCell></TableRow>
                ) : filteredSubmissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="max-w-[200px]"><p className="font-medium truncate">{s.address}</p>{s.comments && <p className="text-xs text-muted-foreground truncate">{s.comments}</p>}</TableCell>
                    <TableCell>
                      {s.photoUrl ? (
                        <a href={s.photoUrl} target="_blank" rel="noopener noreferrer" className="block">
                          <img 
                            src={s.photoUrl} 
                            alt="תמונה" 
                            className="w-12 h-12 object-cover rounded border border-border hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        </a>
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{s.reporterName || '-'}</TableCell>
                    <TableCell><p className="text-sm" dir="ltr">{s.email || '-'}</p><p className="text-xs text-muted-foreground" dir="ltr">{s.phone || '-'}</p></TableCell>
                    <TableCell><p className="text-xs max-w-[150px] line-clamp-2">{PARKING_CONDITIONS_LABELS[s.parkingCondition]}</p></TableCell>
                    <TableCell className="text-center">{s.existingSpacesCount ?? '-'}</TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.adminResponse ? (
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={s.adminResponse}>{s.adminResponse}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleOpenResponseEdit(s.id, s.adminResponse)}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.createdAt.toLocaleDateString('he-IL')}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v as DbSubmissionStatus)}>
                          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>מחיקת הגשה</AlertDialogTitle><AlertDialogDescription>האם אתה בטוח? פעולה זו אינה ניתנת לביטול.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2"><AlertDialogCancel>ביטול</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-destructive-foreground">מחק</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Admin Response Edit Dialog */}
        <Dialog open={!!editingResponseId} onOpenChange={(open) => !open && setEditingResponseId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>עריכת תגובה</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={editingResponseText}
                onChange={(e) => setEditingResponseText(e.target.value)}
                placeholder="הזן תגובה שתוצג לציבור..."
                className="min-h-[120px]"
              />
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button variant="outline" onClick={() => setEditingResponseId(null)}>ביטול</Button>
              <Button onClick={handleSaveResponse}>שמור תגובה</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
