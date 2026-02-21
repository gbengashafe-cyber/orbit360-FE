import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, Loader2, X } from "lucide-react";
import { recruitmentService } from "@/api/recruitment.service";

const DEPARTMENTS = ["hr", "sales", "marketing", "finance", "operations", "it", "admin"];
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "temporary"];

export default function JobPostingForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    employment_type: "full_time",
    location: "",
    salary_range_min: "",
    salary_range_max: "",
    description: "",
    requirements: "",
    hiring_manager: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError("Job title is required");
        setIsLoading(false);
        return;
      }
      if (formData.title.trim().length < 3) {
        setError("Job title must be at least 3 characters");
        setIsLoading(false);
        return;
      }
      if (!formData.description.trim()) {
        setError("Job description is required");
        setIsLoading(false);
        return;
      }
      if (formData.description.trim().length < 10) {
        setError("Job description must be at least 10 characters");
        setIsLoading(false);
        return;
      }
      if (!formData.requirements.trim()) {
        setError("Requirements are required");
        setIsLoading(false);
        return;
      }
      if (!formData.location.trim()) {
        setError("Location is required");
        setIsLoading(false);
        return;
      }
      if (!formData.department) {
        setError("Department is required");
        setIsLoading(false);
        return;
      }

      const salaryMin = formData.salary_range_min ? parseFloat(formData.salary_range_min) : 0;
      const salaryMax = formData.salary_range_max ? parseFloat(formData.salary_range_max) : 0;

      if (salaryMin > 0 && salaryMax > 0 && salaryMin > salaryMax) {
        setError("Minimum salary cannot be greater than maximum salary");
        setIsLoading(false);
        return;
      }

      const submissionData = {
        title: formData.title.trim(),
        department: formData.department,
        employment_type: formData.employment_type,
        location: formData.location.trim(),
        salary_range_min: salaryMin > 0 ? salaryMin : undefined,
        salary_range_max: salaryMax > 0 ? salaryMax : undefined,
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        created_by: formData.hiring_manager || 'system@orbit360.com'
      };

      const response = await recruitmentService.createJobPosting(submissionData);
      onSubmit(response);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.response?.data?.message || err.message || "Failed to create job posting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            required
            placeholder="Senior Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder="Lagos, Nigeria"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employment_type">Type</Label>
          <Select value={formData.employment_type} onValueChange={(value) => handleInputChange("employment_type", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="application_deadline">Application Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.application_deadline ? format(new Date(formData.application_deadline), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.application_deadline}
                onSelect={(date) => handleInputChange("application_deadline", date)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary_range_min">Min Salary (₦)</Label>
          <Input
            id="salary_range_min"
            type="number"
            value={formData.salary_range_min}
            onChange={(e) => handleInputChange("salary_range_min", e.target.value)}
            placeholder="500000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary_range_max">Max Salary (₦)</Label>
          <Input
            id="salary_range_max"
            type="number"
            value={formData.salary_range_max}
            onChange={(e) => handleInputChange("salary_range_max", e.target.value)}
            placeholder="800000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hiring_manager">Hiring Manager Email</Label>
        <Input
          id="hiring_manager"
          type="email"
          value={formData.hiring_manager}
          onChange={(e) => handleInputChange("hiring_manager", e.target.value)}
          placeholder="manager@company.com"
        />
      </div>

      <div className="space-y-2">
       <Label htmlFor="description">Job Description * <span className="text-xs text-gray-500">(min 10 characters)</span></Label>
       <Textarea
         id="description"
         value={formData.description}
         onChange={(e) => handleInputChange("description", e.target.value)}
         required
         rows={4}
         placeholder="Describe the role and what the successful candidate will be doing... (minimum 10 characters)"
       />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements *</Label>
        <Textarea
          id="requirements"
          value={formData.requirements}
          onChange={(e) => handleInputChange("requirements", e.target.value)}
          required
          rows={4}
          placeholder="List the skills, experience, and qualifications required..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Post Job
            </>
          )}
        </Button>
      </div>
    </form>
  );
}