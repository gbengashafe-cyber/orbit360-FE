import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { recruitmentService } from '@/api';
import { showToast } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

export default function ApplicantForm({ jobId, onApplicantAdded }) {
  const [formData, setFormData] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    salary_expectation: '',
    cover_letter: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare submission data with only required fields
      const submitData = {
        job_posting_id: parseInt(jobId),
        applicant_name: formData.applicant_name,
        applicant_email: formData.applicant_email,
      };

      // Add optional fields if provided
      if (formData.applicant_phone) {
        submitData.applicant_phone = formData.applicant_phone;
      }
      if (formData.salary_expectation) {
        submitData.salary_expectation = parseInt(formData.salary_expectation);
      }
      if (formData.cover_letter) {
        submitData.cover_letter = formData.cover_letter;
      }
      // Note: resume_url is optional, only include if you have a file URL

      await recruitmentService.createJobApplication(submitData);
      
      setFormData({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        salary_expectation: '',
        cover_letter: '',
      });
      setResumeFile(null);
      
      showToast.success('Applicant added successfully!', 'Success');
      setIsDialogOpen(false);
      onApplicantAdded();
    } catch (error) {
      console.error('Failed to add applicant:', error);
      showToast.error(error.response?.data?.message || error.message || 'Could not add applicant. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      showToast.success(`File "${file.name}" selected`, 'File Selected');
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" /> Add Applicant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Applicant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="applicant_name">Full Name *</Label>
            <Input id="applicant_name" value={formData.applicant_name} onChange={e => handleInputChange('applicant_name', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="applicant_email">Email *</Label>
            <Input id="applicant_email" type="email" value={formData.applicant_email} onChange={e => handleInputChange('applicant_email', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="applicant_phone">Phone</Label>
            <Input id="applicant_phone" value={formData.applicant_phone} onChange={e => handleInputChange('applicant_phone', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="salary_expectation">Salary Expectation (₦)</Label>
            <Input id="salary_expectation" type="number" value={formData.salary_expectation} onChange={e => handleInputChange('salary_expectation', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="resume">Resume/CV</Label>
            <div className="flex items-center gap-2">
              <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              {resumeFile && <span className="text-sm text-green-600">{resumeFile.name}</span>}
            </div>
          </div>
          <div>
            <Label htmlFor="cover_letter">Cover Letter</Label>
            <textarea id="cover_letter" rows="3" value={formData.cover_letter} onChange={e => handleInputChange('cover_letter', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tell us about yourself..." />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Save Applicant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}