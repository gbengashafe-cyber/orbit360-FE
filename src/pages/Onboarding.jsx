import React, { useState, useEffect } from 'react';
import { Employee, OnboardingDocument } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Upload, Loader2, FileText, CheckCircle2, Circle } from 'lucide-react';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, docData] = await Promise.all([
        Employee.list('-created_date'),
        OnboardingDocument.list()
      ]);
      setEmployees(empData);
      setOnboardingDocs(docData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedEmployeeId || !uploadForm.documentType || !uploadForm.file) {
      alert("Please select an employee, document type, and a file.");
      return;
    }
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file: uploadForm.file });
      await OnboardingDocument.create({
        employee_id: selectedEmployeeId,
        document_type: uploadForm.documentType,
        file_url: file_url,
        document_name: uploadForm.file.name
      });
      alert("Document uploaded successfully!");
      setUploadForm({ documentType: '', file: null });
      // Refresh docs for the current employee
      const docData = await OnboardingDocument.list();
      setOnboardingDocs(docData);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const selectedEmployeeDocs = onboardingDocs.filter(doc => doc.employee_id === selectedEmployeeId);
  
  const getEmployeeChecklist = () => {
    return DOCUMENT_TYPES.map(type => {
      const doc = selectedEmployeeDocs.find(d => d.document_type === type);
      return {
        type,
        uploaded: !!doc,
        file_url: doc?.file_url,
        document_name: doc?.document_name,
        uploaded_date: doc?.created_date
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
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
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
                        <div>
                          {item.uploaded ? (
                            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2" />
                                View Document
                              </Button>
                            </a>
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
      </div>
    </div>
  );
}