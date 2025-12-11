import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, FolderOpen } from "lucide-react";

const PROJECT_TYPES = [
  { value: "software", label: "Software Development" },
  { value: "business", label: "Business Project" },
  { value: "service_desk", label: "Service Desk" },
  { value: "marketing", label: "Marketing Campaign" },
  { value: "operations", label: "Operations" }
];

const METHODOLOGIES = [
  { value: "scrum", label: "Scrum" },
  { value: "kanban", label: "Kanban" },
  { value: "waterfall", label: "Waterfall" },
  { value: "hybrid", label: "Hybrid" }
];

export default function ProjectForm({ project, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    project || {
      name: "",
      key: "",
      description: "",
      project_type: "software",
      methodology: "scrum",
      status: "active",
      start_date: "",
      target_end_date: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate key from name
    if (field === 'name' && !project) {
      const key = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
      setFormData(prev => ({
        ...prev,
        key: key
      }));
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <FolderOpen className="w-5 h-5 text-blue-700" />
            {project ? "Edit Project" : "Create New Project"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Project Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleInputChange("key", e.target.value.toUpperCase())}
                placeholder="PROJ"
                required
                maxLength={10}
              />
              <p className="text-xs text-gray-500">Used for issue keys (e.g., PROJ-123)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the project purpose and goals"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type *</Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) => handleInputChange("project_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="methodology">Methodology *</Label>
              <Select
                value={formData.methodology}
                onValueChange={(value) => handleInputChange("methodology", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODOLOGIES.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_end_date">Target End Date</Label>
              <Input
                id="target_end_date"
                type="date"
                value={formData.target_end_date}
                onChange={(e) => handleInputChange("target_end_date", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {project ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}