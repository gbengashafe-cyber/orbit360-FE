import { AlertCircle, CheckCircle2, Clock, Info, Loader2 } from 'lucide-react';
import { Toaster as Sonner, toast } from 'sonner';

/*
 * The app's only toast system (DESIGN.md §6 Toasts).
 * - Five tones: toast.success, toast.error, toast.info, toast.warning (pending tone) and toast() (neutral).
 * - One shape: icon, title, one line of text, close button. No actions (hidden by CSS in index.css).
 * - Errors stay until dismissed; everything else closes after 5 seconds.
 * Colours and layout live in index.css under "Toasts (Sonner)".
 */

// Errors stay on screen until the user dismisses them, wherever toast.error is called from.
if (!toast.error.__orbitSticky) {
  const showError = toast.error;
  toast.error = Object.assign((message, options) => showError(message, { duration: Infinity, ...options }), {
    __orbitSticky: true,
  });
}

const icons = {
  success: <CheckCircle2 className="h-[18px] w-[18px]" />,
  error: <AlertCircle className="h-[18px] w-[18px]" />,
  info: <Info className="h-[18px] w-[18px]" />,
  warning: <Clock className="h-[18px] w-[18px]" />,
  loading: <Loader2 className="h-[18px] w-[18px] animate-spin" />,
};

const Toaster = (props) => (
  <Sonner theme="light" position="top-right" richColors closeButton duration={5000} visibleToasts={4} icons={icons} {...props} />
);

export { Toaster };
