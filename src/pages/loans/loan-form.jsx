import { loanService } from '@/api/loan.service';
import { FieldDisplay } from '@/components/authorization/request-details-view/shared/field-display';
import { LoanUtil } from '@/components/cooperative/loan.utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/utils';
import { format } from 'date-fns';
import { BanIcon, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const LoanForm = ({ showForm, setShowForm, onCancel, loan, loadData }) => {
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    reviewerDecision: '',
    reviewerNote: loan?.reviewerNote || '',
  });

  const [calculations, setCalculations] = useState({
    monthlyDeduction: loan?.monthlyDeduction || 0,
    totalRepayment: loan?.totalRepayment || 0,
    endDate: loan?.endDate ? new Date(loan.endDate) : null,
  });

  useEffect(() => {
    const { principalAmount, interestRate, tenureMonths } = loan;
    if (principalAmount > 0 && interestRate >= 0 && tenureMonths > 0) {
      const calculations = LoanUtil.calculations(loan);

      setCalculations(calculations);
    } else {
      setCalculations({ monthlyDeduction: 0, totalRepayment: 0, endDate: null });
    }
  }, [loan]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoanSubmit = async (e) => {
    try {
      e.preventDefault();

      if (!formData.reviewerNote && formData.reviewerDecision?.toLowerCase() === 'reject') {
        setSubmitError('Kindly provide rejection reason');

        return;
      }

      const response = await loanService.reviewLoan(loan.id, formData);

      toast.success('Success', { description: response.message ?? 'Request submitted successfully' });
      setShowForm(false);
      loadData();
    } catch (error) {
      logger.error({ caller: 'Error saving loan:', payload: error });
      setSubmitError(error.message || 'Unable to complete your request. Kindly contact the system admin');
    }
  };

  return (
    <Dialog open={showForm} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg max-h-[90%] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>{'Review Loan'}</DialogTitle>
          <DialogDescription className="sr-only">View or create loan record</DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <form onSubmit={handleLoanSubmit} className="space-y-8">
            {/* Employee */}
            <div className="space-y-2 flex flex-col">
              {/* <Combobox
                value={formData.employeeId}
                items={employees}
                placeholder="Select employee"
                searchPlaceholder="Search by name or email"
                isLoading={isLoadingEmployees}
                getValue={(_emp) => _emp.id}
                getLabel={(_emp) => `${_emp.firstName} ${_emp.lastName}`}
                getDescription={(_emp) => _emp.staffId}
                onSearchChange={setQuery}
                onSelect={(_emp) => handleInputChange('employeeId', _emp.id)}
                emptyText="No employee found"
              /> */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldDisplay label="Employee" value={`${loan?.employee.firstName} ${loan?.employee?.lastName}`} />
              <FieldDisplay label="Staff ID" value={loan?.employee?.staffId} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldDisplay label="Loan Type" value={loan?.loanType?.name} />
              <FieldDisplay label="Annual Interest Rate" value={`${loan?.interestRate} %`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldDisplay label="Start Date" value={format(loan?.startDate, 'dd-MMM-yyyy')} />
              <FieldDisplay label="End Date" value={format(loan?.endDate, 'dd-MMM-yyyy')} />
              <FieldDisplay label="Tenure (In Months)" value={loan?.tenureMonths} />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Loan Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Loan Amount:</span>{' '}
                <strong>₦{loan?.principalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly Deduction:</span>{' '}
                <strong>₦{calculations.monthlyDeduction.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Repayment:</span>{' '}
                <strong>₦{calculations.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewerNote">Notes</Label>
              <Textarea
                id="reviewerNote"
                value={formData.reviewerNote}
                onChange={(e) => handleInputChange('reviewerNote', e.target.value)}
              />
            </div>

            {submitError ? <div className="flex gap-3 py-2 px-3 rounded-lg text-red-800 bg-red-100">{submitError}</div> : null}

            <div className="flex justify-between gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <div className="flex gap-3">
                {loan?.status?.toUpperCase() === 'PENDING_REVIEW' ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setFormData((prev) => ({ ...prev, reviewerDecision: 'reject' }))}
                    >
                      <BanIcon className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button type="submit" onClick={() => setFormData((prev) => ({ ...prev, reviewerDecision: 'approve' }))}>
                      <Save className="w-4 h-4 mr-1" /> Send for Approval
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
