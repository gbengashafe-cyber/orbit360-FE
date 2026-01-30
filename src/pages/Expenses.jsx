import { ExpenseRequest, User } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Plus, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

const getStatusBadge = (status) => {
  const colors = {
    draft: 'bg-gray-200 text-gray-800',
    submitted: 'bg-blue-200 text-blue-800',
    level_1_approved: 'bg-yellow-200 text-yellow-800',
    level_2_approved: 'bg-yellow-300 text-yellow-900',
    final_approved: 'bg-green-200 text-green-800',
    rejected: 'bg-red-200 text-red-800',
    paid: 'bg-purple-200 text-purple-800',
    settled: 'bg-indigo-200 text-indigo-800',
  };
  return <Badge className={colors[status] || 'bg-gray-200'}>{status?.replace(/_/g, ' ').toUpperCase()}</Badge>;
};

export default function Expenses() {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my_requests');
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);
      const allRequests = await ExpenseRequest.list('-created_date');
      setRequests(allRequests);
      setLoading(false);
    };
    init();
  }, []);

  const filteredRequests = () => {
    if (!currentUser) return [];

    let baseRequests = [];
    switch (activeTab) {
      case 'my_requests':
        baseRequests = requests.filter((r) => r.requester_id === currentUser.id);
        break;
      case 'pending_approval':
        baseRequests = requests.filter((r) => r.current_approver_role === currentUser.role);
        break;
      case 'pending_payment':
        baseRequests = requests.filter(
          (r) =>
            (r.status === 'final_approved' || r.status === 'settled') && ['finance_officer', 'admin'].includes(currentUser.role),
        );
        break;
      case 'all_requests':
        baseRequests = requests;
        break;
      default:
        return [];
    }

    if (dateRange.from && dateRange.to) {
      return baseRequests.filter((r) => {
        const requestDate = new Date(r.created_date);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0); // Set to start of the 'from' day
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Set to end of the 'to' day

        return requestDate >= fromDate && requestDate <= toDate;
      });
    }

    return baseRequests;
  };

  const tabs = [
    { key: 'my_requests', label: 'My Requests' },
    {
      key: 'pending_approval',
      label: 'Pending My Approval',
      roles: ['head_of_operations', 'internal_control', 'managing_director'],
    },
    { key: 'pending_payment', label: 'Pending Payment', roles: ['finance_officer', 'admin'] },
    { key: 'all_requests', label: 'All Requests', roles: ['admin', 'managing_director', 'finance_officer'] },
  ];

  const availableTabs = tabs.filter((tab) => !tab.roles || tab.roles.includes(currentUser?.role));

  const canFilterByDate =
    ['all_requests', 'pending_payment'].includes(activeTab) &&
    ['admin', 'managing_director', 'finance_officer'].includes(currentUser?.role);

  // Allow admin managers and admin officers to create expense requests
  const canCreateExpense = currentUser?.role === 'admin_officer' || currentUser?.role === 'admin';

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
              <p className="text-gray-600">Submit, track, and manage all expense requests.</p>
            </div>
          </div>
          {canCreateExpense && (
            <Link to={createPageUrl('ExpenseDetail', { id: 'new' })}>
              <Button className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25">
                <Plus className="w-4 h-4 mr-2" />
                New Expense Request
              </Button>
            </Link>
          )}
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>{availableTabs.find((t) => t.key === activeTab)?.label}</CardTitle>
            {canFilterByDate && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="date" variant={'outline'} className="w-[300px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="secondary" onClick={() => setDateRange({ from: null, to: null })}>
                  Clear
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Title</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date Incurred</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests().map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <p className="font-semibold">{req.title}</p>
                          <p className="text-xs text-gray-500">{req.expense_id}</p>
                        </TableCell>
                        <TableCell>{req.requester_name}</TableCell>
                        <TableCell>₦{req.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(req.date_incurred).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell>
                          <Link to={createPageUrl('ExpenseDetail', { id: req.id })}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            {!loading && filteredRequests().length === 0 && (
              <div className="text-center p-12 text-gray-500">No requests found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
