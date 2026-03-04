import { trainingService } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { logger } from '@/utils';
import { Banknote, RefreshCw, ViewIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getStatusColor } from '../../authorization-center/authorization-center.util';
import { format } from 'date-fns';
import { TrainingRequestReviewForm } from './training-request-review-form';
import { PaginationIconsOnly } from '@/components/shared/pagination';

export function TrainingRequestReview() {
  const [trainingRequests, setTrainingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState(1);

  const refresh = () => setRefreshKey((prev) => prev + 1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await trainingService.getRequests({ rows, page: currentPage });
      setPages(response?.pagination?.pages);

      setTrainingRequests(response.data);
    } catch (error) {
      logger.error({ caller: 'Error loading training request for review', payload: error });
      toast.error('Error', {
        description: error.message || 'Unable to load training requests. Kindly contact the administrator.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, rows]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleEdit = (training) => {
    setEditingTraining(training);
    setShowRequestForm(true);
  };

  const getEmployeeName = (employee) => {
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Cooperative data...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Request Review</h1>
              <p className="text-gray-600">Manage employee Training Requests.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {showRequestForm ? (
          <TrainingRequestReviewForm
            key={editingTraining?.id ?? 'new'}
            trainingRequest={editingTraining}
            showForm={showRequestForm}
            setShowForm={setShowRequestForm}
            onCancel={() => {
              setShowRequestForm(false);
            }}
            onSubmit={refresh}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>All Training Requests</CardTitle>
            <CardDescription>A list of all training requests initiated by employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainingRequests.map((_request) => (
                  <TableRow key={_request.id}>
                    <TableCell>{getEmployeeName(_request?.employee)}</TableCell>
                    <TableCell className="capitalize">{_request.trainingType}</TableCell>
                    <TableCell>{_request.priority}</TableCell>
                    <TableCell>{_request.requestScope}</TableCell>
                    <TableCell>{_request.preferredTimeframe}</TableCell>
                    <TableCell>{format(_request.createdAt, 'dd-MMM-yyyy')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(_request.status?.toLowerCase())}>
                        {_request.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(_request)}>
                          <ViewIcon />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {trainingRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      No training request found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {trainingRequests?.length ? (
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
    </div>
  );
}
