import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getTransactionProps } from './authorization-center.util';
import { RequestDetailsView } from './request-details-view';
import { LoanUtil } from '@/components/cooperative/loan.utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PENDING_STATES } from '@/constants/pendingState';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export const AuthorizationViewDialog = ({
  moduleName,
  onOpenChange,
  viewingItem,
  canAuthorize,
  handleAuthorize,
  authorizeError,
  authorizing,
  setApprovalNote,
  approverNote,
}) => {
  const { initiator } = getTransactionProps(viewingItem, moduleName);
  return (
    <Dialog open={!!viewingItem} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-y-0 p-0">
        <DialogHeader className="sticky top-0 p-6 border-b">
          <DialogTitle className="text-xl font-bold capitalize">{moduleName}: Approval</DialogTitle>
          <DialogDescription className="sr-only">Viewing full details for the selected {moduleName}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 pt-6 overflow-y-auto">
          {viewingItem && (
            <div className="space-y-6 px-6">
              <RequestDetailsView
                item={
                  moduleName?.toLowerCase() === 'loans'
                    ? { ...viewingItem, _calculations: LoanUtil.calculations(viewingItem) }
                    : viewingItem
                }
                moduleName={moduleName}
              />

              {/* Notes */}
              <form>
                <div className="space-y-2">
                  <Label htmlFor="approverNote">Notes</Label>
                  <Textarea id="approverNote" value={approverNote} onChange={(e) => setApprovalNote(e.target.value)} />
                </div>
              </form>

              {authorizeError ? <div className="text-red-900 bg-red-100 rounded-lg py-2 px-3">{authorizeError}</div> : null}

              <div className="pt-4 border-t space-y-3 bg-gray-50 p-4 rounded-lg -mx-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created Date</p>
                    <p className="text-gray-900">{new Date(viewingItem.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created By/Reviewed By</p>
                    <p className="text-gray-900">{initiator}</p>
                  </div>
                  {viewingItem.approvedBy && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approved By</p>
                        <p className="text-gray-900">{viewingItem.approvedBy}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approval Date</p>
                        <p className="text-gray-900">
                          {viewingItem.approvedDate ? new Date(viewingItem.approvedDate).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 bg-white z-10 border-t">
            {viewingItem && canAuthorize && PENDING_STATES.includes(viewingItem.status?.toLowerCase()) ? (
              <div className="gap-3 p-6 flex w-full">
                <Button
                  onClick={() => handleAuthorize(viewingItem, 'approve', moduleName)}
                  disabled={authorizing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {authorizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Authorize
                </Button>
                <Button
                  onClick={() => handleAuthorize(viewingItem, 'reject', moduleName)}
                  disabled={authorizing}
                  variant="destructive"
                  className="flex-1"
                >
                  {authorizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
              </div>
            ) : null}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
