import { complaintService } from '@/api';
import { DateRangePicker } from '@/components/shared/date-picker';
import { DebouncedSearch } from '@/components/shared/debounced-search';
import { FilterSelect } from '@/components/shared/filter-select';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalContext } from '@/state/context';
import { logger } from '@/utils';
import { format } from 'date-fns';
import { Eye, FilterX, MessageSquareWarning, RefreshCw, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { COMPLAINT_URGENCY, complaintTypeLabel, HR_STATUS_LABELS, submitterName } from './complaint.constants';
import { ComplaintStatusBadge, UrgencyBadge } from './complaint-details';
import { ComplaintReviewDialog } from './complaint-review-dialog';

const VIEWS = [
  { value: 'PENDING_REVIEW', label: 'Awaiting HR Officer' },
  { value: 'PENDING_APPROVAL', label: 'Awaiting HR Manager' },
  { value: 'all', label: 'All Complaints' },
];

const EMPTY_FILTERS = { status: '', severity: '', search: '', dateFrom: '', dateTo: '' };

const STATUS_OPTIONS = Object.entries(HR_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const URGENCY_OPTIONS = COMPLAINT_URGENCY.map(({ value, label }) => ({ value, label }));

const hasPermission = (user, permission) =>
  (user?.permissions ?? []).some((value) => value?.toString().toUpperCase() === permission);

// HR Officer / HR Manager: all complaints and their progress.
export default function ComplaintManagement() {
  const { currentUser, isLoadingUser } = useGlobalContext();
  const canReview = hasPermission(currentUser, 'MANAGE_COMPLAINTS');
  const canAuthorize = hasPermission(currentUser, 'APPROVE_COMPLAINTS');

  const [view, setView] = useState(canAuthorize && !canReview ? 'PENDING_APPROVAL' : 'PENDING_REVIEW');
  const [complaints, setComplaints] = useState([]);
  const [tabCounts, setTabCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  const allowed = canReview || canAuthorize;
  const hasActiveFilters = Object.entries(filters).some(([, value]) => !!value);

  const updateFilters = (changes) => {
    setFilters((previous) => ({ ...previous, ...changes }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  const handleSearch = useCallback((value) => {
    setFilters((previous) => (previous.search === value ? previous : { ...previous, search: value }));
    setCurrentPage(1);
  }, []);

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
        // Queue tabs fix the status; the status filter applies on "All Complaints".
        status: view === 'all' ? filters.status || undefined : view,
        severity: filters.severity || undefined,
        search: filters.search || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });
      setComplaints(response?.data ?? []);
      setPages(response?.pagination?.pages || 1);
    } catch (error) {
      logger.error({ caller: 'Load complaints for HR', payload: { message: error?.message } });
      setLoadError(error?.message || 'Unable to load complaints.');
      toast.error('Error', { description: error?.message || 'Unable to load complaints.' });
    } finally {
      setLoading(false);
    }
  }, [allowed, currentPage, rows, view, filters]);

  // Tab totals follow the search/urgency/date filters (each tab supplies its own status).
  const loadCounts = useCallback(async () => {
    if (!allowed) return;
    try {
      const response = await complaintService.getComplaintCounts({
        severity: filters.severity || undefined,
        search: filters.search || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });
      setTabCounts(response?.data ?? {});
    } catch (error) {
      logger.error({ caller: 'Load complaint counts', payload: { message: error?.message } });
    }
  }, [allowed, filters.severity, filters.search, filters.dateFrom, filters.dateTo]);

  const refresh = useCallback(() => {
    loadData();
    loadCounts();
  }, [loadData, loadCounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

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
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Card>
          <CardHeader className="space-y-5 pb-4">
            {/* Queues: same tab style as the rest of the app (e.g. Employee Directory), with counts */}
            <Tabs
              value={view}
              onValueChange={(value) => {
                setView(value);
                setCurrentPage(1);
              }}
            >
              <TabsList className="grid w-full grid-flow-col justify-start">
                {VIEWS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value} className="gap-2">
                    {option.label}
                    <span className="min-w-[1.5rem] rounded-full bg-gray-200 px-2 py-0.5 text-center text-xs font-semibold text-gray-700">
                      {tabCounts[option.value] ?? 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Toolbar: search + compact filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="w-full lg:w-80">
                <DebouncedSearch
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={handleSearch}
                  placeholder="Search complaints..."
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {view === 'all' ? (
                  <FilterSelect
                    id="complaint-status-filter"
                    label="Status"
                    value={filters.status}
                    onChange={(status) => updateFilters({ status })}
                    options={STATUS_OPTIONS}
                    allLabel="All statuses"
                  />
                ) : null}
                <FilterSelect
                  id="complaint-urgency-filter"
                  label="Urgency"
                  value={filters.severity}
                  onChange={(severity) => updateFilters({ severity })}
                  options={URGENCY_OPTIONS}
                  allLabel="All urgency levels"
                />
                <DateRangePicker
                  id="complaint-date-filter"
                  compact
                  className="w-auto"
                  value={{ from: filters.dateFrom, to: filters.dateTo }}
                  onChange={({ from, to }) => updateFilters({ dateFrom: from, dateTo: to })}
                  maxDate={new Date()}
                  placeholder="Date submitted"
                />
                {hasActiveFilters ? (
                  <Button variant="ghost" onClick={clearFilters} className="text-gray-600">
                    <FilterX className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </div>
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
                            {canReview && complaint.status === 'PENDING_REVIEW' && !complaint.isOwnComplaint ? 'Review' : 'View'}
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
        onReviewed={refresh}
      />
    </div>
  );
}
