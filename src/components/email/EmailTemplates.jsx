import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmailTemplate } from "@/api/entities";
import { LayoutTemplate, Plus, Save, X, Edit, Trash2 } from "lucide-react";

function TemplateForm({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    template || { name: "", subject: "", content: "" }
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="mt-6 border-blue-200">
      <CardHeader>
        <CardTitle>{template ? "Edit Template" : "Create New Template"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={6}
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function EmailTemplates({ templates, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleSave = async (templateData) => {
    try {
      if (editingTemplate) {
        await EmailTemplate.update(editingTemplate.id, templateData);
      } else {
        await EmailTemplate.create(templateData);
      }
      setShowForm(false);
      setEditingTemplate(null);
      onRefresh();
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Could not save template. Please try again.");
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (templateId) => {
     if (window.confirm("Are you sure you want to delete this template?")) {
        try {
            await EmailTemplate.delete(templateId);
            onRefresh();
        } catch (error) {
            console.error("Failed to delete template:", error);
            alert("Could not delete the template. Please try again.");
        }
     }
  }

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl shadow-gray-200/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-blue-700" />
          Email Templates
        </CardTitle>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showForm && (
          <TemplateForm
            template={editingTemplate}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
        
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
              </CardContent>
              <div className="p-4 border-t flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
              </div>
            </Card>
          ))}
        </div>

        {!showForm && templates.length === 0 && (
          <div className="text-center p-12 text-gray-500">
             <LayoutTemplate className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2 text-gray-700">No Email Templates</h3>
            <p className="mb-4">Create your first template to get started.</p>
            <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}