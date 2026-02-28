import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const ApprovalActionDialog = ({
    open,
    action,
    rejectionReason,
    isLoading = false,
    onReasonChange,
    onClose,
    onConfirm,
}) => {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                onClose();
            }
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {action === 'approve' ? 'Approve Deletion Request' : 'Reject Deletion Request'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <p className="text-gray-700">
                        {action === 'approve'
                            ? 'This will permanently delete the document/folder. This action cannot be undone.'
                            : 'The deletion request will be rejected and the document/folder will remain intact.'}
                    </p>
                    {action === 'reject' && (
                        <div>
                            <Label htmlFor="rejection-reason" className="text-red-600">Rejection Reason (Required)</Label>
                            <textarea
                                id="rejection-reason"
                                autoFocus
                                value={rejectionReason}
                                disabled={isLoading}
                                onChange={(e) => onReasonChange(e.target.value)}
                                placeholder="Explain why this deletion request is being rejected..."
                                className="w-full p-2 border rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                rows={3}
                                spellCheck="true"
                            />
                        </div>
                    )}
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isLoading}
                            className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            onClick={onConfirm}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isLoading ? (action === 'approve' ? 'Approving...' : 'Rejecting...') : (action === 'approve' ? 'Approve' : 'Reject')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApprovalActionDialog;
