import Payslip from '@/components/payroll/Payslip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogPrintContent } from '@/pages/Payroll';
import { Loader2, Printer } from 'lucide-react';
import { useState } from 'react';

export const PayslipHistoryList = ({ records, isLoading }) => {
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Payslip History</CardTitle>
          {!isLoading ? (
            <p className="text-slate-400">
              {records?.[0]?.employee?.firstName} {records?.[0]?.employee?.lastName}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-8 flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
          </div>
        ) : !records.length ? (
          <div className="text-center py-12 text-gray-500">
            <p>No payslips found for your record.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {new Date(record.payPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm text-gray-500">
                    Net Pay: ₦{record.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <Dialog open={selectedRecord?.id === record.id} onOpenChange={(isOpen) => !isOpen && setSelectedRecord(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedRecord(record)}>
                      View Payslip
                    </Button>
                  </DialogTrigger>
                  <DialogPrintContent>
                    {selectedRecord && (
                      <>
                        <DialogHeader>
                          <DialogTitle></DialogTitle>
                          <DialogDescription></DialogDescription>
                        </DialogHeader>
                        <Payslip payrollRecord={selectedRecord} employee={selectedRecord?.employee} />
                        <div className="sticky bottom-0 py-6 px-4 bg-gray-200 flex justify-end no-print">
                          <Button onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print / Save as PDF
                          </Button>
                        </div>
                      </>
                    )}
                  </DialogPrintContent>
                </Dialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
