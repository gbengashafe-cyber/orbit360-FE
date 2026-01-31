import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye } from 'lucide-react';
import { getStatusColor } from './authorization-center.util';

export function TransactionsTable({ transactions, setViewingItem }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Type</TableHead>
            <TableHead>Title/Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TableRow key={`${transaction.type}-${transaction.id}`}>
                <TableCell className="font-medium">{transaction.type}</TableCell>
                <TableCell>{transaction.title}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                </TableCell>
                <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{transaction?.initiator?.firstName || 'N/A'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setViewingItem(transaction)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
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
