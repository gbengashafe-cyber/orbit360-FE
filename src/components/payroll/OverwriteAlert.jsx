import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function PayrollOverwriteAlert({ isOpen, setIsOpen, currentPeriod, overwrite }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Payroll Exists</AlertDialogTitle>
          <AlertDialogDescription>{`Payroll for ${new Date(currentPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} already exists. Do you want to regenerate it?`}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={overwrite}>
            Yes, Overwrite
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
