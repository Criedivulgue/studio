'use client';

// FINAL CORRECTION: Added useEffect to the import statement.
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { ChatSession } from '@/lib/types';

interface LeadIdentificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  adminId: string;
}

const identifyLeadFunction = httpsCallable(functions, 'identifyLead');

export function LeadIdentificationModal({ isOpen, onClose, session, adminId }: LeadIdentificationModalProps) {
  const [name, setName] = useState(session.visitorName || '');
  const [email, setEmail] = useState(session.visitorEmail || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ title: 'Validation Error', description: 'Please provide a name and email for the contact.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      await identifyLeadFunction({
        sessionId: session.id,
        adminId: adminId,
        contactData: {
          name: name,
          email: email,
        },
      });

      toast({ title: 'Success', description: `Contact ${name} has been created and the conversation has been migrated.` });
      onClose();

    } catch (error: any) {
      console.error("Error identifying lead:", error);
      toast({ title: 'Error', description: error.message || 'Could not identify the lead. Please try again.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when the session or isOpen status changes
  useEffect(() => {
    if (isOpen) {
      setName(session.visitorName || '');
      setEmail(session.visitorEmail || '');
    }
  }, [session, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Identify Lead</DialogTitle>
          <DialogDescription>
            Create a new contact from this anonymous chat. The chat history will be permanently saved and associated with this new contact.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button type="submit" disabled={!name || !email || isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
