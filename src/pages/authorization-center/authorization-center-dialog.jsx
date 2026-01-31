import RequestDetailsView from '@/components/authorization/RequestDetailsView';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PENDING_STATES } from '@/constants/pendingState';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export const AuthorizationViewDialog = ({ onOpenChange, viewingItem, canAuthorize, handleAuthorize, authorizing }) => {
  return (
    <Dialog open={!!viewingItem} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{viewingItem?.type} - Full Details</DialogTitle>
        </DialogHeader>
        {viewingItem && (
          <div className="space-y-6">
            <RequestDetailsView item={viewingItem} />

            <div className="pt-4 border-t space-y-3 bg-gray-50 p-4 rounded-lg -mx-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created Date</p>
                  <p className="text-gray-900">{new Date(viewingItem.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created By</p>
                  <p className="text-gray-900">
                    {viewingItem.initiator?.firstName} {viewingItem.initiator?.lastName}
                  </p>
                </div>
                {viewingItem.approved_by && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approved By</p>
                      <p className="text-gray-900">{viewingItem.approved_by}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approval Date</p>
                      <p className="text-gray-900">
                        {viewingItem.approved_date ? new Date(viewingItem.approved_date).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {canAuthorize && PENDING_STATES.includes(viewingItem.status?.toLowerCase()) && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleAuthorize(viewingItem, 'approve')}
                  disabled={authorizing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {authorizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Authorize
                </Button>
                <Button
                  onClick={() => handleAuthorize(viewingItem, 'reject')}
                  disabled={authorizing}
                  variant="destructive"
                  className="flex-1"
                >
                  {authorizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
