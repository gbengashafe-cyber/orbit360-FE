// import RequestDetailsView from '@/components/authorization/RequestDetailsView';
import { RequestDetailsView } from '@/components/authorization/request-details-view';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PENDING_STATES } from '@/constants/pendingState';
import { DialogDescription } from '@radix-ui/react-dialog';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export const AuthorizationViewDialog = ({
  moduleName,
  onOpenChange,
  viewingItem,
  canAuthorize,
  handleAuthorize,
  authorizing,
  setApprovalNote,
  approverNote,
}) => {
  return (
    <Dialog open={!!viewingItem} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-y-0 p-0">
        <DialogHeader className="sticky top-0 z-10 px-6 py-4">
          <DialogTitle className="text-xl font-bold capitalize">{moduleName}: Approval</DialogTitle>
          <DialogDescription className="sr-only">Viewing full details for the selected {moduleName}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 py-4">
          {viewingItem && (
            <div className="space-y-6">
              <RequestDetailsView item={viewingItem} moduleName={moduleName} />

              {/* Notes */}
              <form>
                <div className="space-y-2">
                  <Label htmlFor="reviewerNote">Notes</Label>
                  <Textarea id="reviewerNote" value={approverNote} onChange={(e) => setApprovalNote(e.target.value)} />
                </div>
              </form>

              <div className="pt-4 border-t space-y-3 bg-gray-50 p-4 rounded-lg -mx-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created Date</p>
                    <p className="text-gray-900">{new Date(viewingItem.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created By/Reviewed By</p>
                    <p className="text-gray-900">
                      {['LOANS'].includes(moduleName?.toUpperCase())
                        ? `${viewingItem.reviewer?.firstName} ${viewingItem.reviewer?.lastName}`
                        : `${viewingItem.initiator?.firstName} ${viewingItem.initiator?.lastName}`}
                    </p>
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
          <DialogFooter className="sticky bottom-0 z-10">
            {viewingItem && canAuthorize && PENDING_STATES.includes(viewingItem.status?.toLowerCase()) ? (
              <div className="flex w-full gap-3 pt-4 border-t">
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
