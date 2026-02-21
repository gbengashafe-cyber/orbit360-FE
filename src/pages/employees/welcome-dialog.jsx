import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export const WelcomeDialog = ({ shouldOpen, setShouldOpen, welcomeInfo }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    // Remove HTML tags and convert to plain text for clipboard
    const plainTextInstructions = welcomeInfo.instructions
      .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newlines
      .replace(/<\/?(h[1-6]|p|div|ul|ol|li)[^>]*>/gi, '\n') // Replace block tags with newlines
      .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
      .replace(/\n\s*\n/g, '\n\n') // Consolidate multiple newlines
      .trim();

    navigator.clipboard.writeText(
      `To: ${welcomeInfo.email}\nSubject: Welcome to Orbit360 - Your Employee Portal Account\n\n${plainTextInstructions}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog open={shouldOpen} onOpenChange={setShouldOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Account Created Successfully!</DialogTitle>
          <DialogDescription>
            A user account has been created for the new employee. Please copy the instructions below and send them to the employee
            using your own email client. This ensures personalized communication.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 my-4">
          <div className="text-sm">
            <strong>To:</strong> {welcomeInfo.email}
          </div>
          <div className="text-sm">
            <strong>Subject:</strong> Welcome to Orbit360 - Your Employee Portal Account
          </div>
          <div
            className="p-4 bg-gray-100 rounded-lg border text-sm max-h-60 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: welcomeInfo.instructions }}
          />
        </div>
        <DialogFooter className="sm:justify-start">
          <Button onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Email Content'}
          </Button>
          <Button variant="secondary" onClick={() => setShouldOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
