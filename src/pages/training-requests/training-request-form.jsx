import { trainingService } from '@/api';
import { FormSubmitErrorV1 } from '@/components/shared/submit-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

export const TrainingRequestForm = ({ showForm, onOpenChange }) => {
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    trainingType: '',
    trainingTitle: '',
    trainingDescription: '',
    businessJustification: '',
    skillsToGain: '',
    preferredDeliveryMethod: '',
    preferredTimeframe: '',
    estimatedDuration: '',
    estimatedCost: '',
    externalProvider: '',
    priority: 'medium',
    requestScope: 'self',
    teamCount: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError('');

    try {
      const response = await trainingService.submitRequest(formData);
      toast.success('Success', {
        description: response?.data?.message || 'Your training request has been submitted successfully!',
      });

      onOpenChange();
    } catch (error) {
      const errorMessage = error?.message || 'Failed to submit training request. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={showForm} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Training Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="training_type">Training Type *</Label>
              <Select
                value={formData.trainingType?.toUpperCase()}
                onValueChange={(value) => handleInputChange('trainingType', value?.toUpperCase())}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNICAL SKILLS">Technical Skills</SelectItem>
                  <SelectItem value="SOFT SKILLS">Soft Skills</SelectItem>
                  <SelectItem value="LEADERSHIP">Leadership</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="CERTIFICATION">Certification</SelectItem>
                  <SelectItem value="PROFESSIONAL DEVELOPMENT">Professional Development</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestScope">Request Scope</Label>
            <Select value={formData.requestScope} onValueChange={(value) => handleInputChange('requestScope', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SELF">Self</SelectItem>
                <SelectItem value="TEAM">Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.requestScope === 'team' && (
            <div className="space-y-2">
              <Label htmlFor="numberOfTeamMembers">Number of Team Members *</Label>
              <Input
                id="numberOfTeamMembers"
                type="number"
                min="1"
                value={formData.numberOfTeamMembers}
                onChange={(e) => handleInputChange('numberOfTeamMembers', e.target.value)}
                placeholder="Enter number of team members"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="trainingTitle">Training Title *</Label>
            <Input
              id="trainingTitle"
              value={formData.trainingTitle}
              onChange={(value) => handleInputChange('trainingTitle', value.target.value)}
              placeholder="e.g., Advanced Excel Training"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trainingDescription">Training Description *</Label>
            <Textarea
              id="trainingDescription"
              value={formData.trainingDescription}
              onChange={(e) => handleInputChange('trainingDescription', e.target.value)}
              placeholder="Describe the training content..."
              className="h-24"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessJustification">Business Justification</Label>
            <Textarea
              id="businessJustification"
              value={formData.businessJustification}
              onChange={(e) => handleInputChange('businessJustification', e.target.value)}
              placeholder="Explain how this benefits..."
              className="h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skillsToGain">Skills to Gain</Label>
            <Textarea
              id="skillsToGain"
              value={formData.skillsToGain}
              onChange={(e) => handleInputChange('skillsToGain', e.target.value)}
              placeholder="List expected skills..."
              className="h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryMethod">Delivery Method</Label>
              <Select value={formData.deliveryMethod} onValueChange={(value) => handleInputChange('deliveryMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="IN_PERSON">In-Person</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredTimeframe">Preferred Timeframe</Label>
              <Select
                value={formData.preferredTimeframe}
                onValueChange={(value) => handleInputChange('preferredTimeframe', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="When?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="within_month">Within 1 Month</SelectItem>
                  <SelectItem value="within_quarter">Within 3 Months</SelectItem>
                  <SelectItem value="within_6_months">Within 6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Duration</Label>
              <Input
                id="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                placeholder="e.g., 8 hours"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Cost (₦)</Label>
              <Input
                id="estimatedCost"
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainingProvider">Provider</Label>
              <Input
                id="trainingProvider"
                value={formData.trainingProvider}
                onChange={(e) => handleInputChange('trainingProvider', e.target.value)}
                placeholder="e.g., Udemy"
              />
            </div>
          </div>

          {error ? <FormSubmitErrorV1>{error}</FormSubmitErrorV1> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onOpenChange}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
