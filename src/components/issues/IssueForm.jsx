import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Plus, CheckSquare } from "lucide-react";

const ISSUE_TYPES = [
  "epic", "story", "task", "bug", "subtask", "improvement"
];

const PRIORITIES = [
  "lowest", "low", "medium", "high", "highest"
];

const STATUS_OPTIONS = [
  "to_do", "in_progress", "in_review", "testing", "done", "cancelled"
];

export default function IssueForm({ issue, project, users, sprints, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    issue || {
      summary: "",
      description: "",
      issue_type: "task",
      priority: "medium",
      status: "to_do",
      assignee_id: "",
      sprint_id: "",
      story_points: "",
      labels: [],
      due_date: ""
    }
  );
  const [newLabel, setNewLabel] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      story_points: formData.story_points ? parseInt(formData.story_points) : null
    };
    onSubmit(submissionData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()]
      }));
      setNewLabel("");
    }
  };

  const removeLabel = (labelToRemove) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <CheckSquare className="w-5 h-5 text-blue-700" />
            {issue ? `Edit ${issue.issue_key}` : "Create Issue"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Input
              id="summary"
              value={formData.summary}
              onChange={(e) => handleInputChange("summary", e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Detailed description, acceptance criteria, etc."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_type">Issue Type *</Label>
              <Select
                value={formData.issue_type}
                onValueChange={(value) => handleInputChange("issue_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee_id">Assignee</Label>
              <Select
                value={formData.assignee_id}
                onValueChange={(value) => handleInputChange("assignee_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint_id">Sprint</Label>
              <Select
                value={formData.sprint_id}
                onValueChange={(value) => handleInputChange("sprint_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Backlog</SelectItem>
                  {sprints?.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="story_points">Story Points</Label>
              <Input
                id="story_points"
                type="number"
                min="1"
                max="100"
                value={formData.story_points}
                onChange={(e) => handleInputChange("story_points", e.target.value)}
                placeholder="1, 2, 3, 5, 8, 13..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange("due_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add label"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
              />
              <Button type="button" onClick={addLabel} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.labels.map((label, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeLabel(label)}>
                  {label} ×
                </Badge>
              ))}
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
              {issue ? "Update Issue" : "Create Issue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}