import { useState, useRef } from 'react';
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
  Pencil,
  Upload,
  Loader2,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminMapView from '@/components/AdminMapView';
// @ts-ignore - no types
import * as shpwrite from '@mapbox/shp-write';
import { useAuth } from '@/hooks/useAuth';
import { useAdminSubmissions, SubmissionUpdateData } from '@/hooks/useAdminSubmissions';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { 
  DbSubmissionStatus,
  DbParkingCondition,
  DbPointOfInterest,
  AdminSubmission,
  PARKING_CONDITIONS_LABELS, 
  PARKING_CONDITIONS_ORDER,
  POINTS_OF_INTEREST_LABELS, 
  STATUS_LABELS 
} from '@/types/database';
import { toast } from 'sonner';

type ViewMode = 'table' | 'map';

export default function SecureAdminDashboard() {
  const { signOut } = useAuth();
  const { submissions, isLoading, updateStatus, updateAdminResponse, updateSubmission, deleteSubmission, refetch } = useAdminSubmissions();
  const { submissionsOpen, isLoading: isSettingsLoading, setSubmissionsOpen } = useSiteSettings();
  const [isTogglingSubmissions, setIsTogglingSubmissions] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DbSubmissionStatus | 'all'>('all');
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [editingResponseText, setEditingResponseText] = useState('');
  const [responsePhotoFile, setResponsePhotoFile] = useState<File | null>(null);
  const [responsePhotoPreview, setResponsePhotoPreview] = useState<string | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<AdminSubmission | null>(null);
  const [editFormData, setEditFormData] = useState<SubmissionUpdateData>({});
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const responsePhotoInputRef = useRef<HTMLInputElement>(null);

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
      `"${(s.address || '').replace(/"/g, '""')}"`,
      `"${(s.reporterName || '').replace(/"/g, '""')}"`,
      s.email || '',
      s.phone || '',
      s.latitude,
      s.longitude,
      `"${PARKING_CONDITIONS_LABELS[s.parkingCondition]}"`,
      s.existingSpacesCount ?? '',
      `"${s.pointsOfInterest.map((poi) => POINTS_OF_INTEREST_LABELS[poi]).join(', ')}"`,
      `"${(s.comments || '').replace(/"/g, '""')}"`,
      `"${STATUS_LABELS[s.status]}"`,
      s.createdAt.toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
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

  const escapeXml = (str: string) =>
    String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const exportToKML = () => {
    const placemarks = submissions.map((s) => {
      const name = escapeXml(s.address || 'נקודת חניה');
      const desc = escapeXml(
        [
          `סטטוס: ${STATUS_LABELS[s.status]}`,
          `מצב חניה: ${PARKING_CONDITIONS_LABELS[s.parkingCondition]}`,
          s.existingSpacesCount != null ? `עמדות קיימות: ${s.existingSpacesCount}` : '',
          s.pointsOfInterest.length
            ? `נקודות עניין: ${s.pointsOfInterest.map((p) => POINTS_OF_INTEREST_LABELS[p]).join(', ')}`
            : '',
          s.comments ? `הערות: ${s.comments}` : '',
          `תאריך: ${s.createdAt.toLocaleDateString('he-IL')}`,
        ]
          .filter(Boolean)
          .join('\n')
      );
      return `    <Placemark>
      <name>${name}</name>
      <description><![CDATA[${desc}]]></description>
      <Point><coordinates>${s.longitude},${s.latitude},0</coordinates></Point>
    </Placemark>`;
    }).join('\n');

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>חניות אופניים - תל אביב</name>
${placemarks}
  </Document>
</kml>`;

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bicycle-parking-submissions.kml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('הקובץ יוצא בהצלחה (KML)');
  };

  const exportToShapefile = async () => {
    try {
      const geojson = {
        type: 'FeatureCollection',
        features: submissions.map((s) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
          properties: {
            // Shapefile DBF field names limited to 10 chars ASCII
            id: s.id.slice(0, 8),
            address: (s.address || '').slice(0, 200),
            reporter: (s.reporterName || '').slice(0, 100),
            email: (s.email || '').slice(0, 100),
            phone: (s.phone || '').slice(0, 30),
            condition: PARKING_CONDITIONS_LABELS[s.parkingCondition].slice(0, 200),
            spaces: s.existingSpacesCount ?? 0,
            poi: s.pointsOfInterest.map((p) => POINTS_OF_INTEREST_LABELS[p]).join('; ').slice(0, 200),
            comments: (s.comments || '').slice(0, 250),
            status: STATUS_LABELS[s.status],
            created: s.createdAt.toISOString().slice(0, 10),
          },
        })),
      };

      const options = {
        folder: 'bicycle-parking',
        filename: 'bicycle-parking',
        outputType: 'blob',
        compression: 'DEFLATE',
        types: { point: 'bicycle_parking' },
      };

      const result: any = await shpwrite.zip(geojson as any, options as any);
      const blob = result instanceof Blob ? result : new Blob([result], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bicycle-parking-shapefile.zip';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('הקובץ יוצא בהצלחה (Shapefile)');
    } catch (err) {
      console.error('Shapefile export error:', err);
      toast.error('שגיאה בייצוא Shapefile');
    }
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

  const handleToggleSubmissions = async (open: boolean) => {
    setIsTogglingSubmissions(true);
    const success = await setSubmissionsOpen(open);
    setIsTogglingSubmissions(false);
    if (success) {
      toast.success(open ? 'המפה פתוחה לדיווחים חדשים' : 'המפה סגורה לדיווחים חדשים');
    } else {
      toast.error('שגיאה בעדכון סטטוס הדיווחים');
    }
  };

  const uploadPhoto = async (file: File, submissionId: string, prefix: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${prefix}_${submissionId}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('submission-photos')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('submission-photos')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  };

  const handleOpenResponseEdit = (id: string, currentResponse?: string) => {
    setEditingResponseId(id);
    setEditingResponseText(currentResponse || '');
    setResponsePhotoFile(null);
    setResponsePhotoPreview(null);
  };

  const handleSaveResponse = async () => {
    if (!editingResponseId) return;
    setIsUploading(true);
    
    try {
      // Upload response photo if provided
      let adminPhotoUrl: string | undefined;
      if (responsePhotoFile) {
        const url = await uploadPhoto(responsePhotoFile, editingResponseId, 'admin');
        if (!url) {
          toast.error('שגיאה בהעלאת התמונה');
          setIsUploading(false);
          return;
        }
        adminPhotoUrl = url;
      }

      // Save text response
      const success = await updateAdminResponse(editingResponseId, editingResponseText, adminPhotoUrl);
      if (success) {
        toast.success('התגובה נשמרה');
        setEditingResponseId(null);
        setEditingResponseText('');
        setResponsePhotoFile(null);
        setResponsePhotoPreview(null);
      } else {
        toast.error('שגיאה בשמירת התגובה');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEdit = (submission: AdminSubmission) => {
    setEditingSubmission(submission);
    setEditFormData({
      address: submission.address,
      parkingCondition: submission.parkingCondition,
      pointsOfInterest: [...submission.pointsOfInterest],
      otherPoiText: submission.otherPoiText || '',
      comments: submission.comments || '',
      reporterName: submission.reporterName || '',
      email: submission.email || '',
      phone: submission.phone || '',
      existingSpacesCount: submission.existingSpacesCount ?? null,
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
  };

  const handleSaveEdit = async () => {
    if (!editingSubmission) return;
    setIsUploading(true);

    try {
      // Upload new photo if provided
      let photoUrl: string | undefined;
      if (editPhotoFile) {
        const url = await uploadPhoto(editPhotoFile, editingSubmission.id, 'report');
        if (!url) {
          toast.error('שגיאה בהעלאת התמונה');
          setIsUploading(false);
          return;
        }
        photoUrl = url;
      }

      const dataToUpdate = { ...editFormData };
      if (photoUrl) {
        (dataToUpdate as any).photoUrl = photoUrl;
      }

      const success = await updateSubmission(editingSubmission.id, dataToUpdate);
      if (success) {
        toast.success('הפרטים עודכנו בהצלחה');
        setEditingSubmission(null);
        setEditFormData({});
        setEditPhotoFile(null);
        setEditPhotoPreview(null);
      } else {
        toast.error('שגיאה בעדכון הפרטים');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhotoFile(file);
      setEditPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleResponsePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResponsePhotoFile(file);
      setResponsePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePoiToggle = (poi: DbPointOfInterest) => {
    const current = editFormData.pointsOfInterest || [];
    if (current.includes(poi)) {
      setEditFormData({ ...editFormData, pointsOfInterest: current.filter(p => p !== poi) });
    } else {
      setEditFormData({ ...editFormData, pointsOfInterest: [...current, poi] });
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
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 bg-muted/30">
                {submissionsOpen ? (
                  <Unlock className="h-4 w-4 text-success" />
                ) : (
                  <Lock className="h-4 w-4 text-destructive" />
                )}
                <Label htmlFor="submissions-open-toggle" className="text-sm font-medium cursor-pointer">
                  {submissionsOpen ? 'דיווחים חדשים פתוחים' : 'דיווחים חדשים סגורים'}
                </Label>
                <Switch
                  id="submissions-open-toggle"
                  checked={submissionsOpen}
                  disabled={isSettingsLoading || isTogglingSubmissions}
                  onCheckedChange={handleToggleSubmissions}
                />
              </div>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="rounded-none">
                  <TableIcon className="h-4 w-4 ml-1" />טבלה
                </Button>
                <Button variant={viewMode === 'map' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('map')} className="rounded-none">
                  <Map className="h-4 w-4 ml-1" />מפה
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 ml-1" />
                    הורדה
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[1000]">
                  <DropdownMenuLabel>פורמטים לטבלה</DropdownMenuLabel>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <Download className="h-4 w-4 ml-2" />
                    CSV (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>שכבות GIS</DropdownMenuLabel>
                  <DropdownMenuItem onClick={exportToGeoJSON}>
                    <Download className="h-4 w-4 ml-2" />
                    GeoJSON (.geojson)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToShapefile}>
                    <Download className="h-4 w-4 ml-2" />
                    Shapefile (.zip)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToKML}>
                    <Download className="h-4 w-4 ml-2" />
                    KML (Google Earth)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          {viewMode === 'table' ? (
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
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(s)} title="עריכה">
                          <Pencil className="h-4 w-4" />
                        </Button>
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
          ) : (
          <div className="relative h-[70vh] min-h-[500px]">
            <AdminMapView submissions={filteredSubmissions} onMarkerClick={handleOpenEdit} />
          </div>
          )}
        </div>

        {/* Admin Response Edit Dialog */}
        <Dialog open={!!editingResponseId} onOpenChange={(open) => !open && setEditingResponseId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>עריכת תגובה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>תגובת הצוות</Label>
                <Textarea
                  value={editingResponseText}
                  onChange={(e) => setEditingResponseText(e.target.value)}
                  placeholder="הזן תגובה שתוצג לציבור..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label>תמונת מצב סופי</Label>
                <p className="text-xs text-muted-foreground">תמונה זו תוצג בדיווח עם תגית &quot;מצב סופי&quot;</p>
                <input
                  ref={responsePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleResponsePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => responsePhotoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 ml-2" />
                  העלאת תמונה
                </Button>
                {responsePhotoPreview && (
                  <div className="mt-2">
                    <img src={responsePhotoPreview} alt="תצוגה מקדימה" className="w-full max-h-32 object-cover rounded border border-border" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button variant="outline" onClick={() => setEditingResponseId(null)}>ביטול</Button>
              <Button onClick={handleSaveResponse} disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                שמור תגובה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Submission Dialog */}
        <Dialog open={!!editingSubmission} onOpenChange={(open) => !open && setEditingSubmission(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>עריכת דיווח</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6 py-4">
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="edit-address">כתובת</Label>
                  <Input
                    id="edit-address"
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label>תמונת דיווח</Label>
                  {editingSubmission?.photoUrl && !editPhotoPreview && (
                    <div className="mb-2">
                      <img src={editingSubmission.photoUrl} alt="תמונה נוכחית" className="w-full max-h-32 object-cover rounded border border-border" />
                      <p className="text-xs text-muted-foreground mt-1">תמונה נוכחית</p>
                    </div>
                  )}
                  <input
                    ref={editPhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editPhotoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    {editingSubmission?.photoUrl ? 'החלפת תמונה' : 'העלאת תמונה'}
                  </Button>
                  {editPhotoPreview && (
                    <div className="mt-2">
                      <img src={editPhotoPreview} alt="תצוגה מקדימה" className="w-full max-h-32 object-cover rounded border border-border" />
                      <p className="text-xs text-muted-foreground mt-1">תמונה חדשה</p>
                    </div>
                  )}
                </div>

                {/* Parking Condition */}
                <div className="space-y-2">
                  <Label>מצב חניית אופניים</Label>
                  <RadioGroup
                    value={editFormData.parkingCondition}
                    onValueChange={(value) => setEditFormData({ 
                      ...editFormData, 
                      parkingCondition: value as DbParkingCondition,
                      existingSpacesCount: value !== 'existing_needs_more' ? null : editFormData.existingSpacesCount
                    })}
                    className="space-y-2"
                    dir="rtl"
                  >
                    {PARKING_CONDITIONS_ORDER.map((key) => (
                      <div key={key} className="flex items-start gap-3">
                        <RadioGroupItem value={key} id={`edit-${key}`} className="mt-0.5 shrink-0" />
                        <Label htmlFor={`edit-${key}`} className="text-sm text-muted-foreground leading-tight cursor-pointer">
                          {PARKING_CONDITIONS_LABELS[key]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Existing Spaces Count */}
                {editFormData.parkingCondition === 'existing_needs_more' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-spaces-count">מספר עמדות קיימות</Label>
                    <Input
                      id="edit-spaces-count"
                      type="number"
                      min="0"
                      value={editFormData.existingSpacesCount ?? ''}
                      onChange={(e) => setEditFormData({ 
                        ...editFormData, 
                        existingSpacesCount: e.target.value ? parseInt(e.target.value) : null 
                      })}
                    />
                  </div>
                )}

                {/* Points of Interest */}
                <div className="space-y-2">
                  <Label>נקודות עניין</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(POINTS_OF_INTEREST_LABELS) as DbPointOfInterest[]).map((poi) => (
                      <div key={poi} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-poi-${poi}`}
                          checked={(editFormData.pointsOfInterest || []).includes(poi)}
                          onCheckedChange={() => handlePoiToggle(poi)}
                        />
                        <Label htmlFor={`edit-poi-${poi}`} className="text-sm cursor-pointer">
                          {POINTS_OF_INTEREST_LABELS[poi]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other POI Text */}
                {(editFormData.pointsOfInterest || []).includes('other') && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-other-poi">פירוט נקודת עניין אחרת</Label>
                    <Input
                      id="edit-other-poi"
                      value={editFormData.otherPoiText || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, otherPoiText: e.target.value })}
                    />
                  </div>
                )}

                {/* Comments */}
                <div className="space-y-2">
                  <Label htmlFor="edit-comments">הערות</Label>
                  <Textarea
                    id="edit-comments"
                    value={editFormData.comments || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, comments: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Reporter Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-reporter">שם מדווח</Label>
                  <Input
                    id="edit-reporter"
                    value={editFormData.reporterName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, reporterName: e.target.value })}
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">אימייל</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      dir="ltr"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">טלפון</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      dir="ltr"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button variant="outline" onClick={() => setEditingSubmission(null)}>ביטול</Button>
              <Button onClick={handleSaveEdit} disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                שמור שינויים
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
