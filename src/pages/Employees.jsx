
import React, { useState, useEffect } from "react";
import { Employee, User } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, MoreHorizontal, Edit, UserX, AlertCircle, Copy, Check, Mail } from "lucide-react";
import EmployeeForm from "../components/employees/EmployeeForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

const EmployeeBioDataTable = ({ employees, onEdit, onTerminate, getStatusColor, onResendInstructions }) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>Employee</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Department</TableHead>
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
                <p className="font-semibold text-gray-900">{employee.first_name} {employee.last_name}</p>
                <p className="text-sm text-gray-500">{employee.email}</p>
              </div>
            </TableCell>
            <TableCell>{employee.position}</TableCell>
            <TableCell className="capitalize">{employee.department}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(employee.employment_status)}>
                {employee.employment_status.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell>{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}</TableCell>
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
                  {employee.employment_status !== 'terminated' && (
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

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showWelcomeInfoDialog, setShowWelcomeInfoDialog] = useState(false);
  const [welcomeInfo, setWelcomeInfo] = useState({ email: '', instructions: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch current user", e);
      }
    };
    fetchUser();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const employeesData = await Employee.list("-created_date");
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    const { employeeData, createUser } = formData;
    setError("");
    setSuccess("");
    try {
      if (editingEmployee) {
        await Employee.update(editingEmployee.id, employeeData);
        setSuccess("Employee details updated successfully.");
      } else {
        const newEmployee = await Employee.create(employeeData);
        let successMsg = "New employee created successfully.";

        if (createUser && newEmployee) {
          try {
            await User.create({
              email: employeeData.email,
              full_name: `${employeeData.first_name} ${employeeData.last_name}`,
              role: 'user', // Standard employee role
              permissions: ['access_self_service'],
              department: employeeData.department,
              assigned_by: currentUser?.email || 'system'
            });
            
            const instructions = `
              <h3>Welcome aboard!</h3>
              <p>An employee account has been created for you on the Orbit360 platform.</p>
              <p>You can access the Employee Self-Service Portal by logging in with your Google account associated with this email address (${employeeData.email}).</p>
              <p>Your portal provides access to tools for leave management, performance appraisals, and more.</p>
              <p>If you have any questions, please contact the HR department.</p>
            `.replace(/\s+/g, ' ').trim();

            setWelcomeInfo({
                email: employeeData.email,
                instructions: instructions
            });
            setShowWelcomeInfoDialog(true);
            
            successMsg += " A user account was created. Please share the login instructions with the new employee.";
          } catch (userError) {
             setError(`Employee was created, but failed to create user account: ${userError.message}`);
          }
        }
        setSuccess(successMsg);
      }
      setShowForm(false);
      setEditingEmployee(null);
      loadData();
      setTimeout(() => { setSuccess(""); setError(""); }, 8000);
    } catch (error) {
      console.error("Error saving employee:", error);
      setError(`Failed to save employee: ${error.message}`);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };
  
  const handleResendInstructions = (employee) => {
      const instructions = `
        <h3>Welcome aboard!</h3>
        <p>An employee account has been created for you on the Orbit360 platform.</p>
        <p>You can access the Employee Self-Service Portal by logging in with your Google account associated with this email address (${employee.email}).</p>
        <p>Your portal provides access to tools for leave management, performance appraisals, and more.</p>
        <p>If you have any questions, please contact the HR department.</p>
      `.replace(/\s+/g, ' ').trim();

      setWelcomeInfo({
          email: employee.email,
          instructions: instructions
      });
      setShowWelcomeInfoDialog(true);
  };

  const handleTerminate = async (employeeId) => {
    if (window.confirm("Are you sure you want to terminate this employee? Their record will be moved to the ex-staff archive.")) {
      try {
        await Employee.update(employeeId, { employment_status: 'terminated' });
        loadData();
        setSuccess("Employee terminated successfully.");
        setTimeout(() => setSuccess(""), 8000);
      } catch (error) {
        console.error("Error terminating employee:", error);
        setError(`Failed to terminate employee: ${error.message}`);
        setTimeout(() => setError(""), 8000);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      on_leave: "bg-yellow-100 text-yellow-700",
      terminated: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };
  
  const activeEmployees = employees.filter(e => e.employment_status === 'active' || e.employment_status === 'on_leave' || e.employment_status === 'inactive');
  const terminatedEmployees = employees.filter(e => e.employment_status === 'terminated');

  if (loading) {
    return <div className="p-8 text-center">Loading employee directory...</div>;
  }

  const handleCopy = () => {
    // Remove HTML tags and convert to plain text for clipboard
    const plainTextInstructions = welcomeInfo.instructions
      .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newlines
      .replace(/<\/?(h[1-6]|p|div|ul|ol|li)[^>]*>/gi, '\n') // Replace block tags with newlines
      .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
      .replace(/\n\s*\n/g, '\n\n') // Consolidate multiple newlines
      .trim();
      
    navigator.clipboard.writeText(`To: ${welcomeInfo.email}\nSubject: Welcome to Orbit360 - Your Employee Portal Account\n\n${plainTextInstructions}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1>
              <p className="text-gray-600">Add, manage, and archive company employees</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingEmployee(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-lg shadow-blue-700/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500 text-green-700">
             <AlertCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <EmployeeForm
            employee={editingEmployee}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingEmployee(null);
            }}
          />
        )}
        
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
            <Tabs defaultValue="active" className="w-full">
                <CardHeader>
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="active">Active Employees ({activeEmployees.length})</TabsTrigger>
                        <TabsTrigger value="terminated">Ex-Staff Archive ({terminatedEmployees.length})</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <CardContent className="p-0">
                    <TabsContent value="active">
                        <EmployeeBioDataTable employees={activeEmployees} onEdit={handleEdit} onTerminate={handleTerminate} getStatusColor={getStatusColor} onResendInstructions={handleResendInstructions} />
                    </TabsContent>
                    <TabsContent value="terminated">
                        <EmployeeBioDataTable employees={terminatedEmployees} onEdit={handleEdit} onTerminate={handleTerminate} getStatusColor={getStatusColor} onResendInstructions={handleResendInstructions} />
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
      </div>

      <Dialog open={showWelcomeInfoDialog} onOpenChange={setShowWelcomeInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Account Created Successfully!</DialogTitle>
            <DialogDescription>
              A user account has been created for the new employee. Please copy the instructions below and send them to the employee using your own email client. This ensures personalized communication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="text-sm">
                <strong>To:</strong> {welcomeInfo.email}
            </div>
            <div className="text-sm">
                <strong>Subject:</strong> Welcome to Orbit360 - Your Employee Portal Account
            </div>
            <div className="p-4 bg-gray-100 rounded-lg border text-sm max-h-60 overflow-y-auto" dangerouslySetInnerHTML={{ __html: welcomeInfo.instructions }} />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Email Content'}
            </Button>
             <Button variant="secondary" onClick={() => setShowWelcomeInfoDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
