import { leaveService } from '@/api';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '@/utils';
import { showToast } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const LEAVE_TYPES = ['vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid', 'other'];

export default function LeaveRequestForm({ onSubmit, onCancel, employees }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError('');

    if (!formData.employeeId || !formData.type || !formData.startDate || !formData.endDate) {
      setFormError('Please fill in all required fields', 'Validation Error');

      return;
    }

    setLoading(true);
    try {
      const response = await leaveService.createLeave({
        employeeId: parseInt(formData.employeeId),
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });

      setFormData({
        employeeId: '',
        type: '',
        startDate: '',
        endDate: '',
        reason: '',
      });

      showToast.success('Leave request submitted successfully!', 'Success');
      onSubmit(response);
    } catch (error) {
      logger.error({ caller: 'Error submitting leave request', payload: error });
      setFormError(error.response?.data?.message || error.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <Label htmlFor="employeeId">Employee *</Label>
        <Select value={formData.employeeId} onValueChange={(value) => handleInputChange('employeeId', value)}>
          <SelectTrigger id="employeeId">
            <SelectValue placeholder="Select an employee..." />
          </SelectTrigger>
          <SelectContent>
            {employees?.map((emp) => (
              <SelectItem key={emp.id} value={String(emp.id)}>
                {emp.firstName || emp.first_name} {emp.lastName || emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="type">Leave Type *</Label>
        <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select leave type..." />
          </SelectTrigger>
          <SelectContent>
            {LEAVE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="startDate">Start Date *</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleInputChange('startDate', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="endDate">End Date *</Label>
        <Input
          id="endDate"
          type="date"
          value={formData.endDate}
          onChange={(e) => handleInputChange('endDate', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="reason">Reason</Label>
        <textarea
          id="reason"
          rows="3"
          value={formData.reason}
          onChange={(e) => handleInputChange('reason', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Reason for leave request..."
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Submit Request
        </Button>
      </DialogFooter>
    </form>
  );
}
