import { StatusBadge } from '@/components/system';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { getTransactionProps } from './authorization-center.util';

export function TransactionsTable({ moduleName, transactions, setViewingItem, isLoading }) {
  if (isLoading) {
    return <Loader2 className="w-8 h-8 animate-spin text-blue-700" />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Type</TableHead>
            <TableHead>Title/Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead>{['LOANS'].includes(moduleName?.toUpperCase()) ? 'Reviewed By' : 'Created By'}</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.length > 0 ? (
            transactions.map((transaction) => {
              const { type, description, initiator, createdAt } = getTransactionProps(transaction, moduleName);
              return (
                <React.Fragment key={`${type}-${transaction.id}`}>
                  <TableRow>
                    <TableCell className="font-medium capitalize">{type}</TableCell>
                    <TableCell className="text-ellipsis text-nowrap overflow-hidden max-w-36">{description}</TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell>{createdAt}</TableCell>
                    <TableCell>{initiator || 'N/A'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setViewingItem(transaction)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
