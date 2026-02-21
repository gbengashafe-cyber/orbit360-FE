import React from 'react';
import Logo from '../Logo';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function ExpenseInvoice({ request, logs = [] }) {
  if (!request) {
    return null;
  }

  const approvalLogs = logs.filter(log => ['approved', 'paid', 'submitted'].includes(log.action)).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto my-4 printable-expense-invoice">
       <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-expense-invoice, .printable-expense-invoice * {
            visibility: visible;
          }
          .printable-expense-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200 mb-4">
        <div className="flex items-center gap-3">
          <Logo size="small" />
          <div>
            <h1 className="text-lg font-bold text-gray-800">Orbit360</h1>
            <p className="text-xs text-gray-500">360° Business Management Platform</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-blue-700">EXPENSE VOUCHER</h2>
          <p className="text-sm text-gray-600">ID: {request.expense_id}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 mb-4 text-sm">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Requested By</h3>
          <div className="text-gray-800 space-y-1">
            <p><span className="font-medium">Name:</span> {request.requester_name}</p>
            <p><span className="font-medium">Department:</span> {request.department}</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="font-semibold text-gray-700 mb-2">Request Dates</h3>
          <div className="text-gray-800 space-y-1">
            <p><span className="font-medium">Date Submitted:</span> {new Date(request.created_date).toLocaleDateString()}</p>
            <p><span className="font-medium">Date Incurred:</span> {new Date(request.date_incurred).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 rounded-lg">
        <h3 className="text-base font-bold text-gray-800 bg-gray-50 px-3 py-2 border-b">Expense Details</h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium w-1/3">Title</TableCell>
              <TableCell>{request.title}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Purpose</TableCell>
              <TableCell>{request.purpose}</TableCell>
            </TableRow>
             <TableRow>
              <TableCell className="font-medium">Amount</TableCell>
              <TableCell className="font-bold text-lg text-blue-700">₦{request.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      
      <section className="border border-gray-200 rounded-lg mt-4">
        <h3 className="text-base font-bold text-gray-800 bg-gray-50 px-3 py-2 border-b">Approval History</h3>
         <Table>
            <TableBody>
                {approvalLogs.map(log => (
                    <TableRow key={log.id}>
                        <TableCell className="w-1/3">
                            <p className="font-medium capitalize">{log.action}</p>
                            <p className="text-xs text-gray-500">{new Date(log.created_date).toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                            <p>{log.user_name}</p>
                            {log.comment && <p className="text-xs italic text-gray-600">"{log.comment}"</p>}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </section>

      <footer className="pt-6 mt-6 border-t-2 border-gray-200 text-center text-gray-500 text-xs">
        <p>This is a computer-generated document. For internal use only.</p>
        <p>Orbit360 Expense Management</p>
      </footer>
    </div>
  );
}