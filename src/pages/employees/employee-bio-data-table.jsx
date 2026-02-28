import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStatusColor } from '@/pages/authorization-center-new/authorization-center.util';
import { Edit, Users } from 'lucide-react';

// export const EmployeeBioDataTable = ({ employees, onEdit, onTerminate, onResendInstructions }) => {
export const EmployeeBioDataTable = ({ employees, onEdit, onTerminate }) => {
  return (
    <div className="overflow-x-auto px-5">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Employee</TableHead>
            <TableHead>SBU</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Job Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees?.length
            ? employees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{employee.company?.name}</TableCell>
                  <TableCell className="capitalize">{employee.department?.name}</TableCell>
                  <TableCell>{employee?.jobRole?.title}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(employee.status)}>{employee.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="flex gap-x-2">
                    <Button variant="outline" onClick={() => onEdit(employee)} title="Edit Employee Details">
                      <Edit className="w-4 h-4" /> Edit
                    </Button>
                    {employee.status !== 'terminated' ? (
                      <Button variant="destructive" onClick={() => onTerminate(employee.id)}>
                        <Edit className="w-4 h-4" /> Terminate
                      </Button>
                    ) : null}
                    {/*
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
                    */}
                  </TableCell>
                </TableRow>
              ))
            : null}
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
