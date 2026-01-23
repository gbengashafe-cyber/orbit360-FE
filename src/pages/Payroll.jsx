import { payrollService } from '@/api';
import { base44 } from '@/api/base44Client';
import { PayrollOverwriteAlert } from '@/components/payroll/OverwriteAlert';
import { generatePayrollCSV } from '@/components/payroll/payroll-csv';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Calendar, CreditCard, Download, FileText, FolderOpen, Printer, Trash2, Upload, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Payslip from '../components/payroll/Payslip';

const getStatusColor = (status) => {
  const colors = {
    generated: 'bg-blue-100 text-blue-700',
    processed: 'bg-green-100 text-green-700',
    paid: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ reportName: '', file: null, payPeriod: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [showPayrollOverwriteAlert, setShowPayrollOverwriteAlert] = useState(false);

  useEffect(() => {
    loadPeriodPayroll();
  }, [currentPeriod]);

  useEffect(() => {
    loadData();
  }, [currentPeriod]);

  const loadPeriodPayroll = async () => {
    try {
      const payrollData = await payrollService.getPayrollByPeriod({ payPeriod: currentPeriod });
      setPayrollRecords(payrollData.data);

      toast.success('Payroll for period loaded successfully');
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast.error('Error loading payroll data', {
        description: error.message || 'Kindly contact the system administrator',
        action: {
          label: 'Close',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [reportsData] = await Promise.all([
        // PayrollReport.list('-created_date'),
        // TODO: Past report upload
        { data: [{}] },
      ]);
      setUploadedReports(reportsData.data);
    } catch (error) {
      toast.error('Error loading payroll data:', {
        description: `${error.message ? error.message : 'Kindly contact the system administrator'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyPayrollWithOverwrite = async (selectedPeriod) => {
    setGeneratingPayroll(true);
    try {
      await payrollService.regeneratePayroll(selectedPeriod);

      toast.success('Payroll Generated', {
        description: `Payroll for ${new Date(selectedPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} generated successfully.`,
      });

      await loadData();
    } catch (error) {
      toast.error('Error generating payroll', {
        description: `Please try again.  ${error.message ? 'Error: ' + error.message : ''}`,
      });
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const generateMonthlyPayroll = async (selectedPeriod) => {
    setGeneratingPayroll(true);
    try {
      const existingPayroll = await payrollService.getPayrollByPeriod({ payPeriod: selectedPeriod, rows: 1 });

      if (existingPayroll.data.length > 0) {
        setShowPayrollOverwriteAlert(true);
        return;
      }

      await payrollService.generatePayroll(selectedPeriod);

      toast.success('Payroll Generated', {
        description: `Payroll for ${new Date(selectedPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} generated successfully.`,
      });

      await loadData();
    } catch (error) {
      toast.error('Error generating payroll', {
        description: `Please try again.  ${error.message ? 'Error: ' + error.message : ''}`,
      });
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const processPayroll = async (recordId) => {
    try {
      await payrollService.updatePayrollStatus(recordId, {
        status: 'processed',
        paymentDate: new Date().toISOString().split('T')[0],
      });
      loadData();
      toast.success('Payroll record updated successfully');
    } catch (error) {
      toast.error('Error processing payroll', { description: `${error.message ? error.message : ''}` });
    }
  };

  const downloadPayrollReport = async (payPeriod) => {
    const currentPeriodRecords = await payrollService.getPayrollByPeriod({ payPeriod, rows: 3000 });

    if (currentPeriodRecords.data.length === 0) {
      toast.info('No payroll data available for the selected period.');
      return;
    }

    const csvContent = generatePayrollCSV(currentPeriodRecords.data);

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_${payPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUploadReport = async () => {
    if (!uploadForm.reportName || !uploadForm.file || !uploadForm.payPeriod) {
      alert('Please fill in all fields');
      return;
    }
    setIsUploading(true);
    try {
      const user = await base44.auth.me();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadForm.file });
      await PayrollReport.create({
        report_name: uploadForm.reportName,
        file_url: file_url,
        pay_period: uploadForm.payPeriod,
        uploaded_by: user.email,
      });
      await loadData();
      setUploadForm({ reportName: '', file: null, payPeriod: '' });
      setShowUploadDialog(false);
      alert('Report uploaded successfully!');
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Failed to upload report');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await PayrollReport.delete(reportId);
      await loadData();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading payroll data...</div>;
  }

  const summaryCards = [
    {
      title: 'Active Employees',
      value: 5,
      icon: Users,
      color: 'text-blue-600',
    },
    // {
    // {
    //   title: 'Active Employees',
    //   value: employees.filter((e) => e.employment_status === 'active').length,
    //   icon: Users,
    //   color: 'text-blue-600',
    // },
    // {
    //   title: 'Generated This Month',
    //   value: payrollRecords.filter((r) => r.pay_period === currentPeriod).length,
    //   icon: Receipt,
    //   color: 'text-green-600',
    // },
    // {
    //   title: 'Total Gross Pay (Monthly)',
    //   value: `₦${payrollRecords
    //     .filter((r) => r.pay_period === currentPeriod)
    //     .reduce((sum, r) => sum + (r.gross_salary || 0), 0)
    //     .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    //   icon: DollarSign,
    //   color: 'text-purple-600',
    // },
    // {
    //   title: 'Total Net Pay (Monthly)',
    //   value: `₦${payrollRecords
    //     .filter((r) => r.pay_period === currentPeriod)
    //     .reduce((sum, r) => sum + (r.net_salary || 0), 0)
    //     .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    //   icon: CreditCard,
    //   color: 'text-orange-600',
    // },
  ];

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payroll & Payments</h1>
              <p className="text-gray-600">Automated monthly payroll processing with PAYE tax calculations</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const period = date.toISOString().slice(0, 7);
                  return (
                    <SelectItem key={period} value={period}>
                      {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={() => generateMonthlyPayroll(currentPeriod)}
              disabled={generatingPayroll}
              className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white shadow-lg shadow-green-700/25"
            >
              {generatingPayroll ? (
                <>
                  <Calculator className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Generate Payroll
                </>
              )}
            </Button>
            <Button
              onClick={() => downloadPayrollReport(currentPeriod)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button
              onClick={() => setShowUploadDialog(true)}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Past Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-bold text-gray-900`}>{card.value}</p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Monthly Payroll Schedule -{' '}
                {new Date(currentPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </span>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                {payrollRecords.filter((r) => r.payPeriod === currentPeriod).length} records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Employee Details</TableHead>
                    <TableHead>Earnings & Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords
                    .filter((record) => record.payPeriod === currentPeriod)
                    .map((record) => {
                      const employee = record.employee;
                      const taxBreakdown = record.tax_breakdown || {};
                      return (
                        <TableRow key={record.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {employee?.firstName} {employee?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{employee?.employeeId}</p>
                              <p className="text-xs text-gray-500">{employee?.jobRole?.replace('_', ' ')}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-green-600 mb-1 font-medium">
                                <div>
                                  <span className="inline-block min-w-[45%]">Gross:</span>₦{' '}
                                  {Number(record.grossSalary)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                              <div className="text-red-600">
                                <div>
                                  <span className="inline-block min-w-[45%]">Pension ({taxBreakdown.pensionRate || 8}%):</span>₦{' '}
                                  {Number(record.pensionDeduction)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div>
                                  <span className="inline-block min-w-[45%]">NHF ({taxBreakdown.nhfRate || 2.5}%):</span>₦{' '}
                                  {Number(record.nhfDeduction)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>

                                <div>
                                  <span className="inline-block min-w-[45%]">Loan Deduction:</span>
                                  {`₦ ${Number(record.loanDeduction)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </div>
                                <div>
                                  <span className="inline-block min-w-[45%]">Tax:</span>₦ {''}
                                  {Number(record.payeDeduction)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="font-semibold border-t mt-1 pt-1">
                                  <span className="inline-block min-w-[45%]">Total Deductions:</span>₦ {''}
                                  {Number(record.totalDeductions)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">
                            ₦{record.netSalary?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{employee?.bankName}</div>
                              <div>{employee?.accountNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2">
                              {record.status === 'generated' && (
                                <Button
                                  size="sm"
                                  onClick={() => processPayroll(record.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                                >
                                  Process
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingPayslip({ record, employee })}
                                className="text-xs px-2 py-1"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Payslip
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {payrollRecords.filter((r) => r.payPeriod === currentPeriod).length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No payroll records for this period</h3>
                <p className="mb-4">
                  Generate payroll for {new Date(currentPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
                <Button
                  onClick={() => generateMonthlyPayroll(currentPeriod)}
                  disabled={generatingPayroll}
                  className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Generate Monthly Payroll
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Uploaded Payroll Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadedReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No uploaded reports yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Report Name</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.report_name}</TableCell>
                      <TableCell>
                        {new Date(report.pay_period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </TableCell>
                      <TableCell>{report.uploaded_by}</TableCell>
                      <TableCell>{new Date(report.created_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a href={report.file_url} target="_blank" rel="noopener noreferrer" download>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </a>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteReport(report.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <PayrollOverwriteAlert
          isOpen={showPayrollOverwriteAlert}
          setIsOpen={setShowPayrollOverwriteAlert}
          overwrite={() => generateMonthlyPayrollWithOverwrite(currentPeriod)}
          currentPeriod={currentPeriod}
        />
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Past Payroll Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Report Name</label>
              <Input
                placeholder="e.g., December 2025 Payroll"
                value={uploadForm.reportName}
                onChange={(e) => setUploadForm({ ...uploadForm, reportName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Pay Period</label>
              <Select value={uploadForm.payPeriod} onValueChange={(value) => setUploadForm({ ...uploadForm, payPeriod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const period = date.toISOString().slice(0, 7);
                    return (
                      <SelectItem key={period} value={period}>
                        {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Excel File</label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
              />
            </div>
            <Button onClick={handleUploadReport} disabled={isUploading} className="w-full">
              {isUploading ? <Upload className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingPayslip} onOpenChange={() => setViewingPayslip(null)}>
        <DialogContent className="max-w-4xl p-0 border-0">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          {viewingPayslip && (
            <div>
              <Payslip payrollRecord={viewingPayslip.record} employee={viewingPayslip.employee} />
              <div className="p-4 bg-gray-100 flex justify-end no-print">
                <Button onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
