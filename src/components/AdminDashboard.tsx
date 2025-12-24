import { useState } from 'react';
import { 
  Download, 
  Trash2, 
  LogOut, 
  Table as TableIcon, 
  Map,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useSubmissionStore } from '@/store/submissionStore';
import { useAdminStore } from '@/store/adminStore';
import { BicycleSubmission, PARKING_CONDITIONS, POINTS_OF_INTEREST, SubmissionStatus, STATUS_LABELS } from '@/types/submission';
import BicycleMap from '@/components/BicycleMap';
import { toast } from 'sonner';

type ViewMode = 'table' | 'map';

export default function AdminDashboard() {
  const { submissions, updateSubmissionStatus, deleteSubmission, setSelectedSubmission, selectedSubmission } = useSubmissionStore();
  const { logout } = useAdminStore();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = 
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.comments?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = [
      'מזהה',
      'כתובת',
      'אימייל',
      'טלפון',
      'קו רוחב',
      'קו אורך',
      'מצב חניה',
      'נקודות עניין',
      'הערות',
      'סטטוס',
      'תאריך יצירה',
    ];

    const rows = submissions.map((s) => [
      s.id,
      `"${s.address}"`,
      s.email,
      s.phone,
      s.latitude,
      s.longitude,
      PARKING_CONDITIONS[s.parkingCondition],
      `"${s.pointsOfInterest.map((poi) => POINTS_OF_INTEREST[poi]).join(', ')}"`,
      `"${s.comments || ''}"`,
      STATUS_LABELS[s.status],
      s.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, 'bicycle-parking-submissions.csv', 'text/csv;charset=utf-8');
    toast.success('הקובץ יוצא בהצלחה');
  };

  const exportToGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: submissions.map((s) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [s.longitude, s.latitude],
        },
        properties: {
          id: s.id,
          address: s.address,
          email: s.email,
          phone: s.phone,
          parkingCondition: PARKING_CONDITIONS[s.parkingCondition],
          pointsOfInterest: s.pointsOfInterest.map((poi) => POINTS_OF_INTEREST[poi]),
          comments: s.comments,
          status: STATUS_LABELS[s.status],
          createdAt: s.createdAt.toISOString(),
        },
      })),
    };

    downloadFile(JSON.stringify(geojson, null, 2), 'bicycle-parking-submissions.geojson', 'application/json');
    toast.success('הקובץ יוצא בהצלחה');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = (id: string, newStatus: SubmissionStatus) => {
    updateSubmissionStatus(id, newStatus);
    toast.success(`ההגשה ${STATUS_LABELS[newStatus]}`);
  };

  const handleDelete = (id: string) => {
    deleteSubmission(id);
    toast.success('ההגשה נמחקה');
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="badge-approved">{STATUS_LABELS.approved}</Badge>;
      case 'pending':
        return <Badge className="badge-pending">{STATUS_LABELS.pending}</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">{STATUS_LABELS.in_review}</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">{STATUS_LABELS.rejected}</Badge>;
      case 'hidden':
        return <Badge className="badge-hidden">{STATUS_LABELS.hidden}</Badge>;
    }
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    in_review: submissions.filter((s) => s.status === 'in_review').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    hidden: submissions.filter((s) => s.status === 'hidden').length,
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      {/* Header Bar */}
      <div className="bg-card border-b border-border sticky top-16 z-[999]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground">
                לוח בקרה
              </h1>
              <p className="text-sm text-muted-foreground">
                ניהול הגשות חניית אופניים
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-none"
                >
                  <TableIcon className="h-4 w-4 ml-1" />
                  טבלה
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="rounded-none"
                >
                  <Map className="h-4 w-4 ml-1" />
                  מפה
                </Button>
              </div>

              {/* Export Buttons */}
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 ml-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToGeoJSON}>
                <Download className="h-4 w-4 ml-1" />
                GeoJSON
              </Button>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 ml-1" />
                התנתק
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">סה״כ</p>
            </div>
            <div className="bg-warning/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-warning">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">ממתינים</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-blue-600">{stats.in_review}</p>
              <p className="text-xs text-muted-foreground">בבדיקה</p>
            </div>
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-success">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">מאושרים</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-destructive">{stats.rejected}</p>
              <p className="text-xs text-muted-foreground">נדחו</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-muted-foreground">{stats.hidden}</p>
              <p className="text-xs text-muted-foreground">מוסתרים</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {viewMode === 'table' ? (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש לפי כתובת, אימייל או הערות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 field-civic"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="pending">{STATUS_LABELS.pending}</SelectItem>
                  <SelectItem value="in_review">{STATUS_LABELS.in_review}</SelectItem>
                  <SelectItem value="approved">{STATUS_LABELS.approved}</SelectItem>
                  <SelectItem value="rejected">{STATUS_LABELS.rejected}</SelectItem>
                  <SelectItem value="hidden">{STATUS_LABELS.hidden}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>כתובת</TableHead>
                      <TableHead>פרטי קשר</TableHead>
                      <TableHead>מצב חניה</TableHead>
                      <TableHead>נ״ע</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>תאריך</TableHead>
                      <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          לא נמצאו הגשות
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="max-w-[200px]">
                            <p className="font-medium truncate">{submission.address}</p>
                            {submission.comments && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {submission.comments}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm" dir="ltr">{submission.email}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{submission.phone}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs max-w-[150px] line-clamp-2">
                              {PARKING_CONDITIONS[submission.parkingCondition].split(',')[0]}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {submission.pointsOfInterest.slice(0, 2).map((poi) => (
                                <Badge key={poi} variant="secondary" className="text-xs">
                                  {POINTS_OF_INTEREST[poi].split(' ')[0]}
                                </Badge>
                              ))}
                              {submission.pointsOfInterest.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{submission.pointsOfInterest.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {submission.createdAt.toLocaleDateString('he-IL')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Select 
                                value={submission.status} 
                                onValueChange={(v) => handleStatusChange(submission.id, v as SubmissionStatus)}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">{STATUS_LABELS.pending}</SelectItem>
                                  <SelectItem value="in_review">{STATUS_LABELS.in_review}</SelectItem>
                                  <SelectItem value="approved">{STATUS_LABELS.approved}</SelectItem>
                                  <SelectItem value="rejected">{STATUS_LABELS.rejected}</SelectItem>
                                  <SelectItem value="hidden">{STATUS_LABELS.hidden}</SelectItem>
                                </SelectContent>
                              </Select>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" title="מחק">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>מחיקת הגשה</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      האם אתה בטוח שברצונך למחוק הגשה זו לצמיתות? פעולה זו אינה ניתנת לביטול.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-row-reverse gap-2">
                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(submission.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      מחק
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : (
          /* Map View */
          <div className="h-[calc(100vh-20rem)] rounded-lg overflow-hidden border border-border">
            <BicycleMap 
              showAllSubmissions={true}
              onMarkerClick={(submission) => setSelectedSubmission(submission)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
