'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface CompanyNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyNameSubmit: (companyName: string) => void;
}

export function CompanyNameDialog({
  open,
  onOpenChange,
  onCompanyNameSubmit,
}: CompanyNameDialogProps) {
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = () => {
    if (companyName.trim()) {
      onCompanyNameSubmit(companyName.trim());
      setCompanyName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription>
            Please enter the company name for this chat session.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!companyName.trim()}>
            Start Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 