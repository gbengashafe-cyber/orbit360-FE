import { leaveService } from '@/api';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '@/utils';
import { showToast } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const LEAVE_TYPES = ['annual', 'compassionate', 'study', 'unpaid', 'vacation', 'sick', 'personal', 'maternity', 'paternity'];

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
  const [leaveBalance, setLeaveBalance] = useState({
    allocatedDays: 0,
    calculatedDays: 0,
    remainingDays: 0,
  });
  const [calculating, setCalculating] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch leave balance when employee and leave type are selected
  const fetchLeaveBalance = async (employeeId, leaveType) => {
    if (!employeeId || !leaveType) return;
    
    try {
      const response = await leaveService.getLeaveBalance(employeeId);
      if (response?.data) {
        const balance = response.data.find(b => b.leaveType === leaveType);
        if (balance) {
          setLeaveBalance({
            allocatedDays: balance.totalDays || 0,
            calculatedDays: 0,
            remainingDays: balance.remainingDays || 0,
          });
        }
      }
    } catch (error) {
      logger.error({ caller: 'Error fetching leave balance', payload: error });
    }
  };

  // Auto-calculate days when dates change
  useEffect(() => {
    const calculateDays = async () => {
      if (!formData.employeeId || !formData.type || !formData.startDate || !formData.endDate) {
        setLeaveBalance(prev => ({ ...prev, calculatedDays: 0, remainingDays: prev.allocatedDays }));
        return;
      }

      setCalculating(true);
      try {
        const response = await leaveService.calculateLeaveDays({
          employeeId: parseInt(formData.employeeId),
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });

        if (response?.data) {
          setLeaveBalance({
            allocatedDays: response.data.allocatedDays || 0,
            calculatedDays: response.data.calculatedDays || 0,
            remainingDays: response.data.remainingDays || 0,
          });
        }
      } catch (error) {
        logger.error({ caller: 'Error calculating leave days', payload: error });
      } finally {
        setCalculating(false);
      }
    };

    const debounceTimer = setTimeout(calculateDays, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.employeeId, formData.type, formData.startDate, formData.endDate]);

  // Fetch balance when employee or type changes
  useEffect(() => {
    fetchLeaveBalance(formData.employeeId, formData.type);
  }, [formData.employeeId, formData.type]);

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

      {(formData.employeeId && formData.type) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Allocated Days:</span>
            <span className="text-sm font-semibold text-blue-600">{leaveBalance.allocatedDays} days</span>
          </div>
          {(formData.startDate && formData.endDate) && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Days Selected:</span>
                <span className="flex items-center gap-2">
                  {calculating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                  <span className="text-sm font-semibold text-green-600">{leaveBalance.calculatedDays} days</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Remaining Days:</span>
                <span className={`text-sm font-semibold ${leaveBalance.remainingDays >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {leaveBalance.remainingDays} days
                </span>
              </div>
            </>
          )}
        </div>
      )}

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
