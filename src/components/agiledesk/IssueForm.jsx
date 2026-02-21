
import React, { useState, useEffect, useCallback } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IssueComment } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { X, Save, BookOpen, CheckSquare, Bug, Zap, Minus, ArrowUp, Paperclip, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";

const ISSUE_TYPES = [
  { value: "epic", label: "Epic", icon: BookOpen },
  { value: "story", label: "Story", icon: Zap },
  { value: "task", label: "Task", icon: CheckSquare },
  { value: "bug", label: "Bug", icon: Bug },
  { value: "subtask", label: "Subtask", icon: Minus },
  { value: "improvement", label: "Improvement", icon: ArrowUp }
];

const PRIORITIES = [
  { value: "highest", label: "Highest" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "lowest", label: "Lowest" }
];

const STORY_POINTS = [0, 1, 2, 3, 5, 8, 13, 21];

export default function IssueForm({ issue, project, teamMembers, sprints, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    issue || {
      summary: "",
      description: "",
      issue_type: "task",
      priority: "medium",
      assignee_id: "",
      reporter_id: "",
      sprint_id: "",
      story_points: 0,
      labels: [],
      attachments: []
    }
  );

  const [newLabel, setNewLabel] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!issue?.id) return;
    try {
      const issueComments = await IssueComment.filter({ issue_id: issue.id }, '-created_date');
      setComments(issueComments);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  }, [issue?.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange("attachments", [...(formData.attachments || []), file_url]);
    } catch (error) {
      console.error("File upload failed:", error);
    } finally {
      setUploading(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !issue?.id) return;
    try {
      await IssueComment.create({
        issue_id: issue.id,
        content: newComment,
        // author_id is set by backend
      });
      setNewComment("");
      loadComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLabel = () => {
    if (newLabel && !formData.labels.includes(newLabel)) {
      handleInputChange("labels", [...formData.labels, newLabel]);
      setNewLabel("");
    }
  };

  const removeLabel = (labelToRemove) => {
    handleInputChange("labels", formData.labels.filter(label => label !== labelToRemove));
  };

  const activeSprints = sprints.filter(sprint => sprint.status === 'active' || sprint.status === 'future');

  return (
    <div className="flex flex-col max-h-[90vh]">
      <DialogHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">
                {issue ? `Edit ${issue.issue_key}` : "Create New Issue"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-4 h-4" />
            </Button>
        </div>
      </DialogHeader>
      <div className="py-6 pr-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Input id="summary" value={formData.summary} onChange={(e) => handleInputChange("summary", e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={5} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Issue Type *</Label>
              <Select value={formData.issue_type} onValueChange={(value) => handleInputChange("issue_type", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2"><Icon className="w-4 h-4" /> {type.label}</div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={formData.assignee_id} onValueChange={(value) => handleInputChange("assignee_id", value)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reporter</Label>
              <Select value={formData.reporter_id} onValueChange={(value) => handleInputChange("reporter_id", value)}>
                <SelectTrigger><SelectValue placeholder="Select reporter" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {project.methodology === 'scrum' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Sprint</Label>
                <Select value={formData.sprint_id} onValueChange={(value) => handleInputChange("sprint_id", value)}>
                  <SelectTrigger><SelectValue placeholder="Backlog" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Backlog</SelectItem>
                    {activeSprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Story Points</Label>
                <Select value={formData.story_points?.toString()} onValueChange={(value) => handleInputChange("story_points", parseInt(value))}>
                  <SelectTrigger><SelectValue placeholder="Estimate points" /></SelectTrigger>
                  <SelectContent>
                    {STORY_POINTS.map((points) => (
                      <SelectItem key={points} value={points.toString()}>{points} points</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex gap-2">
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())} />
              <Button type="button" onClick={addLabel} variant="outline">Add</Button>
            </div>
            {formData.labels?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.labels.map((label) => (
                  <Badge key={label} variant="secondary" onClick={() => removeLabel(label)} className="cursor-pointer">{label} &times;</Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Paperclip className="w-4 h-4"/> Attachments</Label>
            <div className="p-4 border border-dashed rounded-lg">
              <Input type="file" onChange={handleFileUpload} disabled={uploading} />
              {uploading && <div className="flex items-center gap-2 text-sm text-gray-500 mt-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</div>}
            </div>
            {formData.attachments?.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {formData.attachments.map((url, index) => (
                  <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="text-blue-600 text-sm hover:underline truncate">
                    {url.split('/').pop().split('?')[0]}
                  </a>
                ))}
              </div>
            )}
          </div>
          
          {issue?.id && (
            <div className="space-y-4 pt-4 border-t">
              <Label className="flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Comments</Label>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {comments.map(comment => {
                  const author = teamMembers.find(m => m.id === comment.author_id);
                  return (
                    <div key={comment.id} className="text-sm">
                      <div className="font-bold">{author?.full_name || 'User'} <span className="text-xs text-gray-400 font-normal">{format(new Date(comment.created_date), 'MMM d, yyyy')}</span></div>
                      <p className="bg-gray-50 p-2 rounded-md">{comment.content}</p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." rows={2} />
                <Button type="button" onClick={handleAddComment}>Comment</Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white py-4 -mx-6 px-6">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
              <Save className="w-4 h-4 mr-2" />
              {issue ? "Update Issue" : "Create Issue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
