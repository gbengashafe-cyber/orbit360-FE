import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Upload } from 'lucide-react';
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
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await recruitmentService.createJobApplication({
        ...formData,
        job_posting_id: parseInt(jobId),
      });
      
      setFormData({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        salary_expectation: '',
      });
      setResumeFile(null);
      
      showToast.success('Applicant added successfully!', 'Success');
      onApplicantAdded();
    } catch (error) {
      console.error('Failed to add applicant:', error);
      showToast.error(error.message || 'Could not add applicant. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  return (
    <Dialog>
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
            <Input id="resume" type="file" onChange={e => setResumeFile(e.target.files[0])} />
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