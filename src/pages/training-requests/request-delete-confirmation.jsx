import { trainingService } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { logger } from '@/utils';
import { useState } from 'react';
import { toast } from 'sonner';

export const RequestDeleteConfirmation = ({ onOpenChange, requestToDelete, loadData }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteRequest = async (requestId) => {
    setDeleting(true);
    try {
      const response = await trainingService.deleteRequest(requestId);

      toast.success('Success', { description: response.message || 'Request deleted successfully!' });
      loadData();
      onOpenChange();
    } catch (err) {
      toast.error('Error', { description: err.message || 'Failed to delete request' });
      logger.error({ caller: 'Error deleting request', payload: err });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={!!requestToDelete} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        This will permanently delete the training request:
        <p className="text-red-600 font-medium">{requestToDelete?.trainingTitle}</p>
        <p>This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onOpenChange}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              handleDeleteRequest(requestToDelete?.id);
            }}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Confirm Deletion'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
