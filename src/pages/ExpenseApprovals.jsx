import React, { useState, useEffect } from 'react';
import { ExpenseRequest, ExpenseCategory, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Search, Filter, Clock, CheckCircle, AlertCircle, XCircle, User as UserIcon } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const getStatusInfo = (status) => {
  const statusMap = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <UserIcon className="w-3 h-3" /> },
    submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
    level_1_approved: { label: 'Level 1 Approved', color: 'bg-yellow-100 text-yellow-700', icon: <CheckCircle className="w-3 h-3" /> },
    level_2_approved: { label: 'Level 2 Approved', color: 'bg-yellow-100 text-yellow-700', icon: <CheckCircle className="w-3 h-3" /> },
    final_approved: { label: 'Final Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
    paid: { label: 'Paid', color: 'bg-purple-100 text-purple-700', icon: <CheckCircle className="w-3 h-3" /> },
    settled: { label: 'Settled', color: 'bg-indigo-100 text-indigo-700', icon: <CheckCircle className="w-3 h-3" /> },
  };
  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: <UserIcon className="w-3 h-3" /> };
};

const getPendingDays = (createdDate) => {
  const today = new Date();
  const created = new Date(createdDate);
  return differenceInDays(today, created);
};

const getApprovalLevel = (status) => {
  const levels = {
    draft: { current: 0, total: 4, description: 'Not submitted' },
    submitted: { current: 1, total: 4, description: 'Awaiting Level 1 approval' },
    level_1_approved: { current: 2, total: 4, description: 'Awaiting Level 2 approval' },
    level_2_approved: { current: 3, total: 4, description: 'Awaiting final approval' },
    final_approved: { current: 4, total: 4, description: 'Approved, awaiting payment' },
    paid: { current: 4, total: 4, description: 'Payment completed' },
    rejected: { current: 0, total: 4, description: 'Request rejected' },
    settled: { current: 4, total: 4, description: 'Fully settled' }
  };
  return levels[status] || { current: 0, total: 4, description: 'Unknown status' };
};

export default function ExpenseApprovals() {
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, categoriesData, userData] = await Promise.all([
        ExpenseRequest.list('-created_date'),
        ExpenseCategory.list(),
        User.me()
      ]);
      setRequests(requestsData);
      setCategories(categoriesData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading expense approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.expense_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const ApprovalProgressBar = ({ status }) => {
    const { current, total } = getApprovalLevel(status);
    const progress = (current / total) * 100;
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              status === 'rejected' ? 'bg-red-500' : 
              progress === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-600">{current}/{total}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Approval Tracker</h1>
            <p className="text-gray-600">Track approval levels and pending durations for all expense requests.</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by title, requester, or expense ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="level_1_approved">Level 1 Approved</SelectItem>
                    <SelectItem value="level_2_approved">Level 2 Approved</SelectItem>
                    <SelectItem value="final_approved">Final Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Tracking Table */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Expense Requests ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Request Details</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approval Progress</TableHead>
                    <TableHead>Days Pending</TableHead>
                    <TableHead>Current Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(request => {
                    const statusInfo = getStatusInfo(request.status);
                    const approvalInfo = getApprovalLevel(request.status);
                    const pendingDays = getPendingDays(request.created_date);
                    const category = categories.find(c => c.id === request.category_id);
                    
                    return (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{request.title}</p>
                            <p className="text-sm text-gray-500">{request.expense_id}</p>
                            <p className="text-xs text-gray-400">{category?.name || 'Unknown Category'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.requester_name}</p>
                            <p className="text-sm text-gray-500">{request.department}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-gray-900">
                            ₦{request.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ApprovalProgressBar status={request.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={`font-medium ${
                              pendingDays > 7 ? 'text-red-600' : 
                              pendingDays > 3 ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {pendingDays} days
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-32">
                            <p className="text-xs text-gray-600">{approvalInfo.description}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {filteredRequests.length === 0 && (
              <div className="text-center p-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold">No Requests Found</h3>
                <p>No expense requests match your current filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}