import { employeeService, payrollService } from '@/api';
import { DeleteUploadedPayrollAlert } from '@/components/payroll/DeleteUploadedPayrollAlert';
import { PayrollOverwriteAlert } from '@/components/payroll/OverwriteAlert';
import { generatePayrollCSV } from '@/components/payroll/payroll-csv';
import { PaginationIconsOnly } from '@/components/shared/pagination';
import { FormSubmitErrorV1 } from '@/components/shared/submit-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanies } from '@/hooks/use-all-companies';
import {
  Calculator,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  FolderOpen,
  Printer,
  Receipt,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';
import Payslip from '../components/payroll/Payslip';
import { getStatusColor } from './authorization-center-new/authorization-center.util';

export const payPeriodRegex = /^20\d{2}-(0[1-9]|1[0-2])$/;
const generatePayrollSchema = z.object({
  payPeriod: z.string().regex(payPeriodRegex, { error: 'Invalid payPeriod format. The allowed format is YYYY-MM' }),
  companyId: z
    .string({
      error: (value) => {
        if (value.input === undefined) {
          return 'SBU code is required';
        }
      },
    })
    .min(1, 'SBU code is required')
    .max(15, 'SBU code is not allowed'),
});

export default function Payroll() {
  const [loading, setLoading] = useState(true);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', file: null, payPeriod: '' });
  const [uploadFromError, setUploadFormError] = useState(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [showPayrollOverwriteAlert, setShowPayrollOverwriteAlert] = useState(false);
  const [showDeleteUploadAlert, setShowDeleteUploadAlert] = useState(false);
  const [currentUploadedReport, setCurrentUploadedReport] = useState(null);
  const [periodPayrollMeta, setPeriodPayrollMeta] = useState({ count: 0, totalNet: 0, totalGross: 0 });
  const [activeEmployeesCount, setActiveEmployeesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(25);
  const [pages, setPages] = useState(1);
  const [periodTotal, setPeriodTotal] = useState(0);
  const [companyId, setCompanyId] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const { allCompanies } = useCompanies();

  const payslipRef = useRef(null);

  useEffect(() => {
    if (allCompanies.length) {
      setCompanyId(String(allCompanies?.[0].id));
    }
  }, [allCompanies]);

  const loadPeriodPayroll = useCallback(async () => {
    setLoading(true);
    try {
      if (!companyId) {
        return;
      }
      const payrollData = await payrollService.getPayrollByPeriod({
        companyId,
        payPeriod: currentPeriod,
        rows,
        page: currentPage,
      });
      setPayrollRecords(payrollData.data);
      setPeriodPayrollMeta({
        count: payrollData?.pagination?.total,
        totalGross: payrollData?.meta?.totalGrossPay,
        totalNet: payrollData?.meta?.totalNetPay,
      });
      setPages(payrollData?.pagination?.pages || 1);
      setPeriodTotal(payrollData?.pagination?.total || 0);
    } catch (error) {
      toast.error('Error loading payroll data', {
        description: `${error.message ? error.message : ''}`,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentPeriod, companyId, rows]);

  const loadEmployeeStat = useCallback(async () => {
    try {
      const response = await employeeService.getActiveEmployees({ rows: 1 });
      setActiveEmployeesCount(response.pagination?.total);
    } catch (error) {
      toast.error('Error loading employee stats:', {
        description: `${error.message ? error.message : 'Kindly contact the system administrator'}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const response = await payrollService.getUploadedPayrolls();

      setUploadedReports(response.data);
    } catch (error) {
      toast.error('Error loading uploaded payroll reports:', {
        description: `${error.message ? error.message : 'Kindly contact the system administrator'}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeriodPayroll();
  }, [currentPeriod, loadPeriodPayroll]);

  useEffect(() => {
    loadEmployeeStat();
  }, [loadEmployeeStat]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summaryCards = useMemo(
    () => [
      {
        title: 'Active Employees',
        value: activeEmployeesCount,
        icon: Users,
        color: 'text-blue-600',
      },
      {
        title: 'Generated This Month',
        value: periodPayrollMeta.count,
        icon: Receipt,
        color: 'text-green-600',
      },
      {
        title: 'Total Gross Pay (Monthly)',
        value: `₦${periodPayrollMeta.totalGross.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        icon: DollarSign,
        color: 'text-purple-600',
      },
      {
        title: 'Total Net Pay (Monthly)',
        value: `₦${periodPayrollMeta.totalNet.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        icon: CreditCard,
        color: 'text-orange-600',
      },
    ],
    [activeEmployeesCount, periodPayrollMeta],
  );

  const generateMonthlyPayrollWithOverwrite = async (selectedPeriod) => {
    setGeneratingPayroll(true);
    try {
      await payrollService.regeneratePayroll(selectedPeriod);

      toast.success('Payroll Generated', {
        description: `Payroll for ${new Date(selectedPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} generated successfully.`,
      });

      await loadEmployeeStat();
      await loadPeriodPayroll();
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
    setSubmitError(null);
    try {
      const validationResult = generatePayrollSchema.safeParse({ payPeriod: selectedPeriod, companyId });

      if (!validationResult.success) {
        setSubmitError(JSON.parse(validationResult.error.message)[0].message);
        return;
      }

      const existingPayroll = await payrollService.getPayrollBatchByPeriod(validationResult.data);

      if (existingPayroll.data?.status?.toUpperCase() === 'PENDING_APPROVAL') {
        toast.error('Error', {
          description: 'There is a payroll batch pending approval for this period. Kindly clear the pending batch and try again',
        });
        return;
      }

      if (['APPROVED'].includes(existingPayroll.data?.status?.toUpperCase())) {
        setShowPayrollOverwriteAlert(true);
        return;
      }

      await payrollService.generatePayroll(companyId, selectedPeriod);

      toast.success('Payroll Generated', {
        description: `Payroll for ${new Date(selectedPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} generated successfully.`,
      });

      await loadEmployeeStat();
      await loadPeriodPayroll();
    } catch (error) {
      toast.error('Error', {
        description: error.message || 'Could not generate payroll. Kindly contact the system administrator',
      });
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const downloadPayrollReport = async (payPeriod) => {
    const currentPeriodRecords = await payrollService.getPayrollByPeriod({ companyId, payPeriod, rows: 3000 });

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
    setUploadFormError('');
    if (!uploadForm.name || !uploadForm.file || !uploadForm.payPeriod) {
      setUploadFormError('Please fill in all fields');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();

      formData.append('reportFile', uploadForm.file);
      formData.append('name', uploadForm.name);
      formData.append('payPeriod', uploadForm.payPeriod);

      await payrollService.uploadReport(formData);
      await loadEmployeeStat();
      setUploadForm({ name: '', file: null, payPeriod: '' });
      setShowUploadDialog(false);
      toast.success('Report uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload report', { description: `${error.message ? error.message : ''}` });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await payrollService.deleteUploadedPayroll(reportId);
      await loadEmployeeStat();
      toast.success('Payroll report deleted successfully.');
    } catch (error) {
      toast.error('Failed to delete report', { description: `${error.message ? error.message : ''}` });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading payroll data...</div>;
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen print:hidden" style={{ backgroundColor: '#F5F5F5' }}>
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

        <Card className="grid gap-5 lg:grid-cols-2 bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50 px-4 py-5 ">
          <div className="grid gap-2 lg:grid-flow-col lg:justify-items-start">
            <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
              <SelectTrigger className="w-full lg:max-w-60">
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
            <Select value={String(companyId)} onValueChange={setCompanyId}>
              <SelectTrigger className="lg:max-w-60">
                <SelectValue placeholder="Select SBU" />
              </SelectTrigger>

              <SelectContent>
                {allCompanies?.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    <span className="inline-block w-full cursor-pointer">{company.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitError ? <FormSubmitErrorV1>{submitError}</FormSubmitErrorV1> : null}
            <Button
              onClick={() => generateMonthlyPayroll(currentPeriod)}
              disabled={generatingPayroll}
              className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white"
            >
              {generatingPayroll ? (
                <>
                  <Calculator className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Calculator className="mr-2" />
                  Generate Payroll
                </>
              )}
            </Button>
          </div>
          <div className="grid lg:justify-end">
            <Button
              onClick={() => downloadPayrollReport(currentPeriod)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-xl font-bold text-gray-900`}>{card.value}</p>
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
                {periodTotal} records
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
                                  {record.grossSalary?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                              <div className="text-gray-600 mb-1 font-medium">
                                <div>
                                  <span className="inline-block min-w-[45%]">Rent Relief:</span>₦{' '}
                                  {record.rentRelief?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                              <div className="text-red-600">
                                <div>
                                  <span className="inline-block min-w-[45%]">Pension ({taxBreakdown.pensionRate || 8}%):</span>₦{' '}
                                  {record.pensionDeduction?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div>
                                  <span className="inline-block min-w-[45%]">NHF ({taxBreakdown.nhfRate || 2.5}%):</span>₦{' '}
                                  {record.nhfDeduction?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>

                                <div>
                                  <span className="inline-block min-w-[45%]">Loan Deduction:</span>
                                  {`₦ ${record.loanDeduction?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </div>
                                <div>
                                  <span className="inline-block min-w-[45%]">Tax:</span>₦ {''}
                                  {record.payeDeduction?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="font-semibold border-t mt-1 pt-1">
                                  <span className="inline-block min-w-[45%]">Total Deductions:</span>₦ {''}
                                  {record.totalDeductions?.toLocaleString(undefined, {
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
              <div className="p-4 my-4">
                <PaginationIconsOnly
                  currentPage={currentPage}
                  pages={pages}
                  setRows={setRows}
                  setCurrentPage={setCurrentPage}
                  rows={rows}
                />
              </div>
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
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        {new Date(report.payPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </TableCell>
                      <TableCell>{report.uploader?.email}</TableCell>
                      <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" download>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setCurrentUploadedReport(report.id);
                              setShowDeleteUploadAlert(true);
                            }}
                          >
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
        <DeleteUploadedPayrollAlert
          isOpen={showDeleteUploadAlert}
          setIsOpen={setShowDeleteUploadAlert}
          handleDelete={() => handleDeleteReport(currentUploadedReport)}
        />
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
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Pay Period</label>
              <Select value={uploadForm.payPeriod} onValueChange={(value) => setUploadForm({ ...uploadForm, payPeriod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 48 }, (_, i) => {
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
            <div className="text-red-700">{uploadFromError}</div>
            <Button onClick={handleUploadReport} disabled={isUploading} className="w-full">
              {isUploading ? <Upload className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingPayslip} onOpenChange={() => setViewingPayslip(null)}>
        <DialogPrintContent>
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          {viewingPayslip && (
            <div ref={payslipRef} className="print-container">
              <Payslip payrollRecord={viewingPayslip.record} employee={viewingPayslip.employee} />
              <div className="sticky bottom-0 py-6 px-4 rounded-e-none overflow-hidden bg-gray-200 flex justify-end">
                <Button onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          )}
        </DialogPrintContent>
      </Dialog>
    </div>
  );
}

export const DialogPrintContent = ({ children, className }) => {
  return (
    <DialogContent
      className={`print:shadow-none max-w-[95%] lg:max-w-4xl p-0 border-0 print:border-0 print:absolute print:top-0 print:left-0 print:translate-x-0 print:translate-y-0 print:[&_button]:hidden max-h-[80vh] overflow-y-auto ${className}`}
    >
      {children}
    </DialogContent>
  );
};
