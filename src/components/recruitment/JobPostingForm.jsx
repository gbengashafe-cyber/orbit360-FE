import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save } from "lucide-react";

const DEPARTMENTS = ["hr", "sales", "marketing", "finance", "operations", "it", "admin"];
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship"];

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
    responsibilities: "",
    application_deadline: "",
    hiring_manager: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      salary_range_min: parseFloat(formData.salary_range_min) || 0,
      salary_range_max: parseFloat(formData.salary_range_max) || 0,
      application_deadline: formData.application_deadline ? format(new Date(formData.application_deadline), 'yyyy-MM-dd') : null
    };
    onSubmit(submissionData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <Label htmlFor="description">Job Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          required
          rows={4}
          placeholder="Describe the role and what the successful candidate will be doing..."
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

      <div className="space-y-2">
        <Label htmlFor="responsibilities">Key Responsibilities</Label>
        <Textarea
          id="responsibilities"
          value={formData.responsibilities}
          onChange={(e) => handleInputChange("responsibilities", e.target.value)}
          rows={4}
          placeholder="List the main responsibilities for this role..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white">
          <Save className="w-4 h-4 mr-2" />
          Post Job
        </Button>
      </div>
    </form>
  );
}