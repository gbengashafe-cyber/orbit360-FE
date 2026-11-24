import { complaintService } from '@/api';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalContext } from '@/state/context';
import { logger } from '@/utils';
import { format } from 'date-fns';
import { Eye, MessageSquareWarning, RefreshCw, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { complaintTypeLabel, submitterName } from './complaint.constants';
import { ComplaintStatusBadge, UrgencyBadge } from './complaint-details';
import { ComplaintReviewDialog } from './complaint-review-dialog';

const VIEWS = [
  { value: 'PENDING_REVIEW', label: 'Awaiting HR Officer' },
  { value: 'PENDING_APPROVAL', label: 'Awaiting HR Manager' },
  { value: 'all', label: 'All Complaints' },
];

const hasPermission = (user, permission) =>
  (user?.permissions ?? []).some((value) => value?.toString().toUpperCase() === permission);

// HR Officer / HR Manager: all complaints and their progress.
export default function ComplaintManagement() {
  const { currentUser, isLoadingUser } = useGlobalContext();
  const canReview = hasPermission(currentUser, 'MANAGE_COMPLAINTS');
  const canAuthorize = hasPermission(currentUser, 'APPROVE_COMPLAINTS');

  const [view, setView] = useState(canAuthorize && !canReview ? 'PENDING_APPROVAL' : 'PENDING_REVIEW');
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState(1);

  const allowed = canReview || canAuthorize;

  // HR Managers start on their own queue once permissions are known.
  useEffect(() => {
    if (canAuthorize && !canReview) {
      setView('PENDING_APPROVAL');
    }
  }, [canAuthorize, canReview]);

  const loadData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await complaintService.getComplaints({
        page: currentPage,
        rows,
        status: view === 'all' ? undefined : view,
      });
      setComplaints(response?.data ?? []);
      setTotal(response?.pagination?.total ?? 0);
      setPages(response?.pagination?.pages || 1);
    } catch (error) {
      logger.error({ caller: 'Load complaints for HR', payload: { message: error?.message } });
      setLoadError(error?.message || 'Unable to load complaints.');
      toast.error('Error', { description: error?.message || 'Unable to load complaints.' });
    } finally {
      setLoading(false);
    }
  }, [allowed, currentPage, rows, view]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoadingUser) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!allowed) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don&apos;t have permission to manage staff complaints.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <MessageSquareWarning className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Complaints</h1>
              <p className="text-gray-600">
                {canReview
                  ? 'Review complaints submitted by employees.'
                  : 'Track complaints and their approval history. Authorize pending complaints in the Authorization Center.'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Complaints ({total})</CardTitle>
              <CardDescription>Identities are hidden for complaints submitted anonymously.</CardDescription>
            </div>
            <Tabs
              value={view}
              onValueChange={(value) => {
                setView(value);
                setCurrentPage(1);
              }}
            >
              <TabsList className="flex flex-wrap justify-start h-auto gap-x-4">
                {VIEWS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value} className="py-2 px-6">
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Complaint Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">
                        Loading complaints...
                      </TableCell>
                    </TableRow>
                  ) : loadError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24 text-red-700">
                        {loadError}
                      </TableCell>
                    </TableRow>
                  ) : complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">
                        No complaints found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-medium whitespace-nowrap">{complaint.reference}</TableCell>
                        <TableCell className={complaint.isAnonymous ? 'italic text-gray-500' : ''}>
                          {submitterName(complaint)}
                        </TableCell>
                        <TableCell>{complaintTypeLabel(complaint.complaintType)}</TableCell>
                        <TableCell className="max-w-56 truncate">{complaint.title}</TableCell>
                        <TableCell>
                          <UrgencyBadge value={complaint.severity} />
                        </TableCell>
                        <TableCell>
                          <ComplaintStatusBadge status={complaint.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {complaint.submittedAt ? format(new Date(complaint.submittedAt), 'dd-MMM-yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setSelected(complaint)}>
                            <Eye className="w-4 h-4 mr-1" />
                            {canReview && complaint.status === 'PENDING_REVIEW' ? 'Review' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {complaints.length > 0 && !loading ? (
              <div className="my-10">
                <PaginationIconsOnly
                  setCurrentPage={setCurrentPage}
                  setRows={setRows}
                  rows={rows}
                  pages={pages}
                  currentPage={currentPage}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <ComplaintReviewDialog
        complaint={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        canReview={canReview}
        canAuthorize={canAuthorize}
        onReviewed={loadData}
      />
    </div>
  );
}
