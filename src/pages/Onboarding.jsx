import React, { useState, useEffect } from 'react';
import { employeeService, onboardingService } from '@/api';
import { showToast } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserCheck, Upload, Loader2, FileText, CheckCircle2, Circle, Trash2 } from 'lucide-react';

const DOCUMENT_TYPES = [
  "Offer Letter", "CV", "CBN Approval", "Medical Report", "References", 
  "Guarantor", "Credit Bureau Report", "Address Verification", "Police Report", "HMO Registration Form"
];

export default function Onboarding() {
  const [employees, setEmployees] = useState([]);
  const [onboardingDocs, setOnboardingDocs] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ documentType: '', file: null });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, onboardingData] = await Promise.all([
        employeeService.getEmployees(1, 100),
        onboardingService.getOnboardings(1, 100)
      ]);
      
      console.log('Employee data:', empData);
      console.log('Onboarding data:', onboardingData);
      
      const employees = empData?.data || empData || [];
      const onboardingDocs = onboardingData?.data || onboardingData || [];
      
      console.log('Processed employees:', employees);
      
      setEmployees(employees);
      setOnboardingDocs(onboardingDocs);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast.error('Failed to load onboarding data', 'Error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedEmployeeId || !uploadForm.documentType) {
      showToast.error('Please select an employee and document type', 'Validation Error');
      return;
    }
    setIsUploading(true);
    try {
      const documentUrl = uploadForm.file 
        ? URL.createObjectURL(uploadForm.file) 
        : 'https://example.com/documents/placeholder.pdf';

      await onboardingService.createOnboarding({
        employeeId: parseInt(selectedEmployeeId),
        documentType: uploadForm.documentType,
        documentName: uploadForm.file?.name || `${uploadForm.documentType}_Document`,
        documentUrl: documentUrl
      });
      
      showToast.success('Document created successfully!', 'Success');
      setUploadForm({ documentType: '', file: null });
      
      // Refresh documents
      const onboardingData = await onboardingService.getOnboardings(1, 100);
      const onboardingDocs = onboardingData?.data || onboardingData || [];
      setOnboardingDocs(onboardingDocs);
    } catch (error) {
      console.error("Error uploading document:", error);
      showToast.error(error.message || 'Failed to upload document', 'Error');
    } finally {
      setIsUploading(false);
    }
  };
  
  const selectedEmployeeDocs = onboardingDocs.filter(doc => 
    String(doc.employeeId || doc.employee_id) === String(selectedEmployeeId)
  );
  
  const openDeleteModal = (docId) => {
    setDocToDelete(docId);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    
    setIsUploading(true);
    try {
      await onboardingService.deleteOnboarding(docToDelete);
      showToast.success('Document deleted successfully', 'Success');
      setDeleteModalOpen(false);
      setDocToDelete(null);
      
      // Refresh documents
      const onboardingData = await onboardingService.getOnboardings(1, 100);
      const onboardingDocs = onboardingData?.data || onboardingData || [];
      setOnboardingDocs(onboardingDocs);
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast.error('Failed to delete document', 'Error');
    } finally {
      setIsUploading(false);
    }
  };

  const getEmployeeChecklist = () => {
    return DOCUMENT_TYPES.map(type => {
      const doc = selectedEmployeeDocs.find(d => 
        (d.documentType || d.document_type) === type
      );
      return {
        id: doc?.id,
        type,
        uploaded: doc?.status === 'submitted' || doc?.status === 'approved',
        documentUrl: doc?.documentUrl || doc?.document_url,
        documentName: doc?.documentName || doc?.document_name,
        uploadedDate: doc?.createdAt || doc?.created_at,
        status: doc?.status
      };
    });
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/25">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Onboarding</h1>
            <p className="text-gray-600">Manage and track new hire documentation.</p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Select Employee to Onboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Select an employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                   <SelectItem key={emp.id} value={String(emp.id)}>
                     {((emp.firstName || emp.first_name) + ' ' + (emp.lastName || emp.last_name)).toUpperCase()}
                   </SelectItem>
                 ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedEmployeeId && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <Select onValueChange={(value) => setUploadForm({...uploadForm, documentType: value})} value={uploadForm.documentType}>
                      <SelectTrigger id="documentType">
                        <SelectValue placeholder="Select document type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fileUpload">Select File</Label>
                    <Input id="fileUpload" type="file" onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})} />
                  </div>
                  <Button onClick={handleUpload} disabled={isUploading} className="w-full">
                    {isUploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
                <CardHeader>
                  <CardTitle>Onboarding Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {getEmployeeChecklist().map(item => (
                      <li key={item.type} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          {item.uploaded ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-gray-300" />}
                          <span className="font-medium text-gray-800">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.uploaded ? (
                            <>
                              <a href={item.documentUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Document
                                </Button>
                              </a>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => item.id && openDeleteModal(item.id)}
                                disabled={isUploading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this document? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeleteModalOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}