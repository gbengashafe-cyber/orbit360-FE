import { complaintService } from '@/api';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { logger } from '@/utils';
import { format } from 'date-fns';
import { Eye, MessageSquareWarning, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { complaintTypeLabel } from './complaint.constants';
import { ComplaintDetails, ComplaintStatusBadge, UrgencyBadge } from './complaint-details';
import { ComplaintFormDialog } from './complaint-form-dialog';

// Employee Portal: the logged-in employee's own complaints.
export default function StaffComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [rows, setRows] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await complaintService.getMyComplaints({ page: currentPage, rows });
      setComplaints(response?.data ?? []);
      setTotal(response?.pagination?.total ?? 0);
      setPages(response?.pagination?.pages || 1);
    } catch (error) {
      logger.error({ caller: 'Load my complaints', payload: { message: error?.message } });
      setLoadError(error?.message || 'Unable to load your complaints.');
      toast.error('Error', { description: error?.message || 'Unable to load your complaints.' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, rows]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showEmptyState = !loading && !loadError && total === 0;

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
              <p className="text-gray-600">Report workplace issues and track the progress of your complaints.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadData} disabled={loading} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {total > 0 ? (
              <Button
                className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-700/25"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Complaint
              </Button>
            ) : null}
          </div>
        </div>

        <ComplaintFormDialog
          open={showForm}
          onOpenChange={setShowForm}
          onSuccess={() => {
            setCurrentPage(1);
            loadData();
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Your Complaints ({total})</CardTitle>
            <CardDescription>Complaints you have submitted, including anonymous ones.</CardDescription>
          </CardHeader>
          <CardContent>
            {showEmptyState ? (
              <div className="text-center py-12">
                <MessageSquareWarning className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints submitted</h3>
                <p className="text-gray-500 mb-6">You haven&apos;t submitted any complaints yet.</p>
                <Button
                  className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg shadow-blue-700/25"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Complaint
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Complaint ID</TableHead>
                        <TableHead>Complaint Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Date Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                            Loading your complaints...
                          </TableCell>
                        </TableRow>
                      ) : loadError ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24 text-red-700">
                            {loadError}
                          </TableCell>
                        </TableRow>
                      ) : (
                        complaints.map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell className="font-medium whitespace-nowrap">{complaint.reference}</TableCell>
                            <TableCell>{complaintTypeLabel(complaint.complaintType)}</TableCell>
                            <TableCell className="max-w-64 truncate">{complaint.title}</TableCell>
                            <TableCell>
                              <ComplaintStatusBadge status={complaint.status} audience="employee" />
                            </TableCell>
                            <TableCell>
                              <UrgencyBadge value={complaint.severity} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {complaint.submittedAt ? format(new Date(complaint.submittedAt), 'dd-MMM-yyyy') : '—'}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => setViewing(complaint)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complaint {viewing?.reference}</DialogTitle>
            <DialogDescription>Details and current progress of your complaint.</DialogDescription>
          </DialogHeader>
          <ComplaintDetails complaint={viewing} audience="employee" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
