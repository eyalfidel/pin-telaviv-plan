import { useState } from 'react';
import { 
  Download, 
  Eye, 
  EyeOff, 
  Trash2, 
  LogOut, 
  Table as TableIcon, 
  Map,
  Filter,
  Search,
  Check,
  X
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
import { BicycleSubmission, PARKING_CONDITIONS, POINTS_OF_INTEREST, SubmissionStatus } from '@/types/submission';
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
      'ID',
      'Address',
      'Email',
      'Phone',
      'Latitude',
      'Longitude',
      'Parking Condition',
      'Points of Interest',
      'Comments',
      'Status',
      'Created At',
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
      s.status,
      s.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, 'bicycle-parking-submissions.csv', 'text/csv');
    toast.success('CSV exported successfully');
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
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        },
      })),
    };

    downloadFile(JSON.stringify(geojson, null, 2), 'bicycle-parking-submissions.geojson', 'application/json');
    toast.success('GeoJSON exported successfully');
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
    toast.success(`Submission ${newStatus}`);
  };

  const handleDelete = (id: string) => {
    deleteSubmission(id);
    toast.success('Submission deleted');
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="badge-approved">Approved</Badge>;
      case 'pending':
        return <Badge className="badge-pending">Pending</Badge>;
      case 'hidden':
        return <Badge className="badge-hidden">Hidden</Badge>;
    }
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
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
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage bicycle parking submissions
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
                  <TableIcon className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="rounded-none"
                >
                  <Map className="h-4 w-4 mr-1" />
                  Map
                </Button>
              </div>

              {/* Export Buttons */}
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToGeoJSON}>
                <Download className="h-4 w-4 mr-1" />
                GeoJSON
              </Button>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-warning/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-warning">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-success">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-muted-foreground">{stats.hidden}</p>
              <p className="text-xs text-muted-foreground">Hidden</p>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address, email, or comments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 field-civic"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>POI</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No submissions found
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
                            <p className="text-sm">{submission.email}</p>
                            <p className="text-xs text-muted-foreground">{submission.phone}</p>
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
                            {submission.createdAt.toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {submission.status !== 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusChange(submission.id, 'approved')}
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4 text-success" />
                                </Button>
                              )}
                              {submission.status !== 'hidden' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusChange(submission.id, 'hidden')}
                                  title="Hide"
                                >
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                              {submission.status === 'hidden' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusChange(submission.id, 'pending')}
                                  title="Show"
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" title="Delete">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete this submission? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(submission.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
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
