import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Mail, MoreHorizontal, Users, UserX } from 'lucide-react';

export const EmployeeBioDataTable = ({ employees, onEdit, onTerminate, getStatusColor, onResendInstructions }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Job Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id} className="hover:bg-gray-50/50 transition-colors">
              <TableCell>
                <div>
                  <p className="font-semibold text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{employee.email}</p>
                </div>
              </TableCell>
              <TableCell className="capitalize">{employee.departmentName}</TableCell>
              <TableCell>{employee.jobRole.replace('_', ' ')}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(employee.status)}>{employee.status.replace('_', ' ')}</Badge>
              </TableCell>
              <TableCell>{employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(employee)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Employee Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResendInstructions(employee)}>
                      <Mail className="w-4 h-4 mr-2" /> Resend Login Instructions
                    </DropdownMenuItem>
                    {employee.status !== 'terminated' && (
                      <DropdownMenuItem onClick={() => onTerminate(employee.id)} className="text-red-600">
                        <UserX className="w-4 h-4 mr-2" /> Terminate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {employees.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No employees in this category</h3>
        </div>
      )}
    </div>
  );
};
